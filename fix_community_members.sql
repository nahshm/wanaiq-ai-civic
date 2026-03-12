-- Fix 406 errors on community_members table
-- Add RLS policies

DROP POLICY IF EXISTS "Members are viewable" ON community_members;
DROP POLICY IF EXISTS "Users can join communities" ON community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON community_members;

CREATE POLICY "Members publicly viewable"
ON community_members FOR SELECT
USING (true);

CREATE POLICY "Users can join communities"
ON community_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave communities"
ON community_members FOR DELETE
TO authenticated
USING (user_id = auth.uid());
