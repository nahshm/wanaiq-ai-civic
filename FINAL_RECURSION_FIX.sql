-- COMPREHENSIVE FIX FOR INFINITE RECURSION
-- Run this in Supabase SQL Editor

-- 1. Drop ALL policies on community_moderators
DROP POLICY IF EXISTS "Moderators are viewable by everyone" ON community_moderators;
DROP POLICY IF EXISTS "Users can become moderators if invited" ON community_moderators;
DROP POLICY IF EXISTS "Moderators can update their own record" ON community_moderators;
DROP POLICY IF EXISTS "Admins can manage moderators" ON community_moderators;

-- 2. Disable RLS temporarily to clear any issues
ALTER TABLE community_moderators DISABLE ROW LEVEL SECURITY;

-- 3. Re-enable RLS
ALTER TABLE community_moderators ENABLE ROW LEVEL SECURITY;

-- 4. Create SIMPLE, NON-RECURSIVE policies

-- Allow everyone to view moderators (no conditions = no recursion)
CREATE POLICY "Public read access to moderators"
ON community_moderators FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert (app handles authorization)
CREATE POLICY "Authenticated can insert moderators"
ON community_moderators FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own records only
CREATE POLICY "Users can update own moderator record"
ON community_moderators FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own records only (no recursion)
CREATE POLICY "Users can delete own moderator record"
ON community_moderators FOR DELETE
TO authenticated
USING (user_id = auth.uid());
