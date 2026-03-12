-- Fix infinite recursion in community_moderators RLS policy
-- The current policy references community_moderators in its own SELECT check, causing infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "moderators_restricted_view" ON community_moderators;

-- Create a simple public read policy for moderators
-- Moderators are public information - users need to know who moderates a community
CREATE POLICY "community_moderators_public_read"
ON community_moderators
FOR SELECT
USING (true);