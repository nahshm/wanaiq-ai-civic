-- Fix trigger_log_comment_activity to use correct function
-- The old log_user_activity function tries to access NEW.title on comments which doesn't exist
-- This migration ensures the newer, correct log_user_activity function is used

-- Drop all possible trigger name variations (old and new)
DROP TRIGGER IF EXISTS trigger_log_post_activity ON public.posts;
DROP TRIGGER IF EXISTS trigger_log_comment_activity ON public.comments;
DROP TRIGGER IF EXISTS log_post_activity ON public.posts;
DROP TRIGGER IF EXISTS log_comment_activity ON public.comments;

-- The correct log_user_activity function should already exist from 20250915000000_fix_log_user_activity_trigger.sql
-- Recreate the triggers to ensure they use the correct function

CREATE TRIGGER log_post_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER log_comment_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();
