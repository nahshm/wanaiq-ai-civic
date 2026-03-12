-- MANUAL FIX FOR MIGRATION ERROR
-- Run this in Supabase SQL Editor if you already ran the first version

-- 1. Drop the problematic index (if it exists)
DROP INDEX IF EXISTS idx_rate_limits_window;

-- 2. Recreate it without the WHERE clause
CREATE INDEX idx_rate_limits_window 
  ON rate_limits(window_start DESC);

-- 3. Verify all functions have correct security settings
ALTER FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) 
  SET search_path = public, pg_temp;

-- 4. Test the rate limiting
SELECT check_rate_limit('test_action', 5, 1);

-- 5. View your rate limit status  
SELECT * FROM get_rate_limit_status();

-- That's it! The migration should work now.
