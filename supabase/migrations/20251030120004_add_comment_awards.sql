-- Add Comment Awards System for WanaIQ Civic Discourse
-- Enables users to award comments for positive contributions

-- Create comment_awards table
CREATE TABLE public.comment_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon identifier (e.g., 'thumbs-up', 'star')
  color TEXT NOT NULL DEFAULT '#6B7280',
  background_color TEXT NOT NULL DEFAULT '#F3F4F6',
  points INTEGER NOT NULL DEFAULT 1, -- Karma points awarded
  category TEXT NOT NULL CHECK (category IN ('civic', 'helpful', 'insightful', 'creative')),
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comment_award_assignments table for many-to-many relationship
CREATE TABLE public.comment_award_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  award_id UUID NOT NULL REFERENCES public.comment_awards(id) ON DELETE CASCADE,
  awarded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, award_id, awarded_by) -- Prevent duplicate awards from same user
);

-- Create indexes for performance
CREATE INDEX idx_comment_award_assignments_comment_id ON public.comment_award_assignments(comment_id);
CREATE INDEX idx_comment_award_assignments_award_id ON public.comment_award_assignments(award_id);
CREATE INDEX idx_comment_award_assignments_awarded_by ON public.comment_award_assignments(awarded_by);

-- Insert predefined civic awards
INSERT INTO public.comment_awards (name, display_name, description, icon, color, background_color, points, category, sort_order) VALUES
('helpful', 'Helpful', 'Provided helpful information or guidance', 'thumbs-up', '#059669', '#ECFDF5', 2, 'helpful', 1),
('insightful', 'Insightful', 'Offered deep insight or analysis', 'lightbulb', '#3B82F6', '#EFF6FF', 3, 'insightful', 2),
('well-researched', 'Well-Researched', 'Backed by thorough research or data', 'search', '#8B5CF6', '#F3E8FF', 4, 'civic', 3),
('constructive', 'Constructive', 'Contributed constructively to the discussion', 'wrench', '#10B981', '#ECFDF5', 2, 'civic', 4),
('creative', 'Creative', 'Offered creative solution or idea', 'palette', '#F59E0B', '#FFFBEB', 3, 'creative', 5),
('fact-check', 'Fact-Check', 'Verified or corrected factual information', 'check-circle', '#DC2626', '#FEF2F2', 5, 'civic', 6);

-- Enable RLS
ALTER TABLE public.comment_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_award_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_awards
CREATE POLICY "Comment awards are viewable by everyone"
ON public.comment_awards FOR SELECT USING (true);

CREATE POLICY "Moderators can manage comment awards"
ON public.comment_awards FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- RLS Policies for comment_award_assignments
CREATE POLICY "Award assignments are viewable by everyone"
ON public.comment_award_assignments FOR SELECT USING (true);

CREATE POLICY "Users can award comments"
ON public.comment_award_assignments FOR INSERT
WITH CHECK (
  auth.uid() = awarded_by
  AND EXISTS (
    SELECT 1 FROM public.comments
    WHERE comments.id = comment_id
    AND comments.author_id != auth.uid() -- Can't award own comments
  )
);

CREATE POLICY "Users can remove their own awards"
ON public.comment_award_assignments FOR DELETE
USING (auth.uid() = awarded_by);

-- Update triggers
CREATE TRIGGER update_comment_awards_updated_at
BEFORE UPDATE ON public.comment_awards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update comment karma when awards are assigned/removed
CREATE OR REPLACE FUNCTION update_comment_karma_from_awards()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments
    SET karma = karma + (SELECT points FROM public.comment_awards WHERE id = NEW.award_id)
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments
    SET karma = karma - (SELECT points FROM public.comment_awards WHERE id = OLD.award_id)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update karma on award assignment
CREATE TRIGGER trigger_update_comment_karma_from_awards
AFTER INSERT OR DELETE ON public.comment_award_assignments
FOR EACH ROW
EXECUTE FUNCTION update_comment_karma_from_awards();
