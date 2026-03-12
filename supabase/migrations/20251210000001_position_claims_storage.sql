-- Create storage bucket for position claim documents
-- Run this in Supabase SQL Editor or create bucket via Dashboard

-- Note: Storage bucket creation is typically done via Dashboard
-- This file documents the required bucket configuration

/*
BUCKET: position-claims

Configuration:
- Public: Yes (for admin verification viewing)
- File size limit: 5MB
- Allowed MIME types: application/pdf, image/jpeg, image/png, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

RLS Policies:
1. INSERT: Authenticated users can upload their own files
2. SELECT: Admin users can view all files
3. DELETE: Users can delete their own files
*/

-- Enable RLS on storage.objects (already enabled by default)

-- Policy: Users can upload proof documents
CREATE POLICY "Users can upload position claim documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'position-claims' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own position claim documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'position-claims' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Platform admins can view all documents
CREATE POLICY "Admins can view all position claim documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'position-claims' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_platform_admin = true
    )
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own position claim documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'position-claims' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
