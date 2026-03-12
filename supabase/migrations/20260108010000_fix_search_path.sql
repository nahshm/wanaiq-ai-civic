-- ==========================================
-- FIX: Add search_path to all SECURITY DEFINER functions
-- ==========================================
-- Run this to fix the linter warnings about mutable search_path

-- 1. Fix create_post_ratelimited
ALTER FUNCTION create_post_ratelimited(TEXT, TEXT, UUID, TEXT[]) 
  SET search_path = public, pg_temp;

-- 2. Fix create_comment_ratelimited
ALTER FUNCTION create_comment_ratelimited(TEXT, UUID, UUID) 
  SET search_path = public, pg_temp;

-- 3. Fix vote_ratelimited
ALTER FUNCTION vote_ratelimited(TEXT, UUID, TEXT) 
  SET search_path = public, pg_temp;

-- 4. Fix update_profile_ratelimited
ALTER FUNCTION update_profile_ratelimited(TEXT, TEXT, TEXT, TEXT) 
  SET search_path = public, pg_temp;

-- 5. Fix create_community_ratelimited
ALTER FUNCTION create_community_ratelimited(TEXT, TEXT, TEXT, TEXT) 
  SET search_path = public, pg_temp;

-- 6. Fix get_rate_limit_status
ALTER FUNCTION get_rate_limit_status(TEXT) 
  SET search_path = public, pg_temp;

-- 7. Fix cleanup_rate_limits (should also be protected)
ALTER FUNCTION cleanup_rate_limits() 
  SET search_path = public, pg_temp;

-- Verify all functions now have search_path set
SELECT 
  proname as function_name,
  proconfig as config
FROM pg_proc
WHERE proname LIKE '%ratelimit%' OR proname = 'cleanup_rate_limits'
  OR proname = 'get_rate_limit_status'
ORDER BY proname;

COMMENT ON SCHEMA public IS 'All SECURITY DEFINER functions now protected with search_path';
