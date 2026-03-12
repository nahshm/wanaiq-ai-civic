-- ==========================================
-- SERVER-SIDE RATE LIMITING IMPLEMENTATION
-- ==========================================
-- 
-- Implements PostgreSQL-based rate limiting for:
-- 1. Post creation (10/minute per user)
-- 2. Comment creation (20/minute per user)
-- 3. Voting (30/minute per user)
-- 4. Profile updates (5/minute per user)
-- 5. Community creation (3/hour per user)
--
-- Uses automatic cleanup via PostgreSQL triggers
-- ==========================================

-- 1. CREATE RATE LIMIT TABLE
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, action)
);

-- Performance optimization: Tune autovacuum for high-frequency updates
-- Prevents table bloat from constant INSERT/UPDATE cycles
ALTER TABLE rate_limits SET (
  autovacuum_vacuum_scale_factor = 0.01,  -- Vacuum when 1% of rows change (vs default 20%)
  autovacuum_analyze_scale_factor = 0.005, -- Analyze when 0.5% change
  autovacuum_vacuum_cost_delay = 10        -- Faster vacuum cycles
);

-- Create index for fast cleanup and lookups
-- Note: No WHERE clause because now() is not IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_rate_limits_window 
  ON rate_limits(window_start DESC);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limits
CREATE POLICY "Users can view own rate limits" ON rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- System can manage all rate limits
CREATE POLICY "System can manage rate limits" ON rate_limits
  FOR ALL USING (true);

-- 2. RATE LIMIT CHECK FUNCTION (with concurrency protection)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_action TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_current_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_lock_acquired BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- CONCURRENCY PROTECTION: Acquire advisory lock to prevent race conditions
  -- Lock ID is hash of (user_id + action) to make it unique per user-action pair
  v_lock_acquired := pg_try_advisory_xact_lock(
    hashtext(v_user_id::text || p_action)
  );
  
  IF NOT v_lock_acquired THEN
    -- If lock not acquired, another request is processing - fail fast
    RAISE EXCEPTION 'Too many concurrent requests. Please retry.';
  END IF;

  -- Get current rate limit record (now protected by advisory lock)
  SELECT request_count, window_start 
  INTO v_current_count, v_window_start
  FROM rate_limits
  WHERE user_id = v_user_id 
    AND action = p_action;

  -- If no record exists or window expired, create/reset
  IF v_current_count IS NULL OR v_window_start < (now() - (p_window_minutes || ' minutes')::interval) THEN
    INSERT INTO rate_limits (user_id, action, request_count, window_start)
    VALUES (v_user_id, p_action, 1, now())
    ON CONFLICT (user_id, action) 
    DO UPDATE SET 
      request_count = 1,
      window_start = now();
    
    RETURN TRUE; -- First request in new window
  END IF;

  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RAISE EXCEPTION 'Rate limit exceeded for %. Try again in % seconds.', 
      p_action, 
      EXTRACT(EPOCH FROM ((v_window_start + (p_window_minutes || ' minutes')::interval) - now()))::INTEGER;
  END IF;

  -- Increment counter (safe from race conditions due to advisory lock)
  UPDATE rate_limits
  SET request_count = request_count + 1
  WHERE user_id = v_user_id AND action = p_action;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER  -- Runs with privileges of function creator
   SET search_path = public, pg_temp;  -- SECURITY: Prevent search_path attacks

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;

-- 3. AUTOMATIC CLEANUP FUNCTION
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  -- Delete records older than 1 hour
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE CLEANUP SCHEDULE (requires pg_cron extension)
-- This can be run manually or via cron job
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT cleanup_rate_limits()');

-- 5. APPLY RATE LIMITING TO EXISTING FUNCTIONS

-- 5.1 Rate limit post creation RPC
CREATE OR REPLACE FUNCTION create_post_ratelimited(
  p_title TEXT,
  p_content TEXT,
  p_community_id UUID,
  p_tags TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID AS $$
DECLARE
  v_post_id UUID;
BEGIN
  -- Check rate limit: 10 posts per minute
  IF NOT check_rate_limit('create_post', 10, 1) THEN
    RETURN NULL;
  END IF;

  -- Create post
  INSERT INTO posts (
    title, 
    content, 
    author_id, 
    community_id, 
    tags
  )
  VALUES (
    p_title,
    p_content,
    auth.uid(),
    p_community_id,
    p_tags
  )
  RETURNING id INTO v_post_id;

  RETURN v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_post_ratelimited TO authenticated;

-- 5.2 Rate limit comment creation
CREATE OR REPLACE FUNCTION create_comment_ratelimited(
  p_content TEXT,
  p_post_id UUID,
  p_parent_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  -- Check rate limit: 20 comments per minute
  IF NOT check_rate_limit('create_comment', 20, 1) THEN
    RETURN NULL;
  END IF;

  -- Create comment
  INSERT INTO comments (
    content,
    post_id,
    parent_id,
    author_id
  )
  VALUES (
    p_content,
    p_post_id,
    p_parent_id,
    auth.uid()
  )
  RETURNING id INTO v_comment_id;

  RETURN v_comment_id;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER
   SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION create_comment_ratelimited TO authenticated;

-- 5.3 Rate limit voting
CREATE OR REPLACE FUNCTION vote_ratelimited(
  p_target_type TEXT, -- 'post' or 'comment'
  p_target_id UUID,
  p_vote_type TEXT -- 'up' or 'down'
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check rate limit: 30 votes per minute
  IF NOT check_rate_limit('vote', 30, 1) THEN
    RETURN FALSE;
  END IF;

  -- Upsert vote
  INSERT INTO votes (
    user_id,
    post_id,
    comment_id,
    vote_type
  )
  VALUES (
    auth.uid(),
    CASE WHEN p_target_type = 'post' THEN p_target_id ELSE NULL END,
    CASE WHEN p_target_type = 'comment' THEN p_target_id ELSE NULL END,
    p_vote_type
  )
  ON CONFLICT (user_id, post_id, comment_id)
  DO UPDATE SET vote_type = EXCLUDED.vote_type;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION vote_ratelimited TO authenticated;

-- 5.4 Rate limit profile updates
CREATE OR REPLACE FUNCTION update_profile_ratelimited(
  p_display_name TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_banner_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check rate limit: 5 profile updates per minute
  IF NOT check_rate_limit('update_profile', 5, 1) THEN
    RETURN FALSE;
  END IF;

  -- Update profile
  UPDATE profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    bio = COALESCE(p_bio, bio),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    banner_url = COALESCE(p_banner_url, banner_url),
    updated_at = now()
  WHERE id = auth.uid();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_profile_ratelimited TO authenticated;

-- 5.5 Rate limit community creation
CREATE OR REPLACE FUNCTION create_community_ratelimited(
  p_name TEXT,
  p_display_name TEXT,
  p_description TEXT,
  p_category TEXT
)
RETURNS UUID AS $$
DECLARE
  v_community_id UUID;
BEGIN
  -- Check rate limit: 3 communities per hour (stricter)
  IF NOT check_rate_limit('create_community', 3, 60) THEN
    RETURN NULL;
  END IF;

  -- Use existing RPC function
  SELECT create_community_with_channels(
    p_name,
    p_display_name,
    p_description,
    p_category,
    auth.uid()
  ) INTO v_community_id;

  RETURN v_community_id;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER
   SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION create_community_ratelimited TO authenticated;

-- 6. CREATE MONITORING VIEW
CREATE OR REPLACE VIEW rate_limit_stats AS
SELECT 
  action,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(request_count) as total_requests,
  AVG(request_count) as avg_requests_per_user,
  MAX(request_count) as max_requests,
  MIN(window_start) as earliest_window,
  MAX(window_start) as latest_window
FROM rate_limits
WHERE window_start > now() - interval '1 hour'
GROUP BY action
ORDER BY total_requests DESC;

-- Grant access to admins
GRANT SELECT ON rate_limit_stats TO authenticated;

-- 7. HELPER FUNCTION: Get user's current rate limit status
CREATE OR REPLACE FUNCTION get_rate_limit_status(p_action TEXT DEFAULT NULL)
RETURNS TABLE (
  action TEXT,
  request_count INTEGER,
  window_start TIMESTAMPTZ,
  time_until_reset INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rl.action,
    rl.request_count,
    rl.window_start,
    EXTRACT(EPOCH FROM ((rl.window_start + interval '1 minute') - now()))::INTEGER as time_until_reset
  FROM rate_limits rl
  WHERE rl.user_id = auth.uid()
    AND (p_action IS NULL OR rl.action = p_action)
    AND rl.window_start > now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_rate_limit_status TO authenticated;

-- 8. COMMENTS
COMMENT ON TABLE rate_limits IS 'Stores rate limit counters for user actions';
COMMENT ON FUNCTION check_rate_limit IS 'Checks and enforces rate limits for user actions';
COMMENT ON FUNCTION cleanup_rate_limits IS 'Removes expired rate limit records (run hourly)';
COMMENT ON VIEW rate_limit_stats IS 'Aggregated rate limit statistics for monitoring';
COMMENT ON FUNCTION get_rate_limit_status IS 'Returns current rate limit status for authenticated user';
