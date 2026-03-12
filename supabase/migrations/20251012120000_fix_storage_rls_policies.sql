-- Migration: Fix Storage RLS policies for media bucket uploads
-- Date: 2025-10-12

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Allow authenticated users to upload files to the media bucket
-- The file path structure is: {post_id}/evidence_{index}.{ext}
-- We allow uploads to any path under the media bucket for authenticated users
CREATE POLICY "Users can upload media files" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
);

-- Allow authenticated users to view/download files from the media bucket
CREATE POLICY "Users can view media files" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media'
);

-- Allow authenticated users to update files in the media bucket
CREATE POLICY "Users can update media files" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
)
WITH CHECK (
  bucket_id = 'media'
);

-- Allow authenticated users to delete files in the media bucket
CREATE POLICY "Users can delete media files" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
);
