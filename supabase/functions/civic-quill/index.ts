import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ───────────────────────────────────────────────────────────────────

type DraftType =
  | "warning_message"
  | "civic_summary"
  | "user_notification"
  | "educational_post"
  | "accountability_alert_summary"
  | "promise_breach_notice";

interface QuillRequest {
  trigger?: "cron" | "event";
  source?: string;
  event_id?: string;
  draft_type?: DraftType;
  target_user_id?: string;
  context?: Record<string, unknown>;
}

interface AgentEvent {
  id: string;
  event_type: string;
  source_agent: string;
  target_agent: string;
  payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}

// ─── Groq helper ─────────────────────────────────────────────────────────────

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const GROQ_MODEL = "llama-3.3-70b-versatile";

async function groqGenerate(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!GROQ_API_KEY) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.6,
        max_tokens: 1200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    const json = await res.json();
    return json?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error("[civic-quill] groqGenerate error:", e);
    return null;
  }
}

// ─── Supabase client ─────────────────────────────────────────────────────────

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

// ─── Draft generators ─────────────────────────────────────────────────────────

const DEFAULT_SYSTEM_PROMPT = `You are civic-quill, WanaIQ's bilingual civic writer AI.
Your job is to turn agent findings into clear, factual public messages for Kenyan citizens.
Always write in a respectful, informative tone grounded in Kenya's civic context.
Use English as the primary language. Add a brief Kiswahili summary (2–3 sentences) at the end marked ## Kiswahili.
Be concise: 150-300 words total.
Do NOT speculate. Only state what the data confirms.
Output raw markdown only — no JSON wrapper.`;

// Will be loaded from agent_state on each run
let SYSTEM_PROMPT = DEFAULT_SYSTEM_PROMPT;

async function generateWarningMessage(payload: Record<string, unknown>): Promise<{ title: string; content: string }> {
  const username = (payload.username as string) ?? "User";
  const violation = (payload.violation_type as string) ?? "community guideline violation";
  const postTitle = (payload.post_title as string) ?? "your recent post";

  const template = `Dear ${username},

We are reaching out regarding **${postTitle}**.

Our automated review system detected content that may violate WanaIQ's Community Guidelines, specifically related to **${violation}**.

**What this means:** Your post has been flagged for review by our moderation team. If confirmed, appropriate action may be taken including content removal or a temporary posting restriction.

**What you can do:**
- Review WanaIQ's [Community Guidelines](/guidelines)
- Edit your post to meet community standards
- Contact support if you believe this is an error

We appreciate your contribution to civic discourse in Kenya and aim to keep our platform safe and constructive for all users.

## Kiswahili
Habari ${username}, tunakuarifu kwamba chapisho lako limegundulika kwa ukaguzi. Tafadhali kagua Mwongozo wa Jamii wa WanaIQ ili kuhakikisha maudhui yako yanakubaliana na kanuni zetu. Wasiliana na msaada kama una maswali.`;

  const groqContent = await groqGenerate(
    SYSTEM_PROMPT,
    `Write a polite moderation warning message for ${username} about a ${violation} violation on their post titled: "${postTitle}". Keep it factual and constructive.`
  );

  return {
    title: `Content Notice: ${postTitle}`,
    content: groqContent ?? template,
  };
}

async function generateCivicSummary(payload: Record<string, unknown>): Promise<{ title: string; content: string }> {
  const findingTitle = (payload.title as string) ?? "Civic Update";
  const findingContent = (payload.content as string) ?? "";
  const sourceType = (payload.source_type as string) ?? "official source";
  const county = (payload.county as string) ?? null;
  const analysis = (payload.sage_analysis as string) ?? "";

  const template = `## ${findingTitle}

*Source: ${sourceType}${county ? ` · ${county} County` : ""}*

${findingContent}

${analysis ? `### Policy Analysis\n\n${analysis}` : ""}

---

**Why this matters:** This update directly affects how public resources and governance decisions impact your community.

**How to engage:** Follow this issue on WanaIQ, share with your local community, or contact your ward representative.

## Kiswahili
Habari hii inahusu ${findingTitle}. Ni muhimu kwa raia wote wa Kenya kujua mabadiliko yanayoathiri maisha yao ya kila siku. Shiriki habari hii na jamii yako ili kuongeza uelewa wa masuala ya kiraia.`;

  const groqContent = await groqGenerate(
    SYSTEM_PROMPT,
    `Write a civic summary for Kenyan citizens about: "${findingTitle}".
Source: ${sourceType}${county ? `, ${county} County` : ""}
Raw finding: ${findingContent.slice(0, 800)}
Sage analysis: ${analysis.slice(0, 800)}

Make it accessible to ordinary citizens, explain why it matters, and what they can do.`
  );

  return {
    title: `Civic Update: ${findingTitle}`,
    content: groqContent ?? template,
  };
}

async function generateAccountabilityAlertSummary(payload: Record<string, unknown>): Promise<{ title: string; content: string }> {
  const alertType = (payload.alert_type as string) ?? "accountability issue";
  const subjectName = (payload.subject_name as string) ?? "Government Project";
  const summary = (payload.summary as string) ?? "";
  const severity = (payload.severity as number) ?? 5;
  const county = (payload.county as string) ?? null;

  const severityLabel = severity >= 8 ? "Critical" : severity >= 6 ? "High" : severity >= 4 ? "Moderate" : "Low";

  const template = `## ${severityLabel} Accountability Alert: ${subjectName}

**Issue Type:** ${alertType.replace(/_/g, " ")}${county ? `\n**County:** ${county}` : ""}
**Severity:** ${severity}/10

${summary}

### What Citizens Can Do

1. **Demand accountability** — Contact your elected representative about this issue
2. **Track progress** — Follow this project on WanaIQ for updates
3. **Report evidence** — If you have documentation, submit it through the platform
4. **Share** — Spread awareness in your community

*This alert was generated by WanaIQ's automated accountability monitoring system. All data is sourced from official government records.*

## Kiswahili
Tahadhari ya uwajibikaji: ${subjectName} ina shida ya **${alertType.replace(/_/g, " ")}** katika kiwango cha ${severity}/10. Wasiliana na mwakilishi wako wa eneo ili kudai uwajibikaji. Endelea kufuatilia suala hili kupitia WanaIQ.`;

  const groqContent = await groqGenerate(
    SYSTEM_PROMPT,
    `Write a public accountability alert for Kenyan citizens about:
Alert type: ${alertType}
Subject: ${subjectName}
County: ${county ?? "National"}
Severity: ${severity}/10
Summary: ${summary}

Write a citizen-facing alert explaining the issue, its significance, and how citizens can respond. Include actionable steps.`
  );

  return {
    title: `Accountability Alert: ${subjectName} (${severityLabel})`,
    content: groqContent ?? template,
  };
}

async function generateEducationalPost(): Promise<{ title: string; content: string }> {
  const topics = [
    { title: "Your Rights Under Kenya's Devolution Framework", topic: "devolution and county governments in Kenya, citizens' rights to access services, Article 174 of the Constitution" },
    { title: "How Kenya's Budget Process Works", topic: "Kenya's annual budget cycle, public participation in budget-making, PFMA 2012 requirements" },
    { title: "What is the Kenya Gazette and Why Does It Matter?", topic: "the Kenya Gazette, official government notices, tenders, and appointments published there" },
    { title: "Understanding Public Procurement: How Government Spending Should Work", topic: "PPADA 2015, procurement rules, how to identify irregularities in government tenders" },
    { title: "How to Hold Your Ward Representative Accountable", topic: "ward representatives, ward development fund, how citizens can engage with local governance" },
  ];

  const topic = topics[Math.floor(Math.random() * topics.length)];

  const template = `## ${topic.title}

Kenya's civic system gives citizens powerful tools to participate in governance — but only if you know how to use them.

This week's civic education focuses on **${topic.title.toLowerCase()}**.

### Key Facts

Understanding ${topic.topic.split(",")[0]} is a civic right protected under Kenya's Constitution 2010.

### How This Affects You

Every Kenyan, regardless of location or status, has the right to access information, participate in governance, and hold public officials accountable.

### Take Action

- Visit your county assembly or ward office
- Use WanaIQ to track local government projects
- Report issues through the platform

*WanaIQ is committed to building an informed, empowered citizenry. Share this post with someone who needs to know their rights.*

## Kiswahili
Elimu ya kiraia: ${topic.title}. Kila Mkenya ana haki ya kushiriki katika uongozi na kudai uwajibikaji. Tumia WanaIQ kufuatilia miradi ya serikali na kuripoti matatizo yoyote.`;

  const groqContent = await groqGenerate(
    SYSTEM_PROMPT,
    `Write a weekly civic education post for ordinary Kenyan citizens about: ${topic.topic}.
Make it educational, accessible (simple words), and empowering. Tell citizens what they need to know and what they can do.
Title: "${topic.title}"`
  );

  return {
    title: topic.title,
    content: groqContent ?? template,
  };
}

// ─── Save draft to DB ─────────────────────────────────────────────────────────

async function saveDraft(
  supabase: ReturnType<typeof supabaseAdmin>,
  draftType: DraftType,
  title: string,
  content: string,
  language: string = "en+sw",
  metadata: Record<string, unknown> = {}
): Promise<string | null> {
  const { data, error } = await supabase
    .from("agent_drafts")
    .insert({
      agent_name: "civic-quill",
      draft_type: draftType,
      title,
      content,
      status: "pending",
      language,
      metadata,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[civic-quill] saveDraft error:", error);
    return null;
  }
  return data?.id ?? null;
}

async function logRun(
  supabase: ReturnType<typeof supabaseAdmin>,
  trigger: string,
  status: "completed" | "failed",
  stats: Record<string, number>,
  error_message?: string
) {
  await supabase.from("agent_run_logs").insert({
    agent_name: "civic-quill",
    trigger_type: trigger,
    status,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    items_processed: stats.drafts_created ?? 0,
    error_message: error_message ?? null,
    metadata: stats,
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" },
    });
  }

  const started = Date.now();
  const supabase = supabaseAdmin();

  // Load prompt override from agent_state
  try {
    const { data: promptRow } = await supabase.from("agent_state")
      .select("state_value")
      .eq("agent_name", "civic-quill")
      .eq("state_key", "system_prompt")
      .maybeSingle();
    if (promptRow?.state_value) {
      SYSTEM_PROMPT = String(promptRow.state_value);
    }
  } catch {
    // Use default prompt on failure
  }

  let body: QuillRequest = {};
  try {
    body = req.method === "POST" ? await req.json() : {};
  } catch {
    body = {};
  }

  const trigger = body.trigger ?? "cron";
  const stats = { events_processed: 0, drafts_created: 0, fallback_used: 0 };

  try {
    // ── 1. Weekly educational post (cron trigger, Mondays) ──────────────────
    if (trigger === "cron") {
      const now = new Date();
      const isMonday = now.getUTCDay() === 1;

      if (isMonday) {
        const { title, content } = await generateEducationalPost();
        const id = await saveDraft(supabase, "educational_post", title, content, "en+sw", {
          week: now.toISOString().slice(0, 10),
          auto_generated: true,
        });
        if (id) stats.drafts_created++;
        console.log("[civic-quill] Generated weekly educational post:", title);
      }
    }

    // ── 2. Process pending agent_events targeting civic-quill ───────────────
    const { data: events, error: evtErr } = await supabase
      .from("agent_events")
      .select("*")
      .eq("target_agent", "civic-quill")
      .eq("processed", false)
      .order("created_at", { ascending: true })
      .limit(20);

    if (evtErr) throw evtErr;

    for (const event of (events ?? []) as AgentEvent[]) {
      stats.events_processed++;
      let draftId: string | null = null;

      try {
        const payload = event.payload ?? {};
        const eventType = event.event_type;

        if (eventType === "content_warning" || eventType === "warning_message") {
          const { title, content } = await generateWarningMessage(payload);
          draftId = await saveDraft(supabase, "warning_message", title, content, "en+sw", {
            source_event_id: event.id,
            target_user_id: payload.user_id,
            source_agent: event.source_agent,
          });
        } else if (eventType === "new_finding" || eventType === "civic_summary") {
          const { title, content } = await generateCivicSummary(payload);
          draftId = await saveDraft(supabase, "civic_summary", title, content, "en+sw", {
            source_event_id: event.id,
            finding_id: payload.finding_id,
            county: payload.county ?? null,
            source_agent: event.source_agent,
          });
        } else if (eventType === "accountability_alert") {
          const { title, content } = await generateAccountabilityAlertSummary(payload);
          draftId = await saveDraft(supabase, "accountability_alert_summary", title, content, "en+sw", {
            source_event_id: event.id,
            alert_id: payload.alert_id,
            severity: payload.severity,
            county: payload.county ?? null,
          });
        } else if (eventType === "educational_post") {
          const { title, content } = await generateEducationalPost();
          draftId = await saveDraft(supabase, "educational_post", title, content, "en+sw", {
            source_event_id: event.id,
          });
        }

        if (draftId) {
          stats.drafts_created++;
          // Mark event as processed
          await supabase
            .from("agent_events")
            .update({ processed: true, resolved_at: new Date().toISOString(), resolution: "done" })
            .eq("id", event.id);
        }
      } catch (evtError) {
        console.error("[civic-quill] Error processing event:", event.id, evtError);
        // Mark as failed but don't block others
        await supabase
          .from("agent_events")
          .update({ processed: true, resolved_at: new Date().toISOString(), resolution: "failed" })
          .eq("id", event.id);
      }
    }

    // ── 3. Process accountability_alerts that need public summaries ──────────
    if (trigger === "cron") {
      const { data: unwrittenAlerts } = await supabase
        .from("accountability_alerts")
        .select("id, alert_type, subject_name, summary, severity, county")
        .eq("is_public", true)
        .is("quill_draft_id", null)
        .gte("severity", 6)
        .order("created_at", { ascending: false })
        .limit(5);

      for (const alert of (unwrittenAlerts ?? [])) {
        const { title, content } = await generateAccountabilityAlertSummary({
          alert_type: alert.alert_type,
          subject_name: alert.subject_name,
          summary: alert.summary,
          severity: alert.severity,
          county: alert.county,
        });
        const draftId = await saveDraft(supabase, "accountability_alert_summary", title, content, "en+sw", {
          alert_id: alert.id,
          severity: alert.severity,
          county: alert.county,
        });
        if (draftId) {
          stats.drafts_created++;
          // Update alert with quill_draft_id if column exists (graceful)
          try {
            await supabase.from("accountability_alerts").update({ quill_draft_id: draftId }).eq("id", alert.id);
          } catch { /* column may not exist yet */ }
        }
      }
    }

    const elapsed = Date.now() - started;
    await logRun(supabase, trigger, "completed", { ...stats, elapsed_ms: elapsed });

    return new Response(JSON.stringify({ ok: true, stats, elapsed_ms: elapsed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[civic-quill] Fatal error:", msg);
    await logRun(supabase, trigger, "failed", stats, msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
