-- Add Civic Integration Features for WanaIQ Comments
-- Enables linking to promises, projects, and government verification

-- Add civic integration fields to comments table
ALTER TABLE public.comments
ADD COLUMN referenced_promise_id UUID REFERENCES public.development_promises(id),
ADD COLUMN referenced_project_id UUID REFERENCES public.government_projects(id),
ADD COLUMN is_official_response BOOLEAN DEFAULT false,
ADD COLUMN official_verification_id UUID REFERENCES public.officials(id),
ADD COLUMN priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN civic_tags TEXT[], -- Array of civic-related tags
ADD COLUMN discussion_type TEXT CHECK (discussion_type IN ('general', 'policy', 'budget', 'service', 'accountability', 'transparency'));

-- Create indexes for civic queries
CREATE INDEX idx_comments_referenced_promise ON public.comments(referenced_promise_id);
CREATE INDEX idx_comments_referenced_project ON public.comments(referenced_project_id);
CREATE INDEX idx_comments_official_response ON public.comments(is_official_response);
CREATE INDEX idx_comments_priority_level ON public.comments(priority_level);
CREATE INDEX idx_comments_discussion_type ON public.comments(discussion_type);

-- Create comment_references table for tracking all types of references
CREATE TABLE public.comment_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('promise', 'project', 'official', 'policy', 'budget', 'law')),
  reference_id UUID NOT NULL, -- Can reference different tables
  reference_title TEXT, -- Cached title for display
  reference_url TEXT, -- URL to the referenced item
  context TEXT, -- How it's referenced in the comment
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for comment references
CREATE INDEX idx_comment_references_comment_id ON public.comment_references(comment_id);
CREATE INDEX idx_comment_references_type_id ON public.comment_references(reference_type, reference_id);

-- Create comment_notifications table for civic notifications
CREATE TABLE public.comment_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('promise_mentioned', 'project_mentioned', 'official_tagged', 'fact_check_complete', 'moderation_action')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT, -- URL to take action on notification
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for notifications
CREATE INDEX idx_comment_notifications_recipient ON public.comment_notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_comment_notifications_comment ON public.comment_notifications(comment_id);

-- Enable RLS for new tables
ALTER TABLE public.comment_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_references
CREATE POLICY "Comment references are viewable by everyone"
ON public.comment_references FOR SELECT USING (true);

CREATE POLICY "Users can create references for their comments"
ON public.comment_references FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.comments
    WHERE comments.id = comment_references.comment_id
    AND comments.author_id = auth.uid()
  )
);

-- RLS Policies for comment_notifications
CREATE POLICY "Users can view their own notifications"
ON public.comment_notifications FOR SELECT
USING (recipient_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.comment_notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.comment_notifications FOR UPDATE
USING (recipient_id = auth.uid());

-- Function to automatically create references when civic fields are set
CREATE OR REPLACE FUNCTION create_comment_references()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing references for this comment
  DELETE FROM public.comment_references WHERE comment_id = NEW.id;

  -- Create reference for promise if set
  IF NEW.referenced_promise_id IS NOT NULL THEN
    INSERT INTO public.comment_references (comment_id, reference_type, reference_id, reference_title, reference_url)
    SELECT
      NEW.id,
      'promise',
      NEW.referenced_promise_id,
      dp.title,
      '/promises/' || NEW.referenced_promise_id
    FROM public.development_promises dp
    WHERE dp.id = NEW.referenced_promise_id;
  END IF;

  -- Create reference for project if set
  IF NEW.referenced_project_id IS NOT NULL THEN
    INSERT INTO public.comment_references (comment_id, reference_type, reference_id, reference_title, reference_url)
    SELECT
      NEW.id,
      'project',
      NEW.referenced_project_id,
      gp.title,
      '/projects/' || NEW.referenced_project_id
    FROM public.government_projects gp
    WHERE gp.id = NEW.referenced_project_id;
  END IF;

  -- Create reference for official if official response
  IF NEW.is_official_response = true AND NEW.official_verification_id IS NOT NULL THEN
    INSERT INTO public.comment_references (comment_id, reference_type, reference_id, reference_title, reference_url)
    SELECT
      NEW.id,
      'official',
      NEW.official_verification_id,
      o.name || ' (' || o.position || ')',
      '/officials/' || NEW.official_verification_id
    FROM public.officials o
    WHERE o.id = NEW.official_verification_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic reference creation
CREATE TRIGGER create_comment_references_trigger
AFTER INSERT OR UPDATE ON public.comments
FOR EACH ROW
WHEN (NEW.referenced_promise_id IS NOT NULL OR NEW.referenced_project_id IS NOT NULL OR NEW.is_official_response = true)
EXECUTE FUNCTION create_comment_references();

-- Function to create notifications for civic references
CREATE OR REPLACE FUNCTION create_civic_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify promise officials when promise is referenced
  IF NEW.referenced_promise_id IS NOT NULL THEN
    INSERT INTO public.comment_notifications (comment_id, recipient_id, notification_type, title, message, action_url)
    SELECT
      NEW.id,
      dp.official_id,
      'promise_mentioned',
      'Your promise was mentioned in a comment',
      'A comment referenced your development promise: ' || substring(NEW.content, 1, 100) || '...',
      '/posts/' || NEW.post_id || '#comment-' || NEW.id
    FROM public.development_promises dp
    WHERE dp.id = NEW.referenced_promise_id
    AND dp.official_id != NEW.author_id; -- Don't notify if commenting on own promise
  END IF;

  -- Notify project leads when project is referenced
  IF NEW.referenced_project_id IS NOT NULL THEN
    INSERT INTO public.comment_notifications (comment_id, recipient_id, notification_type, title, message, action_url)
    SELECT
      NEW.id,
      gp.created_by,
      'project_mentioned',
      'Your project was mentioned in a comment',
      'A comment referenced your government project: ' || substring(NEW.content, 1, 100) || '...',
      '/projects/' || NEW.referenced_project_id
    FROM public.government_projects gp
    WHERE gp.id = NEW.referenced_project_id
    AND gp.created_by != NEW.author_id; -- Don't notify if commenting on own project
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for civic notifications
CREATE TRIGGER create_civic_notifications_trigger
AFTER INSERT ON public.comments
FOR EACH ROW
WHEN (NEW.referenced_promise_id IS NOT NULL OR NEW.referenced_project_id IS NOT NULL)
EXECUTE FUNCTION create_civic_notifications();
