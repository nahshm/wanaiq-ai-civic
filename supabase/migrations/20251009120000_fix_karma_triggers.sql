-- Migration: Fix karma triggers to update on votes without recursion
-- Date: 2025-10-09

-- Drop existing problematic triggers
DROP TRIGGER IF EXISTS update_user_karma_trigger ON public.posts;
DROP TRIGGER IF EXISTS update_user_karma_trigger ON public.comments;
DROP TRIGGER IF EXISTS update_user_karma_on_vote ON public.votes;

-- Create a single trigger function that updates karma on vote changes
CREATE OR REPLACE FUNCTION public.update_karma_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  -- Determine which user is affected based on the vote
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- For INSERT/UPDATE, get the author of the post or comment being voted on
    IF NEW.post_id IS NOT NULL THEN
      SELECT author_id INTO affected_user_id FROM public.posts WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      SELECT author_id INTO affected_user_id FROM public.comments WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- For DELETE, get the author of the post or comment that was voted on
    IF OLD.post_id IS NOT NULL THEN
      SELECT author_id INTO affected_user_id FROM public.posts WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      SELECT author_id INTO affected_user_id FROM public.comments WHERE id = OLD.comment_id;
    END IF;
  END IF;

  -- Update karma for the affected user if found
  IF affected_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET karma = calculate_user_karma(affected_user_id),
        last_activity = now()
    WHERE id = affected_user_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on votes table
CREATE TRIGGER update_karma_on_vote_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_karma_on_vote();

-- Also create triggers for new posts/comments to initialize karma
CREATE OR REPLACE FUNCTION public.initialize_user_karma()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET karma = calculate_user_karma(NEW.author_id),
      last_activity = now()
  WHERE id = NEW.author_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new posts
CREATE TRIGGER initialize_karma_on_post
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_karma();

-- Trigger for new comments
CREATE TRIGGER initialize_karma_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_karma();
