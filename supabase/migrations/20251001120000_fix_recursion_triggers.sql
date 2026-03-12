-- Migration: Fix recursion in triggers for karma and activity stats
-- Date: 2025-10-01

-- Function to update user karma with recursion prevention
CREATE OR REPLACE FUNCTION public.update_user_karma()
RETURNS TRIGGER AS $$  
BEGIN  
  -- Prevent recursion using session variable
  IF current_setting('app.updating_karma', true) = 'true' THEN
    RETURN NEW;
  END IF;

  PERFORM set_config('app.updating_karma', 'true', false);

  UPDATE public.profiles  
  SET karma = public.calculate_user_karma(NEW.author_id),  
      last_activity = now()  
  WHERE id = NEW.author_id;  
  
  PERFORM set_config('app.updating_karma', 'false', false);

  RETURN NEW;  
END;  
$$ LANGUAGE plpgsql SECURITY DEFINER;  

-- Function to update activity stats with recursion prevention
CREATE OR REPLACE FUNCTION public.update_user_activity_stats()
RETURNS TRIGGER AS $$
DECLARE
  post_count INTEGER := 0;
  comment_count INTEGER := 0;
  upvote_count INTEGER := 0;
BEGIN
  -- Prevent recursion using session variable
  IF current_setting('app.updating_activity_stats', true) = 'true' THEN
    RETURN NEW;
  END IF;

  PERFORM set_config('app.updating_activity_stats', 'true', false);

  -- Get counts
  SELECT COUNT(*) INTO post_count FROM public.posts WHERE author_id = NEW.id;
  SELECT COUNT(*) INTO comment_count FROM public.comments WHERE author_id = NEW.id;
  SELECT COUNT(*) INTO upvote_count FROM public.votes WHERE user_id = NEW.id AND vote_type = 'up';

  -- Update activity stats
  UPDATE public.profiles
  SET activity_stats = jsonb_build_object(
    'post_count', post_count,
    'comment_count', comment_count,
    'upvote_count', upvote_count,
    'join_date', (SELECT created_at FROM public.profiles WHERE id = NEW.id)
  )
  WHERE id = NEW.id;

  PERFORM set_config('app.updating_activity_stats', 'false', false);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers to use the updated functions (dropping and recreating to ensure clean state)
DROP TRIGGER IF EXISTS trigger_update_karma_on_post ON public.posts;
DROP TRIGGER IF EXISTS trigger_update_karma_on_comment ON public.comments;
DROP TRIGGER IF EXISTS trigger_update_activity_stats ON public.profiles;

DROP TRIGGER IF EXISTS trigger_update_karma_on_post ON public.posts;
DROP TRIGGER IF EXISTS trigger_update_karma_on_comment ON public.comments;

CREATE TRIGGER trigger_update_karma_on_post
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_user_karma();

CREATE TRIGGER trigger_update_karma_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_user_karma();

CREATE TRIGGER trigger_update_activity_stats
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_activity_stats();
