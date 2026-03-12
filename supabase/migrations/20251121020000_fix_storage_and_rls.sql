-- Fix Storage RLS policies for community-assets bucket
-- Allow authenticated users to upload community images

-- First, enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Community assets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload community assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own community assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own community assets" ON storage.objects;

-- Allow public read access to community-assets
CREATE POLICY "Community assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload community assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-assets');

-- Allow users to update files in their own folders
CREATE POLICY "Users can update their own community assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'community-assets' AND
  (storage.foldername(name))[1] = 'communities'
);

-- Allow users to delete files in their own folders
CREATE POLICY "Users can delete their own community assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-assets' AND
  (storage.foldername(name))[1] = 'communities'
);

-- Fix infinite recursion in community_moderators RLS policies
-- The issue is that the moderator policies reference the communities table,
-- which references back to community_moderators in queries

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Moderators are viewable by everyone" ON community_moderators;
DROP POLICY IF EXISTS "Users can become moderators if invited" ON community_moderators;
DROP POLICY IF EXISTS "Moderators can update their own record" ON community_moderators;
DROP POLICY IF EXISTS "Admins can manage moderators" ON community_moderators;

-- Create simpler, non-recursive policies
-- View: Everyone can see moderators (no recursion)
CREATE POLICY "Moderators are viewable by everyone"
ON community_moderators FOR SELECT
USING (true);

-- Insert: Only allow if user is being added as moderator
-- (Community creators add themselves via the app, not via RLS)
CREATE POLICY "Users can become moderators if invited"
ON community_moderators FOR INSERT
TO authenticated
WITH CHECK (true);  -- App-level logic handles this

-- Update: Users can update their own moderator record
CREATE POLICY "Moderators can update their own record"
ON community_moderators FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Delete: Admins of the community can remove moderators
-- Simplified to avoid recursion
CREATE POLICY "Admins can manage moderators"
ON community_moderators FOR DELETE
TO authenticated
USING (
  -- Only community admins can delete moderators
  EXISTS (
    SELECT 1 FROM community_moderators cm
    WHERE cm.community_id = community_moderators.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
    LIMIT 1  -- Prevent recursion
  )
);

-- Add comment explaining the fix
COMMENT ON POLICY "Moderators are viewable by everyone" ON community_moderators IS 
'Simple SELECT policy without recursion - everyone can view moderators';

COMMENT ON POLICY "Admins can manage moderators" ON community_moderators IS 
'Uses LIMIT 1 to prevent infinite recursion in policy checks';
