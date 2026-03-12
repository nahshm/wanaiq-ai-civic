-- Migration: Add banner support to user profiles
-- Date: 2025-11-26
-- Description: Adds banner_url column to profiles table and creates user-profiles storage bucket

-- Add banner_url column to profiles table if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Comment on the new column
COMMENT ON COLUMN public.profiles.banner_url IS 'User profile banner image URL (recommended 1920x384px)';

-- Create user-profiles storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-profiles', 'user-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (should already be enabled, but just in case)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "User profile images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

-- Allow public read access to user-profiles bucket
CREATE POLICY "User profile images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profiles');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update files in their own folder
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete files in their own folder
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add comment explaining the policies
COMMENT ON POLICY "User profile images are publicly accessible" ON storage.objects IS 
'Public read access for all user profile images';

COMMENT ON POLICY "Authenticated users can upload their own profile images" ON storage.objects IS 
'Users can only upload images to their own user ID folder';
