-- Temporarily disable RLS on chat_rooms to test
-- WARNING: This is for debugging only, we'll re-enable it after

-- First, let's see what policies exist
-- Run this query to check: SELECT * FROM pg_policies WHERE tablename = 'chat_rooms';

-- Disable RLS temporarily
ALTER TABLE chat_rooms DISABLE ROW LEVEL SECURITY;

-- Note: After testing, we'll re-enable with:
-- ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
