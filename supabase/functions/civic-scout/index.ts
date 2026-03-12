/**
 * civic-scout — WanaIQ Phase 3 Intelligence Agent
 *
 * Runs hourly via pg_cron. Collects real-world civic data from:
 *   1. Kenya Gazette RSS
 *   2. Parliament of Kenya RSS
 *   3. NewsData.io API (filtered to Kenya government)
 *
 * For each run:
 *   - Fetches all 3 sources (gracefully skips failures)
 *   - LLM relevance classification (Groq/llama-3.3-70b)
 *   - Deduplicates against scout_findings.source_url
 *   - Saves findings ≥ 0.6 relevance → scout_findings
 *   - Embeds findings ≥ 0.8 → vectors (using Jina AI when key available)
 *   - Emits agent_events → triggers civic-sage
 *   - Logs run → agent_runs
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Inline shared utilities ─────────────────────────────────────────────────
// (Deno Edge Functions cannot import from relative local paths at deploy time)

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

async function emitEvent(
  client: ReturnType<typeof createClient>,
  type: string,
  source: string,
  payload: Record<string, unknown>,
  target?: string
): Promise<string | null> {
  const { data, error } = await client
    .from("agent_events")
    .insert({ event_type: type, source_agent: source, target_agent: target ?? null, payload, status: "pending" })
    .select("id")
    .single();
  if (error) console.error(`[scout] emitEvent failed:`, error.message);
  return data?.id ?? null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_NAME = "civic-scout";
const MIN_RELEVANCE_SAVE = 0.6;   // save to scout_findings
const MIN_RELEVANCE_EMBED = 0.80; // embed into vectors

// Kenya-specific RSS feeds (public, no auth required)
const RSS_SOURCES = [
  {
    name: "Kenya Gazette",
    url: "https://kenyalaw.org/kl/index.php?id=5901&type=rss",
    source_type: "gazette",
    fallbackUrl: null as string | null,
  },
  {
    name: "Parliament of Kenya",
    url: "https://parliament.go.ke/feed",
    source_type: "parliament",
    fallbackUrl: null as string | null,
  },
];

// ─── RSS Parser ───────────────────────────────────────────────────────────────

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  source_type: string;
  source_name: string;
}

async function fetchRssFeed(source: typeof RSS_SOURCES[0]): Promise<FeedItem[]> {
  const urls = [source.url, source.fallbackUrl].filter(Boolean) as string[];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "WanaIQ-Scout/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      const items: FeedItem[] = [];

      // Simple XML parsing for <item> blocks
      const itemMatches = text.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi);
      for (const match of itemMatches) {
        const block = match[1];
        const title = extractXmlTag(block, "title") ?? "";
        const link = extractXmlTag(block, "link") ?? extractXmlTag(block, "guid") ?? "";
        const description = stripHtml(extractXmlTag(block, "description") ?? "");
        const pubDate = extractXmlTag(block, "pubDate") ?? null;

        if (title && link) {
          items.push({ title, link, description, pubDate, source_type: source.source_type, source_name: source.name });
        }
        if (items.length >= 20) break; // cap per source
      }

      console.log(`[scout] ${source.name}: fetched ${items.length} items`);
      return items;
    } catch (e) {
      console.warn(`[scout] ${source.name} fetch failed (${url}):`, (e as Error).message);
    }
  }

  return [];
}

function extractXmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  return match ? match[1].trim() : null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 800);
}

// ─── NewsData.io Fetch ────────────────────────────────────────────────────────

async function fetchNewsData(apiKey: string): Promise<FeedItem[]> {
  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      q: "kenya government official budget project",
      country: "ke",
      language: "en",
      category: "politics,government",
    });

    const res = await fetch(`https://newsdata.io/api/1/news?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`NewsData HTTP ${res.status}`);

    const json = await res.json() as { status: string; results?: Array<{ title: string; link: string; description: string; pubDate: string }> };
    if (json.status !== "success" || !json.results) return [];

    return json.results.slice(0, 20).map((r) => ({
      title: r.title ?? "",
      link: r.link ?? "",
      description: stripHtml(r.description ?? "").slice(0, 600),
      pubDate: r.pubDate ?? null,
      source_type: "newsdata",
      source_name: "NewsData.io",
    }));
  } catch (e) {
    console.warn("[scout] NewsData.io fetch failed:", (e as Error).message);
    return [];
  }
}

// ─── LLM Relevance Classifier ────────────────────────────────────────────────

interface RelevanceResult {
  score: number;        // 0.0 – 1.0
  category: string;    // budget | tender | legislation | project | appointment | other
  related_to: string;  // 'project' | 'promise' | 'official' | 'general'
  county: string | null;
}

async function classifyRelevance(
  groqKey: string,
  item: FeedItem
): Promise<RelevanceResult> {
  const prompt = `You are a civic intelligence classifier for Kenya.
Rate how relevant this item is to accountability tracking of Kenyan government officials, projects, budgets, or promises.

Title: ${item.title}
Description: ${item.description.slice(0, 400)}
Source: ${item.source_name}

Respond with ONLY valid JSON (no markdown):
{
  "score": 0.0-1.0,
  "category": "budget|tender|legislation|project|appointment|other",
  "related_to": "project|promise|official|general",
  "county": "county name or null if national"
}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
    const json = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as Partial<RelevanceResult>;

    return {
      score: Math.min(1, Math.max(0, Number(parsed.score ?? 0))),
      category: parsed.category ?? "other",
      related_to: parsed.related_to ?? "general",
      county: parsed.county ?? null,
    };
  } catch (e) {
    console.warn("[scout] LLM classify failed:", (e as Error).message, "— defaulting to 0.5");
    return { score: 0.5, category: "other", related_to: "general", county: null };
  }
}

// ─── Embedding (Jina AI) ──────────────────────────────────────────────────────

async function embedText(jinaKey: string, text: string): Promise<number[] | null> {
  try {
    const res = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jinaKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jina-embeddings-v2-base-en",
        input: [text.slice(0, 8000)],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`Jina HTTP ${res.status}`);
    const json = await res.json() as { data: Array<{ embedding: number[] }> };
    return json.data?.[0]?.embedding ?? null;
  } catch (e) {
    console.warn("[scout] Jina embedding failed:", (e as Error).message);
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
  const newsDataKey = Deno.env.get("NEWSDATA_API_KEY") ?? "";

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* cron calls may have no body */ }

  const triggerType = (body.trigger === "cron" ? "cron" : "api") as "cron" | "api";

  console.log(`[scout] Starting run — trigger: ${triggerType}`);

  let itemsScanned = 0;
  let itemsSaved   = 0;
  let itemsEmbedded = 0;
  let itemsFailed  = 0;
  const errors: string[] = [];

  try {
    // ── 1. Fetch all sources ──────────────────────────────────────────────────

    const allItems: FeedItem[] = [];

    // RSS sources (parallel)
    const rssResults = await Promise.allSettled(RSS_SOURCES.map(fetchRssFeed));
    for (const result of rssResults) {
      if (result.status === "fulfilled") allItems.push(...result.value);
      else errors.push(`RSS fetch failed: ${result.reason}`);
    }

    // NewsData.io (optional, skip if no key)
    if (newsDataKey) {
      const newsItems = await fetchNewsData(newsDataKey);
      allItems.push(...newsItems);
    } else {
      console.log("[scout] NEWSDATA_API_KEY not set — skipping NewsData.io");
    }

    itemsScanned = allItems.length;
    console.log(`[scout] Total items fetched: ${itemsScanned}`);

    if (itemsScanned === 0) {
      await logAgentRun(client, AGENT_NAME, {
        trigger_type: triggerType,
        items_scanned: 0,
        status: "success",
        error_summary: errors.length ? errors.join("; ") : undefined,
        metadata: { note: "All sources returned 0 items" },
      });
      return jsonResponse({ ok: true, message: "No items fetched", items_scanned: 0 });
    }

    // ── 2. Deduplicate against existing scout_findings ────────────────────────

    const sourceUrls = allItems.map((i) => i.link).filter(Boolean);
    const { data: existing } = await client
      .from("scout_findings")
      .select("source_url")
      .in("source_url", sourceUrls);

    const seenUrls = new Set((existing ?? []).map((r: { source_url: string }) => r.source_url));
    const newItems = allItems.filter((i) => i.link && !seenUrls.has(i.link));

    console.log(`[scout] ${newItems.length} new items after dedup (${allItems.length - newItems.length} skipped)`);

    if (newItems.length === 0) {
      await logAgentRun(client, AGENT_NAME, {
        trigger_type: triggerType,
        items_scanned: itemsScanned,
        items_actioned: 0,
        status: "success",
        metadata: { note: "All items already seen" },
      });
      return jsonResponse({ ok: true, message: "No new items", items_scanned: itemsScanned });
    }

    // ── 3. LLM classify + save ────────────────────────────────────────────────

    // Rate-limit: classify in batches of 5 with 500ms delay
    const BATCH_SIZE = 5;
    const BATCH_DELAY_MS = 500;

    for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
      const batch = newItems.slice(i, i + BATCH_SIZE);

      const classifications = await Promise.allSettled(
        batch.map((item) => groqKey ? classifyRelevance(groqKey, item) : Promise.resolve({ score: 0.7, category: "other", related_to: "general", county: null } as RelevanceResult))
      );

      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        const classResult = classifications[j];

        let relevance: RelevanceResult = { score: 0.6, category: "other", related_to: "general", county: null };
        if (classResult.status === "fulfilled") relevance = classResult.value;
        else {
          errors.push(`Classify failed for: ${item.title.slice(0, 50)}`);
          itemsFailed++;
        }

        if (relevance.score < MIN_RELEVANCE_SAVE) continue;

        // Save to scout_findings
        const { data: finding, error: saveErr } = await client
          .from("scout_findings")
          .insert({
            source_url: item.link,
            source_type: item.source_type,
            title: item.title,
            summary: item.description.slice(0, 500),
            raw_content: [item.title, item.description].join("\n\n").slice(0, 5000),
            relevance_score: relevance.score,
            category: relevance.category,
            related_to: relevance.related_to,
            county: relevance.county,
            embedded: false,
            processed: false,
          })
          .select("id")
          .single();

        if (saveErr) {
          console.error("[scout] Save finding failed:", saveErr.message);
          itemsFailed++;
          continue;
        }

        itemsSaved++;
        const findingId = finding?.id;

        // ── 4. Embed high-relevance items ───────────────────────────────────

        if (relevance.score >= MIN_RELEVANCE_EMBED && jinaKey && findingId) {
          const embeddingText = `${item.title}\n\n${item.description}`;
          const vector = await embedText(jinaKey, embeddingText);

          if (vector) {
            const { error: embedErr } = await client.from("vectors").insert({
              title: item.title.slice(0, 500),
              content: embeddingText.slice(0, 4000),
              embedding: JSON.stringify(vector),
              metadata: {
                source_name: item.source_name,
                category: relevance.category,
                related_to: relevance.related_to,
                county: relevance.county,
                finding_id: findingId,
                pub_date: item.pubDate,
              },
              source_type: `scout_${item.source_type}`,
              source_id: findingId,
            });

            if (!embedErr) {
              // Mark embedded
              await client.from("scout_findings").update({ embedded: true }).eq("id", findingId);
              itemsEmbedded++;

              // ── 5. Emit event → civic-sage ────────────────────────────────
              await emitEvent(client, "new_finding", AGENT_NAME, {
                finding_id: findingId,
                title: item.title,
                category: relevance.category,
                related_to: relevance.related_to,
                county: relevance.county,
                score: relevance.score,
              }, "civic-sage");
            } else {
              console.warn("[scout] Embed insert failed:", embedErr.message);
            }
          }
        } else if (relevance.score >= MIN_RELEVANCE_EMBED && findingId) {
          // No Jina key yet — still emit event for Sage (it will use raw content)
          console.log(`[scout] Jina key not set — emitting event without vector for finding ${findingId}`);
          await emitEvent(client, "new_finding", AGENT_NAME, {
            finding_id: findingId,
            title: item.title,
            category: relevance.category,
            related_to: relevance.related_to,
            county: relevance.county,
            score: relevance.score,
            embedded: false,
          }, "civic-sage");
        }
      }

      // Delay between batches to respect Groq rate limits
      if (i + BATCH_SIZE < newItems.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // ── 6. Log run ────────────────────────────────────────────────────────────

    const durationMs = Date.now() - startedAt;
    const runStatus = itemsFailed > 0 && itemsSaved === 0 ? "failed"
      : itemsFailed > 0 ? "partial"
      : "success";

    await logAgentRun(client, AGENT_NAME, {
      trigger_type: triggerType,
      items_scanned: itemsScanned,
      items_actioned: itemsSaved,
      items_failed: itemsFailed,
      duration_ms: durationMs,
      status: runStatus,
      error_summary: errors.length ? errors.slice(0, 3).join("; ") : undefined,
      metadata: {
        items_new: newItems.length,
        items_saved: itemsSaved,
        items_embedded: itemsEmbedded,
        has_jina_key: !!jinaKey,
        has_newsdata_key: !!newsDataKey,
      },
    });

    console.log(`[scout] Run complete — scanned: ${itemsScanned}, saved: ${itemsSaved}, embedded: ${itemsEmbedded}, failed: ${itemsFailed}`);

    return jsonResponse({
      ok: true,
      items_scanned: itemsScanned,
      items_saved: itemsSaved,
      items_embedded: itemsEmbedded,
      items_failed: itemsFailed,
      duration_ms: durationMs,
    });

  } catch (err) {
    const msg = (err as Error).message;
    console.error("[scout] Fatal error:", msg);

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
