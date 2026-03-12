-- Add governance fields to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS governance_verdict TEXT CHECK (governance_verdict IN ('APPROVED', 'NEEDS_REVISION', 'FLAGGED', 'BLOCKED')),
ADD COLUMN IF NOT EXISTS governance_confidence FLOAT,
ADD COLUMN IF NOT EXISTS governance_timestamp TIMESTAMPTZ DEFAULT NOW();

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_posts_governance ON posts(governance_verdict);
