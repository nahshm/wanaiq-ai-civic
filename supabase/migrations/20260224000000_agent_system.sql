-- ============================================================
-- WAAS: WanaIQ Autonomous Agent System — Database Foundation
-- Migration: 20260224000000_agent_system.sql
-- ============================================================

-- ── 1. AGENT EVENT BUS ──────────────────────────────────────
-- Inter-agent communication. Agents emit events; other agents
-- poll or are triggered by new rows.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT        NOT NULL,   -- 'violation_detected','new_finding','insight_ready'
  source_agent TEXT        NOT NULL,   -- 'civic-guardian','civic-tracker', etc.
  target_agent TEXT,                   -- NULL = broadcast; set = directed
  payload      JSONB       NOT NULL DEFAULT '{}',
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','processing','done','failed')),
  error_detail TEXT,                   -- populated on failure
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS agent_events_status_idx
  ON agent_events (status, created_at)
  WHERE status = 'pending';

COMMENT ON TABLE agent_events IS
  'Event bus for inter-agent communication in the WAAS system.';

-- ── 2. AGENT PROPOSALS ─────────────────────────────────────
-- Agents submit decisions here. Minion (or a human admin)
-- reviews and approves/rejects. Auto-actioned on high confidence.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_proposals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name    TEXT        NOT NULL,
  proposal_type TEXT        NOT NULL,
  subject_type  TEXT        CHECK (subject_type IN ('user','post','comment','project','promise','official')),
  subject_id    UUID,
  reasoning     TEXT        NOT NULL,
  confidence    FLOAT       CHECK (confidence BETWEEN 0 AND 1),
  evidence      JSONB       NOT NULL DEFAULT '{}',
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','rejected','auto_actioned','expired')),
  reviewed_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  action_taken  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);


CREATE INDEX IF NOT EXISTS agent_proposals_pending_idx
  ON agent_proposals (status, created_at)
  WHERE status = 'pending';

COMMENT ON TABLE agent_proposals IS
  'Pending agent decisions. Reviewed by Minion or human admins.';

-- ── 3. AGENT STATE / MEMORY ────────────────────────────────
-- Persistent key-value store per agent. Allows agents to
-- remember thresholds, cursors, and learned patterns between runs.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_state (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name  TEXT        NOT NULL,
  state_key   TEXT        NOT NULL,
  state_value JSONB       NOT NULL,
  description TEXT,                    -- human-readable label for the admin UI
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agent_name, state_key)
);

COMMENT ON TABLE agent_state IS
  'Persistent memory for each agent. Survives between runs.';

-- Pre-seed default thresholds for Guardian
INSERT INTO agent_state (agent_name, state_key, state_value, description) VALUES
  ('civic-guardian', 'auto_action_threshold',  '0.90', 'Confidence above which Guardian acts without Minion review'),
  ('civic-guardian', 'review_threshold',        '0.60', 'Confidence below which content is queued for human review'),
  ('civic-guardian', 'repeat_offender_strikes', '3',    'How many strikes before a user is auto-escalated to ban proposal'),
  ('civic-minion',   'auto_approve_threshold',  '0.90', 'Confidence above which Minion auto-executes a proposal'),
  ('civic-minion',   'human_escalation_threshold', '0.70', 'Proposals below this always go to humans'),
  ('civic-tracker',  'delay_threshold_days',    '30',   'Days overdue before Tracker fires a delay alert'),
  ('civic-tracker',  'budget_overrun_pct',      '20',   'Percentage overrun before Tracker fires a budget alert'),
  ('civic-tracker',  'stalled_days',            '90',   'Days without update before project is flagged as stalled')
ON CONFLICT (agent_name, state_key) DO NOTHING;

-- ── 4. AGENT RUNS — AUDIT LOG ──────────────────────────────
-- Every time an agent wakes and does work, it records a run.
-- Used for performance monitoring and debugging.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_runs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name     TEXT        NOT NULL,
  trigger_type   TEXT        NOT NULL CHECK (trigger_type IN ('cron','webhook','event','api','manual')),
  items_scanned  INT         NOT NULL DEFAULT 0,
  items_actioned INT         NOT NULL DEFAULT 0,
  items_failed   INT         NOT NULL DEFAULT 0,
  duration_ms    INT,
  status         TEXT        NOT NULL CHECK (status IN ('success','partial','failed')),
  error_summary  TEXT,
  metadata       JSONB       NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_runs_agent_created_idx
  ON agent_runs (agent_name, created_at DESC);

COMMENT ON TABLE agent_runs IS
  'Audit log for every agent execution. Use for monitoring and alerting.';

-- ── 5. USER WARNINGS ───────────────────────────────────────
-- Formal warnings issued to users by Guardian (via Minion approval).
-- Escalating severity: info → warning → strike → ban.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_warnings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_by     TEXT        NOT NULL DEFAULT 'civic-guardian',
  reason        TEXT        NOT NULL,
  severity      TEXT        NOT NULL DEFAULT 'warning'
                            CHECK (severity IN ('info','warning','strike','temp_ban','permanent_ban')),
  content_ref   UUID,                  -- post_id or comment_id that triggered this
  content_type  TEXT        CHECK (content_type IN ('post','comment',NULL)),
  expires_at    TIMESTAMPTZ,           -- NULL = permanent
  acknowledged  BOOLEAN     NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_warnings_user_idx
  ON user_warnings (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_warnings_unacknowledged_idx
  ON user_warnings (user_id)
  WHERE acknowledged = false;

COMMENT ON TABLE user_warnings IS
  'Formal enforcement history per user. Drives escalation logic in Guardian/Minion.';

-- ── 6. ACCOUNTABILITY ALERTS ──────────────────────────────
-- Output of Accountability Tracker. Public-facing alerts about
-- overdue projects, budget anomalies, and broken promises.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accountability_alerts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type     TEXT        NOT NULL CHECK (alert_type IN ('delay','budget_overrun','stalled','promise_broken','completed_early','discrepancy')),
  subject_type   TEXT        NOT NULL CHECK (subject_type IN ('project','promise','official','budget')),
  subject_id     UUID        NOT NULL,
  subject_name   TEXT,
  severity       INT         NOT NULL DEFAULT 5 CHECK (severity BETWEEN 1 AND 10),
  summary        TEXT        NOT NULL,
  details        JSONB       NOT NULL DEFAULT '{}',
  county         TEXT,
  constituency   TEXT,
  is_public      BOOLEAN     NOT NULL DEFAULT true,
  acknowledged   BOOLEAN     NOT NULL DEFAULT false,
  acknowledged_by UUID       REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS accountability_alerts_public_idx
  ON accountability_alerts (is_public, severity DESC, created_at DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS accountability_alerts_county_idx
  ON accountability_alerts (county, created_at DESC);

COMMENT ON TABLE accountability_alerts IS
  'Public alerts from Accountability Tracker. Shown in feed and dashboard.';

-- ── 7. AGENT DRAFTS (QUILL OUTPUT) ────────────────────────
-- All Quill-generated content awaits human approval here.
-- Nothing Quill produces is sent/published automatically.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_drafts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name   TEXT        NOT NULL DEFAULT 'civic-quill',
  draft_type   TEXT        NOT NULL CHECK (draft_type IN (
                             'warning_message','civic_summary','user_notification',
                             'educational_post','accountability_report','alert_caption')),
  target_type  TEXT        CHECK (target_type IN ('user','community','public','admin')),
  target_id    UUID,
  title        TEXT,
  content      TEXT        NOT NULL,
  language     TEXT        NOT NULL DEFAULT 'en' CHECK (language IN ('en','sw','bilingual')),
  metadata     JSONB       NOT NULL DEFAULT '{}',
  source_event UUID        REFERENCES agent_events(id) ON DELETE SET NULL,
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','sent','rejected','expired')),
  approved_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at  TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_drafts_pending_idx
  ON agent_drafts (status, created_at)
  WHERE status = 'pending';

COMMENT ON TABLE agent_drafts IS
  'Human-gated content queue. All Quill output requires admin approval before delivery.';

-- ── 8. SCOUT FINDINGS ─────────────────────────────────────
-- External data collected by Scout from government portals,
-- news APIs, and RSS feeds.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scout_findings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url      TEXT,
  source_type     TEXT        CHECK (source_type IN (
                                'hansard','gazette','county_tender','news',
                                'budget_doc','official_statement','court_ruling','other')),
  title           TEXT,
  summary         TEXT,
  raw_content     TEXT,
  relevance_score FLOAT       CHECK (relevance_score BETWEEN 0 AND 1),
  category        TEXT        CHECK (category IN (
                                'budget','tender','scandal','promise','policy',
                                'official_statement','infrastructure','other')),
  related_to      TEXT        CHECK (related_to IN ('project','official','policy','county','promise')),
  related_id      UUID,
  related_name    TEXT,
  county          TEXT,
  embedded        BOOLEAN     NOT NULL DEFAULT false,  -- has it been stored in vectors?
  processed       BOOLEAN     NOT NULL DEFAULT false,  -- has Sage/Observer acted on it?
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scout_findings_unprocessed_idx
  ON scout_findings (processed, created_at)
  WHERE processed = false;

COMMENT ON TABLE scout_findings IS
  'External civic intelligence collected by Scout. Source of truth for Sage and Observer.';

-- ── 9. AGENT FEEDBACK ─────────────────────────────────────
-- Human moderators rate agent decisions. Used monthly to
-- refine system prompts and adjust confidence thresholds.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_feedback (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  UUID        REFERENCES agent_proposals(id) ON DELETE CASCADE,
  run_id       UUID        REFERENCES agent_runs(id) ON DELETE SET NULL,
  agent_name   TEXT        NOT NULL,
  reviewer_id  UUID        NOT NULL REFERENCES auth.users(id),
  rating       TEXT        NOT NULL CHECK (rating IN ('correct','too_aggressive','too_lenient','wrong_category','hallucinated')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE agent_feedback IS
  'Human ratings of agent decisions. Monthly review drives prompt and threshold improvements.';

-- ── 10. EXTEND EXISTING TABLES ────────────────────────────
-- Add columns to posts and comments for agent-set flags.
-- Do NOT drop any existing columns.
-- ────────────────────────────────────────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS is_hidden         BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_reason     TEXT,
  ADD COLUMN IF NOT EXISTS hidden_by_agent   TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT       DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','verified','disputed','insufficient_evidence')),
  ADD COLUMN IF NOT EXISTS verification_source TEXT,
  ADD COLUMN IF NOT EXISTS agent_flags       JSONB       NOT NULL DEFAULT '[]';

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS is_hidden         BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_reason     TEXT,
  ADD COLUMN IF NOT EXISTS hidden_by_agent   TEXT,
  ADD COLUMN IF NOT EXISTS agent_flags       JSONB       NOT NULL DEFAULT '[]';

-- Index for Guardian's cron scan to find recent unprocessed content
CREATE INDEX IF NOT EXISTS posts_guardian_scan_idx
  ON posts (created_at DESC)
  WHERE is_hidden = false;

CREATE INDEX IF NOT EXISTS comments_guardian_scan_idx
  ON comments (created_at DESC)
  WHERE is_hidden = false;

-- ── 11. ROW LEVEL SECURITY ────────────────────────────────
-- All agent tables use service role for writes.
-- Restricted reads for users, admins, and public data.
-- ────────────────────────────────────────────────────────────
ALTER TABLE agent_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_proposals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_state             ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_alerts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_drafts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_findings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_feedback          ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin','super_admin')
  );
$$;

-- Users can only see their own warnings
CREATE POLICY "user_warnings_own_read" ON user_warnings
  FOR SELECT USING (auth.uid() = user_id);

-- Admins see all warnings
CREATE POLICY "user_warnings_admin_read" ON user_warnings
  FOR SELECT USING (is_admin());

-- Public accountability alerts visible to all authenticated users
CREATE POLICY "accountability_alerts_public_read" ON accountability_alerts
  FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);

-- Admins see all accountability alerts
CREATE POLICY "accountability_alerts_admin_read" ON accountability_alerts
  FOR SELECT USING (is_admin());

-- Only admins can view agent infrastructure tables
CREATE POLICY "agent_proposals_admin_read" ON agent_proposals
  FOR SELECT USING (is_admin());

CREATE POLICY "agent_proposals_admin_update" ON agent_proposals
  FOR UPDATE USING (is_admin());

CREATE POLICY "agent_runs_admin_read" ON agent_runs
  FOR SELECT USING (is_admin());

CREATE POLICY "agent_state_admin_read" ON agent_state
  FOR SELECT USING (is_admin());

CREATE POLICY "agent_state_admin_update" ON agent_state
  FOR UPDATE USING (is_admin());

CREATE POLICY "agent_drafts_admin_read" ON agent_drafts
  FOR SELECT USING (is_admin());

CREATE POLICY "agent_drafts_admin_update" ON agent_drafts
  FOR UPDATE USING (is_admin());

CREATE POLICY "agent_events_admin_read" ON agent_events
  FOR SELECT USING (is_admin());

CREATE POLICY "scout_findings_admin_read" ON scout_findings
  FOR SELECT USING (is_admin());

CREATE POLICY "agent_feedback_admin_all" ON agent_feedback
  FOR ALL USING (is_admin());

-- ── 12. HELPER FUNCTIONS ──────────────────────────────────
-- These are called by Edge Functions (via service role) to
-- interact with the agent infrastructure safely.
-- ────────────────────────────────────────────────────────────

-- Get unread warning count for a user (used in notification badge)
CREATE OR REPLACE FUNCTION get_user_warning_count(p_user_id UUID)
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)::INT FROM user_warnings
  WHERE user_id = p_user_id AND acknowledged = false;
$$;

-- Get agent threshold value (used by Edge Functions via service role)
CREATE OR REPLACE FUNCTION get_agent_threshold(p_agent TEXT, p_key TEXT)
RETURNS FLOAT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (state_value::TEXT)::FLOAT
  FROM agent_state
  WHERE agent_name = p_agent AND state_key = p_key;
$$;

-- Soft-delete a post (used by Guardian via service role)
CREATE OR REPLACE FUNCTION agent_hide_post(
  p_post_id UUID,
  p_agent   TEXT,
  p_reason  TEXT
) RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE posts
  SET is_hidden = true, hidden_reason = p_reason, hidden_by_agent = p_agent
  WHERE id = p_post_id AND is_hidden = false;
$$;

-- Soft-delete a comment (used by Guardian via service role)
CREATE OR REPLACE FUNCTION agent_hide_comment(
  p_comment_id UUID,
  p_agent      TEXT,
  p_reason     TEXT
) RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE comments
  SET is_hidden = true, hidden_reason = p_reason, hidden_by_agent = p_agent
  WHERE id = p_comment_id AND is_hidden = false;
$$;

-- Acknowledge a warning (called from frontend)
CREATE OR REPLACE FUNCTION acknowledge_warning(p_warning_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE user_warnings
  SET acknowledged = true, acknowledged_at = NOW()
  WHERE id = p_warning_id
    AND user_id = auth.uid()
    AND acknowledged = false;
$$;
