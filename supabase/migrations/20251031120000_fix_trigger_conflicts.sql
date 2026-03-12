-- Migration: Complete fix for trigger conflicts and RLS policies
-- Date: 2025-10-31

-- Step 1: Drop ALL conflicting triggers first
DROP TRIGGER IF EXISTS trigger_update_karma_on_post ON public.posts;
DROP TRIGGER IF EXISTS trigger_update_karma_on_comment ON public.comments;
DROP TRIGGER IF EXISTS trigger_update_post_vote_counts ON public.votes;
DROP TRIGGER IF EXISTS trigger_update_comment_vote_counts ON public.votes;
DROP TRIGGER IF EXISTS update_karma_on_vote_trigger ON public.votes;
DROP TRIGGER IF EXISTS initialize_karma_on_post ON public.posts;
DROP TRIGGER IF EXISTS initialize_karma_on_comment ON public.comments;
DROP TRIGGER IF EXISTS update_user_karma_trigger ON public.posts;
DROP TRIGGER IF EXISTS update_user_karma_trigger ON public.comments;
DROP TRIGGER IF EXISTS update_user_karma_on_vote ON public.votes;
DROP TRIGGER IF EXISTS update_comment_awards_updated_at ON public.comment_awards;
DROP TRIGGER IF EXISTS trigger_update_comment_karma_from_awards ON public.comment_award_assignments;

-- Step 2: Safely drop and recreate RLS policies for posts table
DO $$ 
BEGIN
    -- Drop policies only if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all posts' AND tablename = 'posts') THEN
        DROP POLICY "Users can view all posts" ON public.posts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert posts' AND tablename = 'posts') THEN
        DROP POLICY "Users can insert posts" ON public.posts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own posts' AND tablename = 'posts') THEN
        DROP POLICY "Users can update their own posts" ON public.posts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own posts' AND tablename = 'posts') THEN
        DROP POLICY "Users can delete their own posts" ON public.posts;
    END IF;
END $$;

-- Allow everyone to view posts
CREATE POLICY "Users can view all posts" ON public.posts
  FOR SELECT USING (true);

-- Allow authenticated users to insert posts (using correct auth.uid() check)
CREATE POLICY "Users can insert posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- Step 3: Safely drop and recreate RLS policies for comments table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all comments' AND tablename = 'comments') THEN
        DROP POLICY "Users can view all comments" ON public.comments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert comments' AND tablename = 'comments') THEN
        DROP POLICY "Users can insert comments" ON public.comments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own comments' AND tablename = 'comments') THEN
        DROP POLICY "Users can update their own comments" ON public.comments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own comments' AND tablename = 'comments') THEN
        DROP POLICY "Users can delete their own comments" ON public.comments;
    END IF;
END $$;

-- Allow everyone to view comments
CREATE POLICY "Users can view all comments" ON public.comments
  FOR SELECT USING (true);

-- Allow authenticated users to insert comments
CREATE POLICY "Users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = author_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = author_id);

-- Step 4: Safely drop and recreate RLS policies for votes table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all votes' AND tablename = 'votes') THEN
        DROP POLICY "Users can view all votes" ON public.votes;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert votes' AND tablename = 'votes') THEN
        DROP POLICY "Users can insert votes" ON public.votes;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own votes' AND tablename = 'votes') THEN
        DROP POLICY "Users can update their own votes" ON public.votes;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own votes' AND tablename = 'votes') THEN
        DROP POLICY "Users can delete their own votes" ON public.votes;
    END IF;
END $$;

-- Allow authenticated users to view all votes
CREATE POLICY "Users can view all votes" ON public.votes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert votes
CREATE POLICY "Users can insert votes" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own votes
CREATE POLICY "Users can update their own votes" ON public.votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own votes
CREATE POLICY "Users can delete their own votes" ON public.votes
  FOR DELETE USING (auth.uid() = user_id);

-- [Rest of the script remains the same - Steps 5-10 from previous version]
-- Step 5: Create clean, non-recursive karma calculation functions (for manual use)
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

-- Step 6: Create vote count update functions (AFTER triggers only)
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

-- Step 7: Create ONLY vote count triggers (skip karma triggers to prevent recursion)
CREATE TRIGGER trigger_update_post_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_vote_counts();

CREATE TRIGGER trigger_update_comment_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_vote_counts();

-- Step 8: Create manual karma update function (no triggers - call this manually when needed)
CREATE OR REPLACE FUNCTION public.update_all_karma()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET
    post_karma = calculate_post_karma(id),
    comment_karma = calculate_comment_karma(id),
    karma = calculate_user_karma(id),
    last_activity = COALESCE(last_activity, NOW())
  WHERE id IN (SELECT id FROM public.profiles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Update all existing posts and comments with correct vote counts
UPDATE public.posts
SET
  upvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE post_id = posts.id AND vote_type = 'up'), 0),
  downvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE post_id = posts.id AND vote_type = 'down'), 0);

UPDATE public.comments
SET
  upvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE comment_id = comments.id AND vote_type = 'up'), 0),
  downvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE comment_id = comments.id AND vote_type = 'down'), 0);

-- Step 10: Update all profiles with correct karma values (one-time manual update)
SELECT public.update_all_karma();