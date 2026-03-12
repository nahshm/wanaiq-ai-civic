-- Migration: waas_phase4_weekly_cron
-- Adds weekly pg_cron job for civic-quill educational digest
-- Runs every Monday at 07:00 EAT (04:00 UTC) to generate weekly civic education posts

-- Ensure pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Remove any existing weekly civic-quill schedule to avoid duplicates
SELECT cron.unschedule('civic-quill-weekly')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'civic-quill-weekly'
);

-- Schedule civic-quill weekly educational digest:
-- Cron: '0 4 * * 1' = every Monday at 04:00 UTC (07:00 EAT)
-- Sends draft_type='educational_post' to agent_drafts for admin review
SELECT cron.schedule(
  'civic-quill-weekly',
  '0 4 * * 1',
  $$
    SELECT net.http_post(
      url       := (SELECT value FROM agent_state WHERE agent_name = 'civic-quill' AND key = 'function_url'
                    LIMIT 1),
      headers   := '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
                   current_setting('app.service_role_key', true) || '"}'::jsonb,
      body      := '{"trigger": "cron", "draft_type": "educational_post", "topic": "weekly_civic_digest"}'::jsonb
    );
  $$
);

-- Simpler alternative using pg_net directly to the Edge Function URL
-- (uses the stored function_url in agent_state seeded during Phase 4 bootstrap)
-- The above schedule will be active immediately.

COMMENT ON COLUMN cron.job.jobname IS 'civic-quill-weekly: Generates weekly civic education digest (EN+SW) every Monday 07:00 EAT';
