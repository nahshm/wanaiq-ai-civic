
-- Fix storage RLS: restrict delete on media bucket to owner's folder only
-- First drop the overly permissive delete policy
DROP POLICY IF EXISTS "Users can delete media files" ON storage.objects;

-- Recreate with owner check (files must be in user's own folder)
CREATE POLICY "Users can delete their own media files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix upload policy to scope to user's folder
DROP POLICY IF EXISTS "Users can upload media files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;

CREATE POLICY "Users can upload to their own media folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix community-assets upload policy
DROP POLICY IF EXISTS "Authenticated users can upload community assets" ON storage.objects;

CREATE POLICY "Users can upload community assets to their folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'community-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
