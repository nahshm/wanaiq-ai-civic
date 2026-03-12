-- Add Comment Flairs System for WanaIQ Civic Discourse
-- Enables users to categorize comments for better civic organization

-- Create comment_flairs table
CREATE TABLE public.comment_flairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6B7280', -- Default gray color
  background_color TEXT NOT NULL DEFAULT '#F3F4F6',
  icon TEXT, -- Optional icon identifier
  category TEXT NOT NULL CHECK (category IN ('civic', 'discussion', 'moderation', 'fact-check')),
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add flair_id to comments table
ALTER TABLE public.comments
ADD COLUMN flair_id UUID REFERENCES public.comment_flairs(id);

-- Create index for performance
CREATE INDEX idx_comments_flair_id ON public.comments(flair_id);

-- Insert predefined civic flairs
INSERT INTO public.comment_flairs (name, display_name, description, color, background_color, category, sort_order) VALUES
('fact-check', 'Fact-Check', 'Providing factual information or corrections', '#059669', '#ECFDF5', 'fact-check', 1),
('question', 'Question', 'Asking for clarification or information', '#3B82F6', '#EFF6FF', 'discussion', 2),
('support', 'Support', 'Expressing support for the post or idea', '#10B981', '#ECFDF5', 'civic', 3),
('critique', 'Critique', 'Constructive criticism or analysis', '#F59E0B', '#FFFBEB', 'discussion', 4),
('evidence', 'Evidence', 'Providing evidence or data', '#8B5CF6', '#F3E8FF', 'fact-check', 5),
('clarification', 'Clarification', 'Clarifying a previous statement', '#06B6D4', '#ECFEFF', 'discussion', 6),
('official-response', 'Official Response', 'Response from government official', '#DC2626', '#FEF2F2', 'civic', 7),
('community-verified', 'Community Verified', 'Verified by community fact-checkers', '#059669', '#ECFDF5', 'fact-check', 8);

-- Enable RLS
ALTER TABLE public.comment_flairs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_flairs
CREATE POLICY "Comment flairs are viewable by everyone"
ON public.comment_flairs FOR SELECT USING (true);

-- Only moderators can manage flairs (insert/update)
CREATE POLICY "Moderators can manage comment flairs"
ON public.comment_flairs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- Update trigger for comment_flairs
CREATE TRIGGER update_comment_flairs_updated_at
BEFORE UPDATE ON public.comment_flairs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
