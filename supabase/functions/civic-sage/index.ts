/**
 * civic-sage — WanaIQ Phase 3 Intelligence Agent (Policy Analyst)
 *
 * Runs every 6 hours via pg_cron + triggered by Scout new_finding events.
 *
 * For each run:
 *   1. Pulls unprocessed civic-scout events from agent_events
 *   2. For each finding: RAG search against vectors (Kenya legal docs)
 *   3. LLM analysis — budget discrepancy / policy impact / promise feasibility
 *   4. Saves structured report → agent_drafts (status='pending')
 *   5. Marks Scout finding as processed
 *   6. Logs run → agent_runs
 *
 * Dependencies:
 *   - GROQ_API_KEY (required)
 *   - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto-provided)
 *   - match_documents RPC (pgvector similarity search)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Inline shared utilities ──────────────────────────────────────────────────

const agentCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-internal-trigger",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...agentCorsHeaders, "Content-Type": "application/json" },
  });
}

async function logAgentRun(
  client: ReturnType<typeof createClient>,
  agentName: string,
  stats: {
    trigger_type: string;
    items_scanned?: number;
    items_actioned?: number;
    items_failed?: number;
    duration_ms?: number;
    status: string;
    error_summary?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await client.from("agent_runs").insert({
    agent_name: agentName,
    trigger_type: stats.trigger_type,
    items_scanned: stats.items_scanned ?? 0,
    items_actioned: stats.items_actioned ?? 0,
    items_failed: stats.items_failed ?? 0,
    duration_ms: stats.duration_ms,
    status: stats.status,
    error_summary: stats.error_summary ?? null,
    metadata: stats.metadata ?? {},
  });
}

async function resolveEvent(
  client: ReturnType<typeof createClient>,
  eventId: string,
  status: "done" | "failed",
  errorDetail?: string
): Promise<void> {
  await client
    .from("agent_events")
    .update({ status, processed_at: new Date().toISOString(), error_detail: errorDetail ?? null })
    .eq("id", eventId);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_NAME = "civic-sage";
const MAX_EVENTS_PER_RUN = 10;
const RAG_MATCH_COUNT = 5;

// Category → analysis focus mapping
const CATEGORY_FOCUS: Record<string, string> = {
  budget: "budget discrepancy and procurement compliance",
  tender: "procurement process compliance with PPADA 2015",
  legislation: "policy impact on citizens and affected communities",
  project: "project execution against government commitments",
  appointment: "constitutional compliance of appointments",
  other: "government accountability and civic impact",
};

// ─── RAG Search ───────────────────────────────────────────────────────────────

interface VectorMatch {
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
  source_type: string;
}

async function ragSearch(
  client: ReturnType<typeof createClient>,
  jinaKey: string,
  queryText: string
): Promise<VectorMatch[]> {
  // If no Jina key, return empty and Sage will use raw content only
  if (!jinaKey) {
    console.log("[sage] No JINA_API_KEY — skipping RAG, using raw content");
    return [];
  }

  try {
    // Generate query embedding
    const embedRes = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${jinaKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "jina-embeddings-v2-base-en", input: [queryText.slice(0, 2000)] }),
      signal: AbortSignal.timeout(15000),
    });

    if (!embedRes.ok) throw new Error(`Jina HTTP ${embedRes.status}`);
    const embedJson = await embedRes.json() as { data: Array<{ embedding: number[] }> };
    const queryVector = embedJson.data?.[0]?.embedding;
    if (!queryVector) return [];

    // Call match_documents RPC
    const { data, error } = await client.rpc("match_documents", {
      query_embedding: queryVector,
      match_threshold: 0.6,
      match_count: RAG_MATCH_COUNT,
    });

    if (error) {
      console.warn("[sage] match_documents RPC failed:", error.message);
      return [];
    }

    return (data as VectorMatch[]) ?? [];
  } catch (e) {
    console.warn("[sage] RAG search failed:", (e as Error).message);
    return [];
  }
}

// ─── LLM Analysis ─────────────────────────────────────────────────────────────

interface SageReport {
  title_en: string;
  title_sw: string;
  summary_en: string;
  summary_sw: string;
  analysis_type: "budget_discrepancy" | "policy_impact" | "promise_feasibility" | "general_accountability";
  key_findings: string[];
  citizen_impact: string;
  recommended_action: string;
  legal_basis: string;
  confidence: number;
  county: string | null;
}

async function generateAnalysis(
  groqKey: string,
  finding: { title: string; raw_content: string; category: string; related_to: string; county: string | null },
  ragDocs: VectorMatch[]
): Promise<SageReport | null> {
  const focus = CATEGORY_FOCUS[finding.category] ?? CATEGORY_FOCUS.other;

  const ragContext = ragDocs.length > 0
    ? ragDocs.map((d, i) => `[Source ${i + 1} — ${d.source_type} (similarity: ${d.similarity?.toFixed(2)})]:\n${d.content.slice(0, 600)}`).join("\n\n")
    : "No matching legal documents found in knowledge base. Base analysis on the finding content only.";

  const sagePrompt = `You are civic-sage, a Kenyan government accountability analyst for WanaIQ.

Your task: Analyse this civic finding and generate a structured accountability report.
Focus: ${focus}
${finding.county ? `County context: ${finding.county}` : "National context"}

CIVIC FINDING:
Title: ${finding.title}
Content: ${finding.raw_content.slice(0, 800)}
Category: ${finding.category}
Related to: ${finding.related_to}

RELEVANT LEGAL/POLICY CONTEXT (from Kenya Constitution, PPADA, PFMA):
${ragContext}

Generate a structured analysis. Respond ONLY with valid JSON (no markdown):
{
  "title_en": "brief English report title (max 80 chars)",
  "title_sw": "brief Kiswahili title (max 80 chars)",
  "summary_en": "2-3 sentence analysis in plain English for citizens",
  "summary_sw": "2-3 sentence summary in Kiswahili",
  "analysis_type": "budget_discrepancy|policy_impact|promise_feasibility|general_accountability",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "citizen_impact": "How does this affect ordinary Kenyans? (1 sentence)",
  "recommended_action": "What should citizens or authorities do? (1 sentence)",
  "legal_basis": "Relevant constitutional article or law clause (or 'N/A')",
  "confidence": 0.0-1.0,
  "county": "${finding.county ?? "null"}"
}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: sagePrompt }],
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`);

    const json = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as Partial<SageReport>;

    // Validate required fields
    if (!parsed.title_en || !parsed.summary_en) {
      console.warn("[sage] LLM returned incomplete report");
      return null;
    }

    return {
      title_en: parsed.title_en,
      title_sw: parsed.title_sw ?? parsed.title_en,
      summary_en: parsed.summary_en,
      summary_sw: parsed.summary_sw ?? parsed.summary_en,
      analysis_type: parsed.analysis_type ?? "general_accountability",
      key_findings: parsed.key_findings ?? [],
      citizen_impact: parsed.citizen_impact ?? "",
      recommended_action: parsed.recommended_action ?? "",
      legal_basis: parsed.legal_basis ?? "N/A",
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence ?? 0.5))),
      county: parsed.county === "null" ? null : (parsed.county ?? finding.county),
    };
  } catch (e) {
    console.error("[sage] LLM analysis failed:", (e as Error).message);
    return null;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: agentCorsHeaders });

  const startedAt = Date.now();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const groqKey     = Deno.env.get("GROQ_API_KEY") ?? "";
  const jinaKey     = Deno.env.get("JINA_API_KEY") ?? "";

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* cron may have no body */ }

  const triggerType = (body.trigger === "cron" ? "cron" : "event") as "cron" | "event" | "api";

  if (!groqKey) {
    return jsonResponse({ ok: false, error: "GROQ_API_KEY not configured" }, 500);
  }

  console.log(`[sage] Starting run — trigger: ${triggerType}`);

  let itemsScanned = 0;
  let itemsActioned = 0;
  let itemsFailed = 0;
  const errors: string[] = [];

  try {
    // ── 1. Pull unprocessed Scout events ──────────────────────────────────────

    const { data: events, error: evtErr } = await client
      .from("agent_events")
      .select("id, payload")
      .eq("event_type", "new_finding")
      .eq("source_agent", "civic-scout")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(MAX_EVENTS_PER_RUN);

    if (evtErr) throw new Error(`Failed to fetch events: ${evtErr.message}`);

    const scoutEvents = events ?? [];
    itemsScanned = scoutEvents.length;

    // If no events and this is a scheduled run, scan recent unprocessed findings directly
    let directFindings: Array<{
      id: string;
      title: string;
      raw_content: string;
      category: string;
      related_to: string;
      county: string | null;
      source_url: string;
      _event_id: null;
    }> = [];

    if (scoutEvents.length === 0 && triggerType === "cron") {
      console.log("[sage] No pending Scout events — scanning unprocessed findings directly");
      const { data: findings } = await client
        .from("scout_findings")
        .select("id, title, raw_content, category, related_to, county, source_url")
        .eq("processed", false)
        .order("created_at", { ascending: false })
        .limit(MAX_EVENTS_PER_RUN);

      directFindings = (findings ?? []).map((f: Record<string, unknown>) => ({
        id: f.id as string,
        title: f.title as string,
        raw_content: (f.raw_content as string) ?? "",
        category: (f.category as string) ?? "other",
        related_to: (f.related_to as string) ?? "general",
        county: (f.county as string | null) ?? null,
        source_url: f.source_url as string,
        _event_id: null,
      }));
      itemsScanned = directFindings.length;
    }

    if (itemsScanned === 0) {
      console.log("[sage] Nothing to process — early exit");
      await logAgentRun(client, AGENT_NAME, {
        trigger_type: triggerType,
        items_scanned: 0,
        status: "success",
        metadata: { note: "No pending findings" },
      });
      return jsonResponse({ ok: true, message: "No findings to process" });
    }

    // ── 2. Process each finding ───────────────────────────────────────────────

    // Build work items from Scout events OR direct findings
    const workItems: Array<{
      finding_id: string;
      event_id: string | null;
      title: string;
      raw_content: string;
      category: string;
      related_to: string;
      county: string | null;
    }> = [];

    for (const evt of scoutEvents) {
      const payload = evt.payload as Record<string, unknown>;
      const findingId = payload.finding_id as string;
      if (!findingId) { await resolveEvent(client, evt.id, "failed", "Missing finding_id in payload"); continue; }

      // Fetch the actual finding content
      const { data: finding } = await client
        .from("scout_findings")
        .select("id, title, raw_content, category, related_to, county")
        .eq("id", findingId)
        .maybeSingle();

      if (!finding) { await resolveEvent(client, evt.id, "failed", "Finding not found"); continue; }

      workItems.push({
        finding_id: findingId,
        event_id: evt.id,
        title: finding.title as string,
        raw_content: (finding.raw_content as string) ?? "",
        category: (finding.category as string) ?? (payload.category as string) ?? "other",
        related_to: (finding.related_to as string) ?? "general",
        county: (finding.county as string | null) ?? null,
      });
    }

    for (const df of directFindings) {
      workItems.push({
        finding_id: df.id,
        event_id: null,
        title: df.title,
        raw_content: df.raw_content,
        category: df.category,
        related_to: df.related_to,
        county: df.county,
      });
    }

    // ── 3. Analyse each work item ─────────────────────────────────────────────

    for (const item of workItems) {
      try {
        // RAG search
        const ragDocs = await ragSearch(client, jinaKey, `${item.title} ${item.raw_content.slice(0, 300)}`);

        // LLM analysis
        const report = await generateAnalysis(groqKey, item, ragDocs);

        const draftStatus = report
          ? (report.confidence >= 0.7 ? "pending" : "low_confidence")
          : "failed";

        if (report) {
          // Save draft for admin review
          const draftContent = [
            `## ${report.title_en}`,
            `**Kiswahili:** ${report.title_sw}`,
            ``,
            `### Analysis`,
            report.summary_en,
            ``,
            `**Kiswahili:** ${report.summary_sw}`,
            ``,
            `### Key Findings`,
            report.key_findings.map((f) => `- ${f}`).join("\n"),
            ``,
            `### Citizen Impact`,
            report.citizen_impact,
            ``,
            `### Recommended Action`,
            report.recommended_action,
            ``,
            `### Legal Basis`,
            report.legal_basis,
            ``,
            `*RAG sources used: ${ragDocs.length} | Confidence: ${Math.round(report.confidence * 100)}%*`,
          ].join("\n");

          const { error: draftErr } = await client.from("agent_drafts").insert({
            agent_name: AGENT_NAME,
            draft_type: "accountability_report",
            target_type: "admin",
            title: report.title_en,
            content: draftContent,
            language: "bilingual",
            metadata: {
              finding_id: item.finding_id,
              analysis_type: report.analysis_type,
              confidence: report.confidence,
              county: report.county,
              rag_sources_count: ragDocs.length,
              has_vector_context: ragDocs.length > 0,
            },
            status: draftStatus,
          });

          if (draftErr) {
            console.error("[sage] Failed to save draft:", draftErr.message);
            errors.push(`Draft save failed: ${draftErr.message}`);
            itemsFailed++;
          } else {
            itemsActioned++;
          }
        } else {
          // No report generated — fallback: save minimal draft
          const { error: fallbackErr } = await client.from("agent_drafts").insert({
            agent_name: AGENT_NAME,
            draft_type: "accountability_report",
            target_type: "admin",
            title: `[AUTO] ${item.title.slice(0, 100)}`,
            content: `Scout finding (no LLM analysis generated):\n\n${item.raw_content.slice(0, 1000)}`,
            language: "en",
            metadata: { finding_id: item.finding_id, category: item.category, county: item.county, confidence: 0, rag_sources_count: 0 },
            status: "low_confidence",
          });
          if (!fallbackErr) itemsActioned++;
          else itemsFailed++;
        }

        // Mark finding as processed
        await client.from("scout_findings").update({ processed: true }).eq("id", item.finding_id);

        // Resolve event if present
        if (item.event_id) await resolveEvent(client, item.event_id, "done");

      } catch (itemErr) {
        const msg = (itemErr as Error).message;
        console.error(`[sage] Failed to process finding ${item.finding_id}:`, msg);
        errors.push(`Finding ${item.finding_id}: ${msg}`);
        itemsFailed++;
        if (item.event_id) await resolveEvent(client, item.event_id, "failed", msg);
      }
    }

    // ── 4. Log run ────────────────────────────────────────────────────────────

    const durationMs = Date.now() - startedAt;
    const runStatus = itemsFailed > 0 && itemsActioned === 0 ? "failed"
      : itemsFailed > 0 ? "partial"
      : "success";

    await logAgentRun(client, AGENT_NAME, {
      trigger_type: triggerType,
      items_scanned: itemsScanned,
      items_actioned: itemsActioned,
      items_failed: itemsFailed,
      duration_ms: durationMs,
      status: runStatus,
      error_summary: errors.length ? errors.slice(0, 3).join("; ") : undefined,
      metadata: { has_jina_key: !!jinaKey, drafts_created: itemsActioned },
    });

    console.log(`[sage] Run complete — scanned: ${itemsScanned}, drafts: ${itemsActioned}, failed: ${itemsFailed}`);

    return jsonResponse({
      ok: true,
      items_scanned: itemsScanned,
      drafts_created: itemsActioned,
      items_failed: itemsFailed,
      duration_ms: durationMs,
    });

  } catch (err) {
    const msg = (err as Error).message;
    console.error("[sage] Fatal error:", msg);

    await logAgentRun(client, AGENT_NAME, {
      trigger_type: triggerType,
      items_scanned: itemsScanned,
      status: "failed",
      error_summary: msg,
      duration_ms: Date.now() - startedAt,
    });

    return jsonResponse({ ok: false, error: msg }, 500);
  }
});
