-- Make storage buckets public for civic transparency
-- RLS policies still control upload/delete access
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('media', 'comment-media');

-- Verify RLS policies exist for storage.objects
-- Users can only upload to their own user_id folders
-- Users can only delete their own files
-- Anyone can view public files (for civic transparency)

-- Add policy to allow public viewing of media files
DROP POLICY IF EXISTS "Public media files are viewable by everyone" ON storage.objects;
CREATE POLICY "Public media files are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id IN ('media', 'comment-media'));

-- Ensure users can only upload to their own folders
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('media', 'comment-media') 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Ensure users can only update their own files
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('media', 'comment-media') 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Ensure users can only delete their own files
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('media', 'comment-media') 
  AND (storage.foldername(name))[1] = auth.uid()::text
);