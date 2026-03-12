-- Channel Analytics Table
-- Tracks daily activity metrics per channel for analytics display

CREATE TABLE IF NOT EXISTS channel_analytics (
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    message_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (channel_id, date)
);

-- Index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_channel_analytics_date ON channel_analytics(date DESC);

-- Enable RLS
ALTER TABLE channel_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can view analytics
CREATE POLICY "View channel analytics"
ON channel_analytics FOR SELECT
USING (true);

-- Function to increment channel metrics (called by triggers)
CREATE OR REPLACE FUNCTION increment_channel_metric(
    p_channel_id UUID,
    p_metric TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO channel_analytics (channel_id, date)
    VALUES (p_channel_id, CURRENT_DATE)
    ON CONFLICT (channel_id, date) DO NOTHING;
    
    IF p_metric = 'post' THEN
        UPDATE channel_analytics 
        SET post_count = post_count + 1, updated_at = NOW()
        WHERE channel_id = p_channel_id AND date = CURRENT_DATE;
    ELSIF p_metric = 'message' THEN
        UPDATE channel_analytics 
        SET message_count = message_count + 1, updated_at = NOW()
        WHERE channel_id = p_channel_id AND date = CURRENT_DATE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get channel analytics summary for last 7 days
CREATE OR REPLACE FUNCTION get_channel_analytics(p_channel_id UUID)
RETURNS TABLE (
    total_posts INTEGER,
    total_messages INTEGER,
    avg_daily_activity DECIMAL,
    most_active_day DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(ca.post_count), 0)::INTEGER as total_posts,
        COALESCE(SUM(ca.message_count), 0)::INTEGER as total_messages,
        COALESCE(AVG(ca.post_count + ca.message_count), 0)::DECIMAL as avg_daily_activity,
        (SELECT date FROM channel_analytics 
         WHERE channel_id = p_channel_id 
         ORDER BY (post_count + message_count) DESC LIMIT 1) as most_active_day
    FROM channel_analytics ca
    WHERE ca.channel_id = p_channel_id
    AND ca.date >= CURRENT_DATE - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION increment_channel_metric(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_channel_analytics(UUID) TO authenticated;
