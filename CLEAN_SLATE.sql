-- DROP EVERY SINGLE POLICY ON COMMUNITY_MODERATORS
-- This removes all old recursive policies

DROP POLICY IF EXISTS "Community admins can manage moderators" ON community_moderators;
DROP POLICY IF EXISTS "Moderators publicly viewable" ON community_moderators;
DROP POLICY IF EXISTS "Auth users can add moderators" ON community_moderators;
DROP POLICY IF EXISTS "Users update own mod record" ON community_moderators;
DROP POLICY IF EXISTS "Community moderators are viewable by community members" ON community_moderators;
DROP POLICY IF EXISTS "Users delete own mod record" ON community_moderators;
DROP POLICY IF EXISTS "Moderators are viewable by everyone" ON community_moderators;
DROP POLICY IF EXISTS "Users can become moderators if invited" ON community_moderators;
DROP POLICY IF EXISTS "Moderators can update their own record" ON community_moderators;
DROP POLICY IF EXISTS "Admins can manage moderators" ON community_moderators;
DROP POLICY IF EXISTS "Public read access to moderators" ON community_moderators;
DROP POLICY IF EXISTS "Authenticated can insert moderators" ON community_moderators;
DROP POLICY IF EXISTS "Users can update own moderator record" ON community_moderators;
DROP POLICY IF EXISTS "Users can delete own moderator record" ON community_moderators;

-- Now create ONLY simple, non-recursive policies
CREATE POLICY "allow_select_moderators"
ON community_moderators FOR SELECT
USING (true);

CREATE POLICY "allow_insert_moderators"
ON community_moderators FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_update_own_moderator"
ON community_moderators FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "allow_delete_own_moderator"
ON community_moderators FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Verify all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'community_moderators';
