-- Migration: Add triggers to update vote counts on posts and comments
-- Date: 2025-10-04

-- Function to update post vote counts
CREATE OR REPLACE FUNCTION public.update_post_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
  post_id UUID;
BEGIN
  -- Determine the post_id based on the operation
  IF TG_OP = 'DELETE' THEN
    post_id := OLD.post_id;
  ELSE
    post_id := NEW.post_id;
  END IF;

  -- Only update if it's a post vote (not comment vote)
  IF post_id IS NOT NULL THEN
    -- Recalculate upvotes and downvotes for the post
    UPDATE public.posts
    SET
      upvotes = COALESCE((
        SELECT COUNT(*)
        FROM public.votes
        WHERE post_id = posts.id AND vote_type = 'up'
      ), 0),
      downvotes = COALESCE((
        SELECT COUNT(*)
        FROM public.votes
        WHERE post_id = posts.id AND vote_type = 'down'
      ), 0)
    WHERE id = post_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update comment vote counts
CREATE OR REPLACE FUNCTION public.update_comment_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
  comment_id UUID;
BEGIN
  -- Determine the comment_id based on the operation
  IF TG_OP = 'DELETE' THEN
    comment_id := OLD.comment_id;
  ELSE
    comment_id := NEW.comment_id;
  END IF;

  -- Only update if it's a comment vote (not post vote)
  IF comment_id IS NOT NULL THEN
    -- Recalculate upvotes and downvotes for the comment
    UPDATE public.comments
    SET
      upvotes = COALESCE((
        SELECT COUNT(*)
        FROM public.votes
        WHERE comment_id = comments.id AND vote_type = 'up'
      ), 0),
      downvotes = COALESCE((
        SELECT COUNT(*)
        FROM public.votes
        WHERE comment_id = comments.id AND vote_type = 'down'
      ), 0)
    WHERE id = comment_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on votes table
CREATE TRIGGER trigger_update_post_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_vote_counts();

CREATE TRIGGER trigger_update_comment_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_vote_counts();

-- Update existing posts and comments with correct vote counts
UPDATE public.posts
SET
  upvotes = COALESCE((
    SELECT COUNT(*)
    FROM public.votes
    WHERE post_id = posts.id AND vote_type = 'up'
  ), 0),
  downvotes = COALESCE((
    SELECT COUNT(*)
    FROM public.votes
    WHERE post_id = posts.id AND vote_type = 'down'
  ), 0);

UPDATE public.comments
SET
  upvotes = COALESCE((
    SELECT COUNT(*)
    FROM public.votes
    WHERE comment_id = comments.id AND vote_type = 'up'
  ), 0),
  downvotes = COALESCE((
    SELECT COUNT(*)
    FROM public.votes
    WHERE comment_id = comments.id AND vote_type = 'down'
  ), 0);
