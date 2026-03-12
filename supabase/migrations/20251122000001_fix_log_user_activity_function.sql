-- Definitively replace log_user_activity function with the correct version
-- This ensures comments don't try to access the 'title' field which doesn't exist

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
            -- Use content for comments, NOT title (comments don't have title field)
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
