-- Add post_media table for storing media files associated with posts
CREATE TABLE public.post_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_media
CREATE POLICY "Post media is viewable by everyone"
ON public.post_media FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload media to their posts"
ON public.post_media FOR INSERT
WITH CHECK (auth.uid() = (SELECT author_id FROM public.posts WHERE id = post_id));

-- Create indexes for better performance
CREATE INDEX idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX idx_post_media_uploaded_at ON public.post_media(uploaded_at);

-- Create trigger for automatic timestamp updates (if needed)
-- Note: uploaded_at is set to now() by default, so no trigger needed
