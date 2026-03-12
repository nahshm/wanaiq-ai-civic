-- Add AI routing fields to civic_issues table (or civic_actions if that is the table name, let's verify)
-- The existing code uses 'civic_actions'. The user prompt says 'civic_issues'. 
-- I MUST CHECK THE EXISTING SCHEMA OR CODE to see which table is used.
-- In ReportIssue.tsx (Step 486), it says: supabase.from('civic_actions').insert(...)
-- So the table name is 'civic_actions', NOT 'civic_issues'.
-- I will add columns to 'civic_actions'.

ALTER TABLE civic_actions
ADD COLUMN IF NOT EXISTS issue_type TEXT,
ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
ADD COLUMN IF NOT EXISTS severity INTEGER,
ADD COLUMN IF NOT EXISTS ai_routing_confidence FLOAT,
ADD COLUMN IF NOT EXISTS estimated_resolution_days INTEGER,
ADD COLUMN IF NOT EXISTS actual_resolution_days INTEGER,
ADD COLUMN IF NOT EXISTS user_rating INTEGER;

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_civic_actions_routing ON civic_actions(issue_type, severity);
