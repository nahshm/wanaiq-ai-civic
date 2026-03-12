-- Fix log_user_activity function to handle posts and comments properly
-- Posts have title, comments have content

-- First, create the user_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    entity_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS on user_activities
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activities
CREATE POLICY "Users can view their own activities" ON public.user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON public.user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create or replace the function
CREATE OR REPLACE FUNCTION public.log_user_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_type TEXT;
    entity_type TEXT;
    entity_title TEXT;
BEGIN
    -- Determine activity type
    IF TG_OP = 'INSERT' THEN
        activity_type := 'created';
    ELSIF TG_OP = 'UPDATE' THEN
        activity_type := 'updated';
    ELSIF TG_OP = 'DELETE' THEN
        activity_type := 'deleted';
    END IF;

    -- Determine entity type and title/content
    IF TG_TABLE_NAME = 'posts' THEN
        entity_type := 'post';
        IF TG_OP = 'DELETE' THEN
            entity_title := 'Post deleted';
        ELSE
            entity_title := COALESCE(NEW.title, 'Untitled Post');
        END IF;
    ELSIF TG_TABLE_NAME = 'comments' THEN
        entity_type := 'comment';
        IF TG_OP = 'DELETE' THEN
            entity_title := 'Comment deleted';
        ELSE
            entity_title := LEFT(COALESCE(NEW.content, ''), 100) || CASE WHEN LENGTH(COALESCE(NEW.content, '')) > 100 THEN '...' ELSE '' END;
        END IF;
    ELSE
        entity_type := TG_TABLE_NAME;
        entity_title := 'Unknown entity';
    END IF;

    -- Insert activity log
    INSERT INTO public.user_activities (
        user_id,
        activity_type,
        entity_type,
        entity_id,
        entity_title,
        created_at
    ) VALUES (
        COALESCE(NEW.author_id, OLD.author_id),
        activity_type,
        entity_type,
        COALESCE(NEW.id, OLD.id),
        entity_title,
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the triggers are properly set up
DROP TRIGGER IF EXISTS log_post_activity ON public.posts;
DROP TRIGGER IF EXISTS log_comment_activity ON public.comments;

CREATE TRIGGER log_post_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER log_comment_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();
