-- Migration: Fix trigger recursion by using deferred constraint triggers
-- Date: 2025-10-07

-- Drop existing triggers that cause recursion
DROP TRIGGER IF EXISTS trigger_update_activity_stats ON public.profiles;
DROP TRIGGER IF EXISTS trigger_update_karma_on_post ON public.posts;
DROP TRIGGER IF EXISTS trigger_update_karma_on_comment ON public.comments;

-- Recreate triggers as deferred constraint triggers to avoid same-row update conflicts
CREATE CONSTRAINT TRIGGER trigger_update_activity_stats
  AFTER INSERT OR UPDATE ON public.profiles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.update_user_activity_stats();

CREATE CONSTRAINT TRIGGER trigger_update_karma_on_post
  AFTER INSERT ON public.posts
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.update_user_karma();

CREATE CONSTRAINT TRIGGER trigger_update_karma_on_comment
  AFTER INSERT ON public.comments
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.update_user_karma();
