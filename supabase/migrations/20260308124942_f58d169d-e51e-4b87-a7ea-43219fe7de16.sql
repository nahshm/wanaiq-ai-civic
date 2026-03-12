-- Add media columns to chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Create chat-media storage bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('chat-media', 'chat-media', true, ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'], 10485760)
ON CONFLICT (id) DO NOTHING;

-- RLS for chat-media bucket: authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can view chat media (public bucket)
CREATE POLICY "Anyone can view chat media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-media');

-- Users can delete their own uploads
CREATE POLICY "Users can delete own chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);