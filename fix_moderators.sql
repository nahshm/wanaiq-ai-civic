-- Part 1: Fix community_moderators policies (CAN be applied via SQL)
-- This fixes the infinite recursion error

DROP POLICY IF EXISTS "Moderators are viewable by everyone" ON community_moderators;
DROP POLICY IF EXISTS "Users can become moderators if invited" ON community_moderators;
DROP POLICY IF EXISTS "Moderators can update their own record" ON community_moderators;
DROP POLICY IF EXISTS "Admins can manage moderators" ON community_moderators;

CREATE POLICY "Moderators are viewable by everyone"
ON community_moderators FOR SELECT
USING (true);

CREATE POLICY "Users can become moderators if invited"
ON community_moderators FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Moderators can update their own record"
ON community_moderators FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage moderators"
ON community_moderators FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM community_moderators cm
    WHERE cm.community_id = community_moderators.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
    LIMIT 1
  )
);
