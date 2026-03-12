-- Add Comment Moderation & Safety Features for WanaIQ
-- Enables community moderation, toxicity detection, and fact-checking

-- Add moderation fields to comments table
ALTER TABLE public.comments
ADD COLUMN moderator_id UUID REFERENCES public.profiles(id),
ADD COLUMN moderation_reason TEXT,
ADD COLUMN moderation_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN toxicity_score DECIMAL(3,2) CHECK (toxicity_score >= 0 AND toxicity_score <= 1),
ADD COLUMN content_warnings TEXT[], -- Array of warning types
ADD COLUMN fact_check_status TEXT DEFAULT 'unverified' CHECK (fact_check_status IN ('unverified', 'pending', 'verified', 'disputed', 'rejected')),
ADD COLUMN fact_checker_id UUID REFERENCES public.profiles(id),
ADD COLUMN fact_check_notes TEXT,
ADD COLUMN fact_check_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_hidden BOOLEAN DEFAULT false,
ADD COLUMN hidden_reason TEXT,
ADD COLUMN appeal_status TEXT DEFAULT 'none' CHECK (appeal_status IN ('none', 'pending', 'approved', 'denied'));

-- Create indexes for moderation queries
CREATE INDEX idx_comments_moderation_status ON public.comments(moderation_status);
CREATE INDEX idx_comments_fact_check_status ON public.comments(fact_check_status);
CREATE INDEX idx_comments_toxicity_score ON public.comments(toxicity_score);
CREATE INDEX idx_comments_moderator_id ON public.comments(moderator_id);
CREATE INDEX idx_comments_fact_checker_id ON public.comments(fact_checker_id);

-- Create comment_moderation_log table for audit trail
CREATE TABLE public.comment_moderation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL CHECK (action IN ('approve', 'remove', 'hide', 'unhide', 'fact_check', 'mark_toxic')),
  reason TEXT,
  previous_status TEXT,
  new_status TEXT,
  toxicity_score DECIMAL(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for moderation log
CREATE INDEX idx_comment_moderation_log_comment_id ON public.comment_moderation_log(comment_id);
CREATE INDEX idx_comment_moderation_log_moderator_id ON public.comment_moderation_log(moderator_id);
CREATE INDEX idx_comment_moderation_log_created_at ON public.comment_moderation_log(created_at DESC);

-- Enable RLS for moderation log
ALTER TABLE public.comment_moderation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_moderation_log
CREATE POLICY "Moderators can view moderation logs"
ON public.comment_moderation_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

CREATE POLICY "System can insert moderation logs"
ON public.comment_moderation_log FOR INSERT
WITH CHECK (true);

-- Create function to log moderation actions
CREATE OR REPLACE FUNCTION log_comment_moderation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if moderation fields changed
  IF (OLD.moderation_status IS DISTINCT FROM NEW.moderation_status) OR
     (OLD.fact_check_status IS DISTINCT FROM NEW.fact_check_status) OR
     (OLD.is_hidden IS DISTINCT FROM NEW.is_hidden) THEN

    INSERT INTO public.comment_moderation_log (
      comment_id,
      moderator_id,
      action,
      reason,
      previous_status,
      new_status,
      toxicity_score,
      metadata
    ) VALUES (
      NEW.id,
      NEW.moderator_id,
      CASE
        WHEN NEW.moderation_status = 'removed' THEN 'remove'
        WHEN NEW.moderation_status = 'approved' THEN 'approve'
        WHEN NEW.is_hidden = true THEN 'hide'
        WHEN NEW.is_hidden = false AND OLD.is_hidden = true THEN 'unhide'
        WHEN NEW.fact_check_status IN ('verified', 'disputed', 'rejected') THEN 'fact_check'
        ELSE 'moderate'
      END,
      COALESCE(NEW.moderation_reason, NEW.hidden_reason),
      CASE
        WHEN OLD.moderation_status IS NOT NULL THEN OLD.moderation_status
        WHEN OLD.is_hidden IS NOT NULL THEN CASE WHEN OLD.is_hidden THEN 'hidden' ELSE 'visible' END
        ELSE 'unverified'
      END,
      CASE
        WHEN NEW.moderation_status IS NOT NULL THEN NEW.moderation_status
        WHEN NEW.is_hidden IS NOT NULL THEN CASE WHEN NEW.is_hidden THEN 'hidden' ELSE 'visible' END
        ELSE NEW.fact_check_status
      END,
      NEW.toxicity_score,
      jsonb_build_object(
        'fact_check_notes', NEW.fact_check_notes,
        'content_warnings', NEW.content_warnings
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for moderation logging
CREATE TRIGGER log_comment_moderation_trigger
AFTER UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION log_comment_moderation();
