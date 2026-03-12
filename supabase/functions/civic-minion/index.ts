/**
 * civic-minion/index.ts
 *
 * WAAS Phase 1 — Minion Agent (Decision Maker)
 *
 * PURPOSE: Review agent proposals submitted by Guardian and other agents,
 * then either auto-action them (high confidence) or escalate to human
 * moderators (low confidence). Minion is the judiciary of the agent system.
 *
 * TRIGGERED BY:
 *   1. pg_cron every 5 minutes — poll pending proposals
 *   2. API call from admin UI  — manual trigger or override
 *
 * DECISION FRAMEWORK:
 *   confidence ≥ auto_approve_threshold (0.90) + HIGH severity → EXEC immediately
 *   confidence ≥ human_escalation_threshold (0.70)             → AUTO-ACTION + log
 *   confidence < human_escalation_threshold (0.70)             → QUEUE for human
 *
 * GRACEFUL FALLBACK:
 *   If LLM is unavailable OR Minion cannot execute an action:
 *   → Always escalate to human rather than silently failing.
 *   → Never auto-ban based on a failed/uncertain reasoning chain.
 *
 * ACTION TOOLS:
 *   - execute_ban(user_id, duration)       → updates user_roles or sets a ban flag
 *   - execute_content_removal(content_id)  → confirms hide (if not done by Guardian)
 *   - execute_warning(user_id)             → issues formal warning
 *   - escalate_to_admin(proposal_id)       → marks for human with note
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  agentCorsHeaders,
  jsonResponse,
  logAgentRun,
  emitEvent,
  getAgentState,
  issueWarning,
  hideContent,
  parseGroqJson,
} from "../_shared/agentUtils.ts";

const AGENT_NAME = "civic-minion";
const GROQ_MODEL = "llama-3.1-8b-instant";
const MAX_PROPOSALS_PER_RUN = 20; // Process up to 20 proposals per cron tick

// ─── Types ────────────────────────────────────────────────────────────────────

interface MinionDecision {
  decision: "approve" | "reject" | "human_review";
  confidence: number;
  action_to_execute: string | null; // e.g. 'temp_ban_7d','warn','content_removal'
  reasoning: string;
  escalation_note?: string;
}

interface Proposal {
  id: string;
  agent_name: string;
  proposal_type: string;
  subject_type: string | null;
  subject_id: string | null;
  reasoning: string;
  confidence: number | null;
  evidence: Record<string, unknown>;
  created_at: string;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: agentCorsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const groqApiKey = Deno.env.get("GROQ_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  const serviceClient: any = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  if (!groqApiKey) {
    await logAgentRun(serviceClient, AGENT_NAME, {
      trigger_type: "cron",
      status: "failed",
      error_summary: "GROQ_API_KEY not configured",
    });
    return jsonResponse({ error: "GROQ_API_KEY not configured" }, 500);
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* cron sends empty body */ }
  const triggerType = body?.trigger === "manual" ? "manual" : "cron";

  let processed = 0, approved = 0, rejected = 0, escalated = 0, failed = 0;

  try {
    // ── Load thresholds ──────────────────────────────────────────────────────
    const autoApproveThreshold =
      (await getAgentState(serviceClient, AGENT_NAME, "auto_approve_threshold") as number) ?? 0.90;
    const humanEscalationThreshold =
      (await getAgentState(serviceClient, AGENT_NAME, "human_escalation_threshold") as number) ?? 0.70;

    // ── Load prompt override ─────────────────────────────────────────────────
    const promptOverride = await getAgentState(serviceClient, AGENT_NAME, "system_prompt") as string | null;

    // ── Fetch pending proposals (oldest first → FIFO processing) ─────────────
    const { data: proposals, error: fetchErr } = await serviceClient
      .from("agent_proposals")
      .select("*")
      .eq("status", "pending")
      .lt("expires_at", new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()) // not yet expired
      .order("created_at", { ascending: true })
      .limit(MAX_PROPOSALS_PER_RUN);

    if (fetchErr) {
      throw new Error(`Failed to fetch proposals: ${fetchErr.message}`);
    }

    for (const proposal of proposals ?? []) {
      processed++;
      try {
        const result = await handleProposal(
          serviceClient,
          groqApiKey,
          proposal as Proposal,
          autoApproveThreshold,
          humanEscalationThreshold,
          promptOverride
        );
        if (result === "approved") approved++;
        else if (result === "rejected") rejected++;
        else if (result === "escalated") escalated++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[${AGENT_NAME}] Failed to handle proposal ${proposal.id}:`, msg);

        // Mark proposal as needing human review rather than leaving it stuck
        await escalateProposal(
          serviceClient,
          proposal.id,
          `Minion internal error: ${msg.slice(0, 200)}`
        );
      }
    }

    const duration = Date.now() - startTime;
    await logAgentRun(serviceClient, AGENT_NAME, {
      trigger_type: triggerType,
      items_scanned: processed,
      items_actioned: approved + rejected,
      items_failed: failed,
      duration_ms: duration,
      status: failed > 0 && approved + rejected === 0 ? "partial" : "success",
      metadata: { approved, rejected, escalated },
    });

    return jsonResponse({
      agent: AGENT_NAME,
      processed,
      approved,
      rejected,
      escalated,
      failed,
      duration_ms: duration,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[${AGENT_NAME}] Fatal error:`, message);

    await logAgentRun(serviceClient, AGENT_NAME, {
      trigger_type: triggerType,
      items_scanned: processed,
      items_actioned: approved + rejected,
      items_failed: failed + 1,
      duration_ms: Date.now() - startTime,
      status: "failed",
      error_summary: message.slice(0, 500),
    });

    return jsonResponse({ error: "Minion encountered an internal error", detail: message }, 500);
  }
});

// ─── Handle a Single Proposal ─────────────────────────────────────────────────

async function handleProposal(
  serviceClient: ReturnType<typeof createClient>,
  groqApiKey: string,
  proposal: Proposal,
  autoApproveThreshold: number,
  humanEscalationThreshold: number,
  promptOverride?: string | null
): Promise<"approved" | "rejected" | "escalated"> {

  const guardianConfidence = proposal.confidence ?? 0;

  // ── Phase 1: Should Minion even deliberate, or defer immediately? ────────

  // Safety check: never auto-ban a user via automation alone without LLM re-verify
  const needsLLMReview = proposal.proposal_type === "ban_user";

  let minionDecision: MinionDecision | null = null;

  if (needsLLMReview || guardianConfidence < autoApproveThreshold) {
    // Get Minion's independent LLM review
    try {
      minionDecision = await getMinionDecision(groqApiKey, proposal, promptOverride);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown";
      console.warn(`[${AGENT_NAME}] LLM review failed for proposal ${proposal.id}: ${msg}`);
      // FALLBACK: LLM unavailable → escalate to human (safe default)
      await escalateProposal(serviceClient, proposal.id, `Minion LLM unavailable: ${msg.slice(0, 200)}`);
      return "escalated";
    }
  }

  // ── Phase 2: Decision Logic ──────────────────────────────────────────────

  // Use Minion's LLM decision if available; otherwise trust Guardian's confidence
  const finalConfidence = minionDecision?.confidence ?? guardianConfidence;
  const decision = minionDecision?.decision ?? (
    guardianConfidence >= autoApproveThreshold ? "approve" : "human_review"
  );

  if (decision === "human_review" || finalConfidence < humanEscalationThreshold) {
    await escalateProposal(
      serviceClient,
      proposal.id,
      minionDecision?.escalation_note ?? `Low confidence (${finalConfidence.toFixed(2)}) — queued for human review`
    );
    return "escalated";
  }

  if (decision === "reject") {
    await updateProposalStatus(serviceClient, proposal.id, "rejected", null,
      minionDecision?.reasoning ?? "Minion determined no action warranted");
    return "rejected";
  }

  // ── Phase 3: Execute the approved action ──────────────────────────────────
  if (decision === "approve") {
    const success = await executeProposalAction(serviceClient, proposal, minionDecision);

    if (!success) {
      // FALLBACK: Action execution failed → escalate rather than silently fail
      await escalateProposal(
        serviceClient, proposal.id,
        "Minion approved but action execution failed — human intervention required"
      );
      return "escalated";
    }

    await updateProposalStatus(
      serviceClient, proposal.id, "auto_actioned",
      minionDecision?.action_to_execute ?? proposal.proposal_type,
      minionDecision?.reasoning ?? "Auto-approved by Minion"
    );

    // Emit approved event so Quill can draft user notification if needed
    await emitEvent(serviceClient, "proposal_approved", AGENT_NAME, {
      proposal_id: proposal.id,
      proposal_type: proposal.proposal_type,
      subject_type: proposal.subject_type,
      subject_id: proposal.subject_id,
      action_taken: minionDecision?.action_to_execute ?? proposal.proposal_type,
    });

    return "approved";
  }

  // Shouldn't reach here, but safe default
  await escalateProposal(serviceClient, proposal.id, "Minion: unhandled decision state");
  return "escalated";
}

// ─── Execute the Actual DB Action ────────────────────────────────────────────

async function executeProposalAction(
  serviceClient: ReturnType<typeof createClient>,
  proposal: Proposal,
  decision: MinionDecision | null
): Promise<boolean> {
  try {
    switch (proposal.proposal_type) {
      case "ban_user": {
        if (!proposal.subject_id) return false;
        // Issue a temp_ban warning (represents 30-day ban)
        // Full ban implementation would update a user_bans table (future)
        await issueWarning(serviceClient, proposal.subject_id, AGENT_NAME,
          decision?.reasoning ?? proposal.reasoning, "temp_ban",
          { content_ref: proposal.evidence?.content_id as string | undefined,
            content_type: proposal.evidence?.content_type as "post" | "comment" | undefined });
        return true;
      }

      case "hide_content": {
        if (!proposal.subject_id || !proposal.subject_type) return false;
        if (proposal.subject_type !== "post" && proposal.subject_type !== "comment") return false;
        return await hideContent(
          serviceClient, proposal.subject_type, proposal.subject_id,
          AGENT_NAME, decision?.reasoning ?? proposal.reasoning
        );
      }

      case "send_warning": {
        if (!proposal.subject_id) return false;
        const severity = determineSeverity(proposal);
        await issueWarning(serviceClient, proposal.subject_id, AGENT_NAME,
          decision?.reasoning ?? proposal.reasoning, severity);
        return true;
      }

      case "flag_project":
      case "escalate": {
        // These always go to humans — shouldn't reach execution
        return false;
      }

      default: {
        console.warn(`[${AGENT_NAME}] Unknown proposal type: ${proposal.proposal_type}`);
        return false;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error(`[${AGENT_NAME}] executeProposalAction error:`, msg);
    return false;
  }
}

// ─── Groq: Get Minion's LLM Decision ─────────────────────────────────────────

async function getMinionDecision(
  groqApiKey: string,
  proposal: Proposal,
  promptOverride?: string | null
): Promise<MinionDecision | null> {
  const systemPrompt = promptOverride || buildMinionSystemPrompt();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

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
            content: JSON.stringify({
              proposal_type: proposal.proposal_type,
              subject_type: proposal.subject_type,
              reasoning_from_guardian: proposal.reasoning,
              guardian_confidence: proposal.confidence,
              evidence: proposal.evidence,
              submitted_by: proposal.agent_name,
              submitted_at: proposal.created_at,
            }),
          },
        ],
        temperature: 0.05,
        max_tokens: 350,
        response_format: { type: "json_object" },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq API ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    return parseGroqJson<MinionDecision>(data?.choices?.[0]?.message?.content);

  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ─── Minion System Prompt ─────────────────────────────────────────────────────

function buildMinionSystemPrompt(): string {
  return `You are Minion, WanaIQ's autonomous moderation decision engine.

You review proposals submitted by other agents (primarily Guardian) and decide whether to:
- APPROVE and execute the recommended action
- REJECT (no action warranted)
- HUMAN_REVIEW (defer to human moderators)

## CORE PRINCIPLES
1. PROPORTIONALITY: Match punishment to offense severity. First offense = warning, not ban.
2. FAIRNESS: Be especially careful with actions against accounts from minority counties.
3. REVERSIBILITY: Prefer reversible actions (temp ban) over irreversible (permanent ban).
4. POLITICAL NEUTRALITY: Never approve actions that could silence political dissent.
5. PRESUMPTION OF INNOCENCE: When uncertain, ALWAYS choose human_review.

## BAN PROPOSALS — Extra Scrutiny
Ban proposals require:
- Multiple prior strikes (evidence of pattern, not single incident)
- High confidence (≥ 0.90) from Guardian
- Clear, unambiguous violation (hate speech, not just heated political opinion)

## ESCALATE TO HUMAN when:
- Confidence < 0.70
- Action would silence a verified official or public figure
- Proposal involves political content around election periods
- Guardian confidence < 0.80 for any ban proposal
- You cannot determine political neutrality of the action

## RESPONSE FORMAT (valid JSON):
{
  "decision": "approve" | "reject" | "human_review",
  "confidence": 0.0 to 1.0,
  "action_to_execute": "temp_ban_7d" | "temp_ban_30d" | "warn" | "content_removal" | "strike" | null,
  "reasoning": "One clear sentence explaining your decision",
  "escalation_note": "Only include if human_review — tell the human why you deferred"
}`;
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

async function escalateProposal(
  serviceClient: ReturnType<typeof createClient>,
  proposalId: string,
  note: string
): Promise<void> {
  const { error } = await serviceClient
    .from("agent_proposals")
    .update({
      status: "pending", // Stays pending — but now visible to human with note
      action_taken: `HUMAN_ESCALATION: ${note}`,
    })
    .eq("id", proposalId);

  if (error) {
    console.error(`[${AGENT_NAME}] escalateProposal failed:`, error.message);
  }
}

async function updateProposalStatus(
  serviceClient: ReturnType<typeof createClient>,
  proposalId: string,
  status: "approved" | "rejected" | "auto_actioned",
  action: string | null,
  reasoning: string
): Promise<void> {
  const { error } = await serviceClient
    .from("agent_proposals")
    .update({
      status,
      action_taken: action,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  if (error) {
    console.error(`[${AGENT_NAME}] updateProposalStatus failed:`, error.message);
  }
}

function determineSeverity(proposal: Proposal): "info" | "warning" | "strike" | "temp_ban" | "permanent_ban" {
  const strikeCount = (proposal.evidence?.strike_count as number) ?? 0;
  const severity = (proposal.evidence?.severity as string) ?? "medium";

  if (severity === "critical") return strikeCount > 2 ? "permanent_ban" : "temp_ban";
  if (severity === "high") return strikeCount > 1 ? "temp_ban" : "strike";
  return strikeCount > 0 ? "strike" : "warning";
}
