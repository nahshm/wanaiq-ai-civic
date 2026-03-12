-- Update karma calculation functions to use upvotes/downvotes counters
CREATE OR REPLACE FUNCTION public.calculate_post_karma(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  post_karma INTEGER := 0;
BEGIN
  -- Calculate karma from posts: floor((upvotes - downvotes) / 10)
  SELECT COALESCE(FLOOR((SUM(upvotes) - SUM(downvotes)) / 10.0), 0)::INTEGER INTO post_karma
  FROM public.posts
  WHERE author_id = user_uuid;

  RETURN post_karma;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.calculate_comment_karma(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  comment_karma INTEGER := 0;
BEGIN
  -- Calculate karma from comments: floor((upvotes - downvotes) / 10)
  SELECT COALESCE(FLOOR((SUM(upvotes) - SUM(downvotes)) / 10.0), 0)::INTEGER INTO comment_karma
  FROM public.comments
  WHERE author_id = user_uuid;

  RETURN comment_karma;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update all profiles with correct karma
UPDATE public.profiles
SET
  post_karma = calculate_post_karma(id),
  comment_karma = calculate_comment_karma(id),
  karma = calculate_post_karma(id) + calculate_comment_karma(id);
