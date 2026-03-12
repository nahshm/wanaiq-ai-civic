-- Migration: Fix RLS policies and clean up conflicting triggers
-- Date: 2025-10-11

-- Step 1: Fix RLS policies for posts table to allow authenticated users to create posts
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

-- Allow everyone to view posts
CREATE POLICY "Users can view all posts" ON public.posts
  FOR SELECT USING (true);

-- Allow authenticated users to insert posts
CREATE POLICY "Users can insert posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id AND auth.role() = 'authenticated');

-- Allow users to update their own posts
CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id AND auth.role() = 'authenticated');

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id AND auth.role() = 'authenticated');

-- Step 2: Fix RLS policies for comments table
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- Allow everyone to view comments
CREATE POLICY "Users can view all comments" ON public.comments
  FOR SELECT USING (true);

-- Allow authenticated users to insert comments
CREATE POLICY "Users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id AND auth.role() = 'authenticated');

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = author_id AND auth.role() = 'authenticated');

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = author_id AND auth.role() = 'authenticated');

-- Step 3: Fix RLS policies for votes table to allow authenticated users to vote
DROP POLICY IF EXISTS "Users can view all votes" ON public.votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;

-- Allow authenticated users to view all votes
CREATE POLICY "Users can view all votes" ON public.votes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert votes
CREATE POLICY "Users can insert votes" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Allow users to update their own votes
CREATE POLICY "Users can update their own votes" ON public.votes
  FOR UPDATE USING (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Allow users to delete their own votes
CREATE POLICY "Users can delete their own votes" ON public.votes
  FOR DELETE USING (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Step 2: Clean up all conflicting triggers
DROP TRIGGER IF EXISTS trigger_update_karma_on_post ON public.posts;
DROP TRIGGER IF EXISTS trigger_update_karma_on_comment ON public.comments;
DROP TRIGGER IF EXISTS trigger_update_activity_stats ON public.profiles;
DROP TRIGGER IF EXISTS trigger_update_post_vote_counts ON public.votes;
DROP TRIGGER IF EXISTS trigger_update_comment_vote_counts ON public.votes;
DROP TRIGGER IF EXISTS update_karma_on_vote_trigger ON public.votes;
DROP TRIGGER IF EXISTS initialize_karma_on_post ON public.posts;
DROP TRIGGER IF EXISTS initialize_karma_on_comment ON public.comments;
DROP TRIGGER IF EXISTS update_user_karma_trigger ON public.posts;
DROP TRIGGER IF EXISTS update_user_karma_trigger ON public.comments;
DROP TRIGGER IF EXISTS update_user_karma_on_vote ON public.votes;

-- Step 3: Create clean, non-recursive vote count update triggers
CREATE OR REPLACE FUNCTION public.update_post_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
  target_post_id UUID;
BEGIN
  -- Determine the post_id based on the operation
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD.post_id;
  ELSE
    target_post_id := NEW.post_id;
  END IF;

  -- Only update if it's a post vote (not comment vote)
  IF target_post_id IS NOT NULL THEN
    -- Recalculate upvotes and downvotes for the post
    UPDATE public.posts
    SET
      upvotes = COALESCE((SELECT COUNT(*) FROM public.votes v WHERE v.post_id = posts.id AND v.vote_type = 'up'), 0),
      downvotes = COALESCE((SELECT COUNT(*) FROM public.votes v WHERE v.post_id = posts.id AND v.vote_type = 'down'), 0)
    WHERE id = target_post_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
      upvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE comment_id = comments.id AND vote_type = 'up'), 0),
      downvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE comment_id = comments.id AND vote_type = 'down'), 0)
    WHERE id = comment_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create vote count triggers
CREATE TRIGGER trigger_update_post_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_vote_counts();

CREATE TRIGGER trigger_update_comment_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_vote_counts();

-- Step 4: Create clean karma calculation functions
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

CREATE OR REPLACE FUNCTION public.calculate_user_karma(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN calculate_post_karma(user_uuid) + calculate_comment_karma(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create karma update trigger (non-recursive)
CREATE OR REPLACE FUNCTION public.update_user_karma()
RETURNS TRIGGER AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  -- Determine which user is affected
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    affected_user_id := NEW.author_id;
  ELSIF TG_OP = 'DELETE' THEN
    affected_user_id := OLD.author_id;
  END IF;

  -- Update karma for the affected user
  IF affected_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET
      post_karma = calculate_post_karma(affected_user_id),
      comment_karma = calculate_comment_karma(affected_user_id),
      karma = calculate_user_karma(affected_user_id),
      last_activity = now()
    WHERE id = affected_user_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create karma triggers on posts and comments
CREATE TRIGGER trigger_update_karma_on_post
  AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_user_karma();

CREATE TRIGGER trigger_update_karma_on_comment
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_user_karma();

-- Step 6: Update all existing posts and comments with correct vote counts
UPDATE public.posts
SET
  upvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE post_id = posts.id AND vote_type = 'up'), 0),
  downvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE post_id = posts.id AND vote_type = 'down'), 0);

UPDATE public.comments
SET
  upvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE comment_id = comments.id AND vote_type = 'up'), 0),
  downvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE comment_id = comments.id AND vote_type = 'down'), 0);

-- Step 7: Update all profiles with correct karma values (incremental approach to avoid timeouts)
DO $$
DECLARE
  batch_size INTEGER := 50;
  offset_val INTEGER := 0;
  affected_rows INTEGER;
BEGIN
  LOOP
    UPDATE public.profiles
    SET
      post_karma = calculate_post_karma(id),
      comment_karma = calculate_comment_karma(id),
      karma = calculate_user_karma(id)
    WHERE id IN (
      SELECT id FROM public.profiles
      ORDER BY id
      LIMIT batch_size OFFSET offset_val
    );

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    EXIT WHEN affected_rows = 0;

    offset_val := offset_val + batch_size;
    -- Add a small delay to prevent overwhelming the database
    PERFORM pg_sleep(0.05);
  END LOOP;
END;
$$;
