-- Weekly Stats Tracking for Communities
-- Implements Reddit-style "Weekly visitors" and "Weekly contributions" metrics

-- 1. Create community_visits table to track unique visitors
CREATE TABLE IF NOT EXISTS community_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    -- One visit per user per day
    CONSTRAINT unique_daily_visit UNIQUE (community_id, user_id, visit_date)
);

-- Indexes for efficient weekly queries
CREATE INDEX IF NOT EXISTS idx_community_visits_community_date 
ON community_visits(community_id, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_community_visits_user 
ON community_visits(user_id);

-- 2. Enable RLS
ALTER TABLE community_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can view (for count queries)
CREATE POLICY "View community visits"
ON community_visits FOR SELECT
USING (true);

-- Authenticated users can insert their own visits
CREATE POLICY "Users can log their visits"
ON community_visits FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. Function to get weekly visitor count
CREATE OR REPLACE FUNCTION get_weekly_visitors(community_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT user_id)
        FROM community_visits
        WHERE community_id = community_uuid
        AND visit_date >= CURRENT_DATE - INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Function to get weekly contributions count (posts + comments)
CREATE OR REPLACE FUNCTION get_weekly_contributions(community_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    post_count INTEGER;
    comment_count INTEGER;
BEGIN
    -- Count posts in the community from the last 7 days
    SELECT COUNT(*) INTO post_count
    FROM posts
    WHERE community_id = community_uuid
    AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Count comments on posts in this community from the last 7 days
    SELECT COUNT(*) INTO comment_count
    FROM comments c
    JOIN posts p ON c.post_id = p.id
    WHERE p.community_id = community_uuid
    AND c.created_at >= NOW() - INTERVAL '7 days';
    
    RETURN COALESCE(post_count, 0) + COALESCE(comment_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Function to log a community visit (safe - uses auth.uid() with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION log_community_visit(p_community_id UUID)
RETURNS VOID AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    IF current_user_id IS NULL THEN
        RETURN; -- Not authenticated, do nothing
    END IF;
    
    INSERT INTO community_visits (community_id, user_id, visit_date, visited_at)
    VALUES (p_community_id, current_user_id, CURRENT_DATE, NOW())
    ON CONFLICT ON CONSTRAINT unique_daily_visit 
    DO UPDATE SET visited_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_weekly_visitors(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_contributions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_community_visit(UUID) TO authenticated;
