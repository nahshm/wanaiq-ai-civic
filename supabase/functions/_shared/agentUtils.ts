/**
 * agentUtils.ts — Shared WAAS Agent Utilities
 *
 * All 7 agents import these helpers to interact with the agent infrastructure
 * consistently. Every function uses the Supabase service role client so agents
 * can bypass RLS (they are system actors, not users).
 *
 * Import pattern in each agent:
 *   import { logAgentRun, emitEvent, createProposal } from '../_shared/agentUtils.ts';
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentRunStats {
  trigger_type: "cron" | "webhook" | "event" | "api" | "manual";
  items_scanned?: number;
  items_actioned?: number;
  items_failed?: number;
  duration_ms?: number;
  status: "success" | "partial" | "failed";
  error_summary?: string;
  metadata?: Record<string, unknown>;
}

export interface ProposalOptions {
  proposal_type: string;
  subject_type?: "user" | "post" | "comment" | "project" | "promise" | "official";
  subject_id?: string;
  reasoning: string;
  confidence: number;
  evidence?: Record<string, unknown>;
}

export type EventType =
  | "violation_detected"
  | "fact_check_requested"
  | "fact_check_complete"
  | "new_finding"
  | "insight_ready"
  | "accountability_alert"
  | "proposal_approved"
  | "proposal_rejected"
  | "draft_ready"
  | "agent_error";

// ─── Core Utilities ───────────────────────────────────────────────────────────

/**
 * Log a completed agent run to `agent_runs`.
 * Call this at the END of every agent execution, success or failure.
 */
export async function logAgentRun(
  serviceClient: SupabaseClient,
  agentName: string,
  stats: AgentRunStats
): Promise<void> {
  const { error } = await serviceClient.from("agent_runs").insert({
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

  if (error) {
    // Non-fatal: log to console but don't crash the agent
    console.error(`[agentUtils] Failed to log run for ${agentName}:`, error.message);
  }
}

/**
 * Emit an event onto the agent_events bus.
 * Other agents poll this table or are triggered by DB webhooks on it.
 *
 * @param source  - which agent is emitting (e.g. 'civic-guardian')
 * @param target  - optional: directed to a specific agent; null = broadcast
 */
export async function emitEvent(
  serviceClient: SupabaseClient,
  type: EventType,
  source: string,
  payload: Record<string, unknown>,
  target?: string
): Promise<string | null> {
  const { data, error } = await serviceClient
    .from("agent_events")
    .insert({
      event_type: type,
      source_agent: source,
      target_agent: target ?? null,
      payload,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[agentUtils] emitEvent failed (${type}):`, error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Submit a decision proposal to `agent_proposals`.
 * Minion (or a human admin) will review and approve/reject.
 */
export async function createProposal(
  serviceClient: SupabaseClient,
  agentName: string,
  options: ProposalOptions
): Promise<string | null> {
  const { data, error } = await serviceClient
    .from("agent_proposals")
    .insert({
      agent_name: agentName,
      proposal_type: options.proposal_type,
      subject_type: options.subject_type ?? null,
      subject_id: options.subject_id ?? null,
      reasoning: options.reasoning,
      confidence: options.confidence,
      evidence: options.evidence ?? {},
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[agentUtils] createProposal failed:`, error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Persist a state key-value for an agent (its memory between runs).
 * Uses UPSERT so agents can safely call this on every run.
 */
export async function updateAgentState(
  serviceClient: SupabaseClient,
  agentName: string,
  key: string,
  value: unknown
): Promise<void> {
  const { error } = await serviceClient.from("agent_state").upsert(
    {
      agent_name: agentName,
      state_key: key,
      state_value: value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "agent_name,state_key" }
  );

  if (error) {
    console.error(`[agentUtils] updateAgentState failed (${agentName}/${key}):`, error.message);
  }
}

/**
 * Read a persisted state value for an agent.
 * Returns null if not found — agents must handle this gracefully.
 */
export async function getAgentState(
  serviceClient: SupabaseClient,
  agentName: string,
  key: string
): Promise<unknown | null> {
  const { data, error } = await serviceClient
    .from("agent_state")
    .select("state_value")
    .eq("agent_name", agentName)
    .eq("state_key", key)
    .maybeSingle();

  if (error) {
    console.error(`[agentUtils] getAgentState failed (${agentName}/${key}):`, error.message);
    return null;
  }
  return data?.state_value ?? null;
}

/**
 * Agent-safe content hiding. Wraps the DB function so agents
 * don't need to handle raw SQL calls.
 */
export async function hideContent(
  serviceClient: SupabaseClient,
  contentType: "post" | "comment",
  contentId: string,
  agentName: string,
  reason: string
): Promise<boolean> {
  const fnName = contentType === "post" ? "agent_hide_post" : "agent_hide_comment";

  const { error } = await serviceClient.rpc(fnName, {
    [`p_${contentType}_id`]: contentId,
    p_agent: agentName,
    p_reason: reason,
  });

  if (error) {
    console.error(`[agentUtils] hideContent failed (${contentType} ${contentId}):`, error.message);
    return false;
  }
  return true;
}

/**
 * Issue a formal warning to a user.
 */
export async function issueWarning(
  serviceClient: SupabaseClient,
  userId: string,
  issuedBy: string,
  reason: string,
  severity: "info" | "warning" | "strike" | "temp_ban" | "permanent_ban",
  options?: {
    content_ref?: string;
    content_type?: "post" | "comment";
    expires_at?: string;
  }
): Promise<string | null> {
  const { data, error } = await serviceClient
    .from("user_warnings")
    .insert({
      user_id: userId,
      issued_by: issuedBy,
      reason,
      severity,
      content_ref: options?.content_ref ?? null,
      content_type: options?.content_type ?? null,
      expires_at: options?.expires_at ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[agentUtils] issueWarning failed for user ${userId}:`, error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Get the count of active (non-expired, unacknowledged) warnings for a user.
 * Used by agents to determine escalation level.
 */
export async function getUserStrikeCount(
  serviceClient: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await serviceClient
    .from("user_warnings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("severity", ["warning", "strike", "temp_ban"])
    .or("expires_at.is.null,expires_at.gt.now()");

  if (error) {
    console.error(`[agentUtils] getUserStrikeCount failed:`, error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Mark an event as done/failed on the agent_events bus.
 */
export async function resolveEvent(
  serviceClient: SupabaseClient,
  eventId: string,
  status: "done" | "failed",
  errorDetail?: string
): Promise<void> {
  const { error } = await serviceClient
    .from("agent_events")
    .update({
      status,
      processed_at: new Date().toISOString(),
      error_detail: errorDetail ?? null,
    })
    .eq("id", eventId);

  if (error) {
    console.error(`[agentUtils] resolveEvent failed (${eventId}):`, error.message);
  }
}

/**
 * Save a Quill draft for human review.
 * Always call this instead of sending content directly.
 */
export async function saveAgentDraft(
  serviceClient: SupabaseClient,
  options: {
    agent_name?: string;
    draft_type: "warning_message" | "civic_summary" | "user_notification" | "educational_post" | "accountability_report" | "alert_caption";
    target_type?: "user" | "community" | "public" | "admin";
    target_id?: string;
    title?: string;
    content: string;
    language?: "en" | "sw" | "bilingual";
    metadata?: Record<string, unknown>;
    source_event?: string;
  }
): Promise<string | null> {
  const { data, error } = await serviceClient
    .from("agent_drafts")
    .insert({
      agent_name: options.agent_name ?? "civic-quill",
      draft_type: options.draft_type,
      target_type: options.target_type ?? null,
      target_id: options.target_id ?? null,
      title: options.title ?? null,
      content: options.content,
      language: options.language ?? "en",
      metadata: options.metadata ?? {},
      source_event: options.source_event ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[agentUtils] saveAgentDraft failed:`, error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Create an accountability alert (Tracker's primary output).
 */
export async function createAccountabilityAlert(
  serviceClient: SupabaseClient,
  options: {
    alert_type: "delay" | "budget_overrun" | "stalled" | "promise_broken" | "completed_early" | "discrepancy";
    subject_type: "project" | "promise" | "official" | "budget";
    subject_id: string;
    subject_name?: string;
    severity: number;
    summary: string;
    details?: Record<string, unknown>;
    county?: string;
    constituency?: string;
    is_public?: boolean;
  }
): Promise<string | null> {
  const { data, error } = await serviceClient
    .from("accountability_alerts")
    .insert({
      ...options,
      is_public: options.is_public ?? true,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[agentUtils] createAccountabilityAlert failed:`, error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Parse a Groq JSON response safely.
 * Returns null if the response is malformed or empty.
 * Agents should handle null by falling back to human review.
 */
export function parseGroqJson<T>(rawContent: string): T | null {
  try {
    if (!rawContent || rawContent.trim() === "") return null;
    const parsed = JSON.parse(rawContent);
    return parsed as T;
  } catch (e) {
    console.error("[agentUtils] parseGroqJson failed:", e, "Raw:", rawContent?.slice(0, 200));
    return null;
  }
}

/**
 * Build a standard CORS response header set.
 * Consistent across all agent Edge Functions.
 */
export const agentCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-internal-trigger",
} as const;

/**
 * Standard JSON response builder for Edge Functions.
 */
export function jsonResponse(
  body: Record<string, unknown>,
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...agentCorsHeaders, "Content-Type": "application/json" },
  });
}
