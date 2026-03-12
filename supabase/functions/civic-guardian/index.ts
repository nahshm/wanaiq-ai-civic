/**
 * civic-guardian/index.ts
 *
 * WAAS Phase 1 — Guardian Agent (Content Moderator)
 *
 * PURPOSE: Protect the WanaIQ civic discourse space by moderating
 * posts and comments in real-time. Uses Groq/Llama3 as the
 * reasoning engine. In all failure cases, falls back to human
 * review rather than blocking citizen participation.
 *
 * TRIGGERED BY:
 *   1. Supabase DB Webhook on posts INSERT  (immediate, real-time)
 *   2. Supabase DB Webhook on comments INSERT (immediate, real-time)
 *   3. pg_cron every 5 minutes              (catch-up scan for missed items)
 *   4. Manual API call from admin UI
 *
 * TOOLS (database actions it can take):
 *   - hideContent(post|comment)             → sets is_hidden=true
 *   - issueWarning(user_id)                 → inserts into user_warnings
 *   - queueForReview(content_id)            → inserts into moderation_logs
 *   - emitEvent(violation_detected)         → agent_events bus
 *   - createProposal(ban)                   → agent_proposals for Minion
 *
 * GRACEFUL FALLBACK:
 *   If the Groq API is unavailable, rate-limited, or returns malformed
 *   JSON, Guardian logs the failure and queues the content for human
 *   review. It NEVER blocks a user's post without reasoning.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  agentCorsHeaders,
  jsonResponse,
  logAgentRun,
  emitEvent,
  createProposal,
  hideContent,
  issueWarning,
  getUserStrikeCount,
  getAgentState,
  parseGroqJson,
} from "../_shared/agentUtils.ts";

const AGENT_NAME = "civic-guardian";
const GROQ_MODEL = "llama-3.1-8b-instant";  // Fast model for real-time moderation
const MAX_CONTENT_LENGTH = 10_000;
const SCAN_BATCH_SIZE = 50; // Items per cron scan

// ─── LLM Decision Types ────────────────────────────────────────────────────────

interface GuardianVerdict {
  verdict: "APPROVED" | "REVIEW" | "BLOCKED";
  severity: "none" | "low" | "medium" | "high" | "critical";
  confidence: number; // 0.0–1.0
  flags: string[];    // e.g. ['hate_speech','ethnic_incitement','pii']
  reasoning: string;  // short explanation stored for audit
  suggested_action: "none" | "warn" | "hide" | "ban_propose";
}

interface ContentItem {
  id: string;
  content: string | null;
  body?: string | null;
  user_id: string;
  type: "post" | "comment";
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: agentCorsHeaders });
  }

  const startTime = Date.now();

  // Build service-role client — Guardian acts as a system agent, not a user
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const groqApiKey = Deno.env.get("GROQ_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(`[${AGENT_NAME}] Missing Supabase env vars`);
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  const serviceClient: any = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  if (!groqApiKey) {
    // Groq key missing — this is a hard failure. Log it and exit.
    await logAgentRun(serviceClient, AGENT_NAME, {
      trigger_type: "api",
      status: "failed",
      error_summary: "GROQ_API_KEY not configured",
    });
    return jsonResponse({ error: "GROQ_API_KEY not configured" }, 500);
  }

  // ── Parse trigger type ───────────────────────────────────────────────────────

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // cron triggers may send empty body — that's fine
  }

  // Supabase DB Webhooks send a "type" field ('INSERT') and "record"
  const isWebhook = body?.type === "INSERT" && body?.record;
  const isCronScan = body?.trigger === "cron" || Object.keys(body).length === 0;
  const isManual = body?.trigger === "manual";

  const triggerType = isWebhook ? "webhook" : isCronScan ? "cron" : "api";

  let itemsScanned = 0;
  let itemsActioned = 0;
  let itemsFailed = 0;

  try {
    // ── Load agent thresholds from agent_state ─────────────────────────────────
    const autoActionThreshold =
      (await getAgentState(serviceClient, AGENT_NAME, "auto_action_threshold") as number) ?? 0.90;
    const reviewThreshold =
      (await getAgentState(serviceClient, AGENT_NAME, "review_threshold") as number) ?? 0.60;
    const repeatOffenderStrikes =
      (await getAgentState(serviceClient, AGENT_NAME, "repeat_offender_strikes") as number) ?? 3;

    // ── Load prompt override from agent_state ──────────────────────────────────
    const promptOverride = await getAgentState(serviceClient, AGENT_NAME, "system_prompt") as string | null;

    if (isWebhook) {
      // ── Webhook path: single new post or comment ───────────────────────────
      const record = body.record as Record<string, unknown>;
      const tableType = (body.table as string) === "posts" ? "post" : "comment";

      const item: ContentItem = {
        id: record.id as string,
        content: (record.content ?? record.body) as string | null,
        body: record.body as string | null,
        user_id: (record.user_id ?? record.author_id) as string,
        type: tableType,
      };

      itemsScanned = 1;
      const actioned = await processContentItem(
        serviceClient,
        groqApiKey,
        item,
        autoActionThreshold,
        reviewThreshold,
        repeatOffenderStrikes,
        promptOverride
      );
      if (actioned === "actioned") itemsActioned++;
      if (actioned === "failed") itemsFailed++;

    } else {
      // ── Cron/Manual path: scan recent unprocessed items ────────────────────
      const results = await runCatchUpScan(
        serviceClient,
        groqApiKey,
        autoActionThreshold,
        reviewThreshold,
        repeatOffenderStrikes,
        promptOverride
      );
      itemsScanned = results.scanned;
      itemsActioned = results.actioned;
      itemsFailed = results.failed;
    }

    const duration = Date.now() - startTime;

    await logAgentRun(serviceClient, AGENT_NAME, {
      trigger_type: triggerType,
      items_scanned: itemsScanned,
      items_actioned: itemsActioned,
      items_failed: itemsFailed,
      duration_ms: duration,
      status: itemsFailed > 0 && itemsActioned === 0 ? "partial" : "success",
    });

    return jsonResponse({
      agent: AGENT_NAME,
      trigger: triggerType,
      items_scanned: itemsScanned,
      items_actioned: itemsActioned,
      items_failed: itemsFailed,
      duration_ms: duration,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[${AGENT_NAME}] Fatal error:`, message);

    await logAgentRun(serviceClient, AGENT_NAME, {
      trigger_type: triggerType,
      items_scanned: itemsScanned,
      items_actioned: itemsActioned,
      items_failed: itemsFailed + 1,
      duration_ms: Date.now() - startTime,
      status: "failed",
      error_summary: message.slice(0, 500),
    });

    return jsonResponse({ error: "Guardian encountered an internal error", detail: message }, 500);
  }
});

// ─── Cron Catch-Up Scan ───────────────────────────────────────────────────────

async function runCatchUpScan(
  serviceClient: ReturnType<typeof createClient>,
  groqApiKey: string,
  autoActionThreshold: number,
  reviewThreshold: number,
  repeatOffenderStrikes: number,
  promptOverride?: string | null
): Promise<{ scanned: number; actioned: number; failed: number }> {
  let scanned = 0, actioned = 0, failed = 0;

  // Scan recent posts that are not yet hidden (Guardian may not have seen them)
  // Look back 6 minutes to safely overlap with 5-min cron interval
  const since = new Date(Date.now() - 6 * 60 * 1000).toISOString();

  const { data: posts, error: postsErr } = await (serviceClient as any)
    .from("posts")
    .select("id, content, author_id")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(SCAN_BATCH_SIZE);

  if (postsErr) {
    console.error(`[${AGENT_NAME}] Scan posts error:`, postsErr.message);
    failed++;
  } else {
    for (const post of posts ?? []) {
      scanned++;
      const result = await processContentItem(
        serviceClient, groqApiKey,
        { id: post.id, content: post.content, user_id: post.author_id, type: "post" },
        autoActionThreshold, reviewThreshold, repeatOffenderStrikes, promptOverride
      );
      if (result === "actioned") actioned++;
      if (result === "failed") failed++;
    }
  }

  // Scan recent comments
  const { data: comments, error: commentsErr } = await (serviceClient as any)
    .from("comments")
    .select("id, content, author_id")
    .eq("is_hidden", false)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(SCAN_BATCH_SIZE);

  if (commentsErr) {
    console.error(`[${AGENT_NAME}] Scan comments error:`, commentsErr.message);
    failed++;
  } else {
    for (const comment of comments ?? []) {
      scanned++;
      const result = await processContentItem(
        serviceClient, groqApiKey,
        { id: comment.id, content: comment.content, user_id: comment.author_id, type: "comment" },
        autoActionThreshold, reviewThreshold, repeatOffenderStrikes, promptOverride
      );
      if (result === "actioned") actioned++;
      if (result === "failed") failed++;
    }
  }

  return { scanned, actioned, failed };
}

// ─── Core: Process a Single Content Item ─────────────────────────────────────

async function processContentItem(
  serviceClient: ReturnType<typeof createClient>,
  groqApiKey: string,
  item: ContentItem,
  autoActionThreshold: number,
  reviewThreshold: number,
  repeatOffenderStrikes: number,
  promptOverride?: string | null
): Promise<"approved" | "actioned" | "failed" | "queued"> {
  const rawText = (item.content ?? item.body ?? "").trim();

  // Skip empty content
  if (!rawText) return "approved";

  // Truncate extremely long content for LLM (avoid token explosion)
  const truncatedText = rawText.slice(0, MAX_CONTENT_LENGTH);

  // ── Call Groq LLM ──────────────────────────────────────────────────────────
  let verdict: GuardianVerdict | null = null;

  try {
    verdict = await getGuardianVerdict(groqApiKey, truncatedText, item.type, promptOverride);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error(`[${AGENT_NAME}] LLM call failed for ${item.type} ${item.id}:`, msg);

    // GRACEFUL FALLBACK: LLM unavailable → queue for human review
    await queueForHumanReview(
      serviceClient, item, "llm_unavailable",
      `Guardian LLM failure: ${msg.slice(0, 200)}`
    );
    return "queued";
  }

  // ── Handle null/malformed verdict ─────────────────────────────────────────
  if (!verdict) {
    console.warn(`[${AGENT_NAME}] Malformed verdict for ${item.type} ${item.id} — queuing`);
    await queueForHumanReview(
      serviceClient, item, "malformed_verdict", "LLM returned unparseable response"
    );
    return "queued";
  }

  // ── APPROVED: no action needed ─────────────────────────────────────────────
  if (verdict.verdict === "APPROVED" || verdict.severity === "none") {
    return "approved";
  }

  // ── Below review threshold: only log, no action ───────────────────────────
  if (verdict.confidence < reviewThreshold) {
    console.log(
      `[${AGENT_NAME}] Low confidence (${verdict.confidence}) on ${item.type} ${item.id} — logging only`
    );
    return "approved";
  }

  // ── Queue for human: medium confidence ────────────────────────────────────
  if (verdict.confidence < autoActionThreshold) {
    await queueForHumanReview(
      serviceClient, item, verdict.flags.join(","),
      `Guardian flagged (confidence ${verdict.confidence}): ${verdict.reasoning}`
    );

    // Emit event so Minion can decide if it wants to escalate
    await emitEvent(serviceClient, "violation_detected", AGENT_NAME, {
      content_id: item.id,
      content_type: item.type,
      user_id: item.user_id,
      verdict: verdict.verdict,
      severity: verdict.severity,
      confidence: verdict.confidence,
      flags: verdict.flags,
      auto_actioned: false,
    });

    return "queued";
  }

  // ── AUTO-ACTION: high confidence violation ────────────────────────────────
  try {
    // 1. Hide the content immediately
    await hideContent(serviceClient, item.type, item.id, AGENT_NAME, verdict.reasoning);

    // 2. Check user's prior strike history for escalation
    const strikeCount = await getUserStrikeCount(serviceClient, item.user_id);
    const severity = getSeverityFromVerdict(verdict, strikeCount, repeatOffenderStrikes);

    // 3. Issue warning to user
    await issueWarning(serviceClient, item.user_id, AGENT_NAME, verdict.reasoning, severity, {
      content_ref: item.id,
      content_type: item.type,
    });

    // 4. Log to existing moderation_logs (backward-compatible)
    await (serviceClient as any).from("moderation_logs").insert({
      user_id: item.user_id,
      content_type: item.type,
      content_preview: rawText.substring(0, 200),
      verdict: "BLOCKED",
      reason: verdict.reasoning,
      ai_confidence: verdict.confidence,
      model_used: GROQ_MODEL,
      processing_time_ms: null,
    });

    // 5. Emit violation event (notifies Quill to draft user message)
    await emitEvent(serviceClient, "violation_detected", AGENT_NAME, {
      content_id: item.id,
      content_type: item.type,
      user_id: item.user_id,
      verdict: verdict.verdict,
      severity: verdict.severity,
      confidence: verdict.confidence,
      flags: verdict.flags,
      auto_actioned: true,
      warning_id: null, // populated if we need Quill to draft a message
    });

    // 6. If critical + repeat offender → propose ban to Minion
    if (verdict.severity === "critical" || strikeCount >= repeatOffenderStrikes) {
      await createProposal(serviceClient, AGENT_NAME, {
        proposal_type: "ban_user",
        subject_type: "user",
        subject_id: item.user_id,
        reasoning: `Critical violation (${verdict.severity}) with ${strikeCount} prior strikes. Content: "${rawText.slice(0, 100)}"`,
        confidence: verdict.confidence,
        evidence: {
          content_id: item.id,
          content_type: item.type,
          flags: verdict.flags,
          strike_count: strikeCount,
        },
      });
    }

    return "actioned";
  } catch (actionErr) {
    const msg = actionErr instanceof Error ? actionErr.message : "Unknown";
    console.error(`[${AGENT_NAME}] Action execution failed for ${item.type} ${item.id}:`, msg);

    // GRACEFUL FALLBACK: Action failed → don't leave content up silently; queue it
    await queueForHumanReview(
      serviceClient, item, "action_execution_failed",
      `Guardian determined BLOCKED but action failed: ${msg.slice(0, 200)}`
    );
    return "failed";
  }
}

// ─── Queue for Human Review ───────────────────────────────────────────────────

async function queueForHumanReview(
  serviceClient: ReturnType<typeof createClient>,
  item: ContentItem,
  flags: string,
  reason: string
): Promise<void> {
  const { error } = await (serviceClient as any).from("moderation_logs").insert({
    user_id: item.user_id,
    content_type: item.type,
    content_preview: ((item.content ?? item.body) ?? "").substring(0, 200),
    verdict: "NEEDS_REVIEW",
    reason,
    ai_confidence: null,
    model_used: GROQ_MODEL,
    processing_time_ms: null,
  });

  if (error) {
    console.error(`[${AGENT_NAME}] Failed to queue for human review:`, error.message);
  }
}

// ─── Groq API Call ────────────────────────────────────────────────────────────

async function getGuardianVerdict(
  groqApiKey: string,
  content: string,
  contentType: "post" | "comment",
  promptOverride?: string | null
): Promise<GuardianVerdict | null> {
  const systemPrompt = promptOverride || buildGuardianSystemPrompt();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15s timeout

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Content type: ${contentType}\n\nContent to moderate:\n${content}`,
          },
        ],
        temperature: 0.05, // Very low: we want consistent, deterministic moderation
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq API ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    return parseGroqJson<GuardianVerdict>(rawContent);

  } catch (err) {
    clearTimeout(timeoutId);
    throw err; // Re-throw for caller to handle gracefully
  }
}

// ─── Guardian System Prompt ───────────────────────────────────────────────────

function buildGuardianSystemPrompt(): string {
  return `You are Guardian, the AI content moderator for WanaIQ — Kenya's civic accountability platform.

WanaIQ's mission: Empower Kenyans to hold leaders accountable through democratic participation.
Your role: Protect this civic space while respecting freedom of expression.

## MODERATION CATEGORIES (in order of severity)

### CRITICAL — Always block immediately
- Ethnic hate speech or tribal incitement (violates Kenya KICA 2022 §27, Constitution Art. 33(2))
- Calls for violence against any group, official, or individual
- Deliberate exposure of personal data (National ID, phone numbers, home addresses)
- Child sexual exploitation material (any reference)

### HIGH — Block with confidence > 0.85
- Coordinated misinformation designed to mislead citizens about elections/officials
- Threats (direct or indirect) against specific individuals
- Scam/fraud solicitation (fake investment, phishing links)

### MEDIUM — Flag for review
- Unverified claims presented as proven facts about specific officials
- Low-quality content that clutters civic discourse (spam, gibberish)
- Inflammatory content without substance

### LOW — Log only, no action
- Strong opinions (these are valid in a democracy)
- Criticism of officials (legitimate, protected speech)
- Debate and disagreement (essential to civic discourse)

## IMPORTANT RULES
1. Err on the side of allowing speech — only block when confident
2. Criticism of politicians is NOT hate speech — it is protected speech
3. County/regional pride is NOT tribal incitement
4. Swahili, Sheng, and Kenyan English are all valid — do not penalize non-English
5. Context matters: "fire the governor" = figurative critique, not a threat

## RESPONSE FORMAT
Return ONLY valid JSON:
{
  "verdict": "APPROVED" | "REVIEW" | "BLOCKED",
  "severity": "none" | "low" | "medium" | "high" | "critical",
  "confidence": 0.0 to 1.0,
  "flags": ["hate_speech" | "ethnic_incitement" | "pii" | "threat" | "spam" | "misinformation" | "fraud"],
  "reasoning": "One clear sentence explaining your decision",
  "suggested_action": "none" | "warn" | "hide" | "ban_propose"
}`;
}

// ─── Helper: Determine Warning Severity ──────────────────────────────────────

function getSeverityFromVerdict(
  verdict: GuardianVerdict,
  strikeCount: number,
  repeatOffenderThreshold: number
): "info" | "warning" | "strike" | "temp_ban" | "permanent_ban" {
  if (verdict.severity === "critical") {
    return strikeCount >= repeatOffenderThreshold ? "permanent_ban" : "temp_ban";
  }
  if (verdict.severity === "high") {
    return strikeCount >= repeatOffenderThreshold ? "temp_ban" : "strike";
  }
  if (verdict.severity === "medium") {
    return strikeCount > 0 ? "strike" : "warning";
  }
  return "info";
}
