-- Add Rich Media Support for WanaIQ Comments
-- Enables attachments of videos, images, and documents to comments

-- Create comment_media table
CREATE TABLE public.comment_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'audio')),
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_width INTEGER, -- For images/videos
  file_height INTEGER, -- For images/videos
  duration INTEGER, -- For videos/audio in seconds
  thumbnail_path TEXT, -- For videos/images
  caption TEXT,
  alt_text TEXT, -- For accessibility
  upload_source TEXT DEFAULT 'direct', -- 'direct', 'url', 'embed'
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  sort_order INTEGER DEFAULT 0,
  is_nsfw BOOLEAN DEFAULT false,
  content_moderation_score DECIMAL(3,2), -- AI moderation score
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for comment media
CREATE INDEX idx_comment_media_comment_id ON public.comment_media(comment_id);
CREATE INDEX idx_comment_media_file_type ON public.comment_media(file_type);
CREATE INDEX idx_comment_media_processing_status ON public.comment_media(processing_status);
CREATE INDEX idx_comment_media_created_at ON public.comment_media(created_at DESC);

-- Create comment_media_processing_log table for tracking processing
CREATE TABLE public.comment_media_processing_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES public.comment_media(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('upload', 'process', 'moderate', 'delete')),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for processing log
CREATE INDEX idx_comment_media_processing_log_media_id ON public.comment_media_processing_log(media_id);
CREATE INDEX idx_comment_media_processing_log_created_at ON public.comment_media_processing_log(created_at DESC);

-- Enable RLS for media tables
ALTER TABLE public.comment_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_media_processing_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_media
CREATE POLICY "Comment media is viewable by everyone"
ON public.comment_media FOR SELECT USING (true);

CREATE POLICY "Users can upload media to their comments"
ON public.comment_media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.comments
    WHERE comments.id = comment_media.comment_id
    AND comments.author_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own comment media"
ON public.comment_media FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.comments
    WHERE comments.id = comment_media.comment_id
    AND comments.author_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own comment media"
ON public.comment_media FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.comments
    WHERE comments.id = comment_media.comment_id
    AND comments.author_id = auth.uid()
  )
);

-- RLS Policies for processing log (system only)
CREATE POLICY "System can manage processing logs"
ON public.comment_media_processing_log FOR ALL
USING (auth.role() = 'service_role');

-- Update trigger for comment_media
CREATE TRIGGER update_comment_media_updated_at
BEFORE UPDATE ON public.comment_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update comment's media count
CREATE OR REPLACE FUNCTION update_comment_media_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the comment's media count
  UPDATE public.comments
  SET updated_at = now()
  WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update comment timestamp when media is added/changed
CREATE TRIGGER update_comment_on_media_change
AFTER INSERT OR UPDATE OR DELETE ON public.comment_media
FOR EACH ROW
EXECUTE FUNCTION update_comment_media_count();

-- Function to validate file types and sizes
CREATE OR REPLACE FUNCTION validate_comment_media()
RETURNS TRIGGER AS $$
DECLARE
  max_file_size INTEGER := 50 * 1024 * 1024; -- 50MB
  allowed_image_types TEXT[] := ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  allowed_video_types TEXT[] := ARRAY['video/mp4', 'video/webm', 'video/ogg'];
  allowed_document_types TEXT[] := ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  allowed_audio_types TEXT[] := ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg'];
BEGIN
  -- Check file size
  IF NEW.file_size > max_file_size THEN
    RAISE EXCEPTION 'File size exceeds maximum allowed size of 50MB';
  END IF;

  -- Validate mime type based on file_type
  CASE NEW.file_type
    WHEN 'image' THEN
      IF NEW.mime_type NOT IN (SELECT unnest(allowed_image_types)) THEN
        RAISE EXCEPTION 'Invalid image file type: %', NEW.mime_type;
      END IF;
    WHEN 'video' THEN
      IF NEW.mime_type NOT IN (SELECT unnest(allowed_video_types)) THEN
        RAISE EXCEPTION 'Invalid video file type: %', NEW.mime_type;
      END IF;
    WHEN 'document' THEN
      IF NEW.mime_type NOT IN (SELECT unnest(allowed_document_types)) THEN
        RAISE EXCEPTION 'Invalid document file type: %', NEW.mime_type;
      END IF;
    WHEN 'audio' THEN
      IF NEW.mime_type NOT IN (SELECT unnest(allowed_audio_types)) THEN
        RAISE EXCEPTION 'Invalid audio file type: %', NEW.mime_type;
      END IF;
    ELSE
      RAISE EXCEPTION 'Invalid file type: %', NEW.file_type;
  END CASE;

  -- Log the upload
  INSERT INTO public.comment_media_processing_log (media_id, action, status, message, metadata)
  VALUES (
    NEW.id,
    'upload',
    'started',
    'Media upload initiated',
    jsonb_build_object(
      'file_size', NEW.file_size,
      'mime_type', NEW.mime_type,
      'file_type', NEW.file_type
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for media validation
CREATE TRIGGER validate_comment_media_trigger
BEFORE INSERT ON public.comment_media
FOR EACH ROW
EXECUTE FUNCTION validate_comment_media();

-- Storage bucket policies for comment media (assuming bucket exists)
-- These would be created via SQL if using Supabase storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('comment-media', 'comment-media', true);

-- Storage policies for comment-media bucket
-- These would need to be created in the storage system
/*
CREATE POLICY "Comment media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'comment-media');

CREATE POLICY "Users can upload to comment-media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comment-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their comment media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'comment-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their comment media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'comment-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
*/
