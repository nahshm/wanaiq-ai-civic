-- Trigger to auto-update comment vote counts
CREATE OR REPLACE FUNCTION public.update_comment_vote_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_comment_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN target_comment_id := OLD.comment_id;
  ELSE target_comment_id := NEW.comment_id; END IF;

  IF target_comment_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  UPDATE comments SET
    upvotes = COALESCE((SELECT COUNT(*) FROM votes WHERE comment_id = target_comment_id AND vote_type = 'up'), 0),
    downvotes = COALESCE((SELECT COUNT(*) FROM votes WHERE comment_id = target_comment_id AND vote_type = 'down'), 0)
  WHERE id = target_comment_id;

  IF TG_OP = 'UPDATE' AND OLD.comment_id IS DISTINCT FROM NEW.comment_id AND OLD.comment_id IS NOT NULL THEN
    UPDATE comments SET
      upvotes = COALESCE((SELECT COUNT(*) FROM votes WHERE comment_id = OLD.comment_id AND vote_type = 'up'), 0),
      downvotes = COALESCE((SELECT COUNT(*) FROM votes WHERE comment_id = OLD.comment_id AND vote_type = 'down'), 0)
    WHERE id = OLD.comment_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_comment_vote_counts ON public.votes;
CREATE TRIGGER trg_update_comment_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_vote_counts();

-- Trigger to auto-update post vote counts
CREATE OR REPLACE FUNCTION public.update_post_vote_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN target_post_id := OLD.post_id;
  ELSE target_post_id := NEW.post_id; END IF;

  IF target_post_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  UPDATE posts SET
    upvotes = COALESCE((SELECT COUNT(*) FROM votes WHERE post_id = target_post_id AND vote_type = 'up'), 0),
    downvotes = COALESCE((SELECT COUNT(*) FROM votes WHERE post_id = target_post_id AND vote_type = 'down'), 0)
  WHERE id = target_post_id;

  IF TG_OP = 'UPDATE' AND OLD.post_id IS DISTINCT FROM NEW.post_id AND OLD.post_id IS NOT NULL THEN
    UPDATE posts SET
      upvotes = COALESCE((SELECT COUNT(*) FROM votes WHERE post_id = OLD.post_id AND vote_type = 'up'), 0),
      downvotes = COALESCE((SELECT COUNT(*) FROM votes WHERE post_id = OLD.post_id AND vote_type = 'down'), 0)
    WHERE id = OLD.post_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_post_vote_counts ON public.votes;
CREATE TRIGGER trg_update_post_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.update_post_vote_counts();

-- Storage RLS for comment-media bucket
CREATE POLICY "Users can upload to comment-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'comment-media' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "Comment media is publicly accessible"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'comment-media');

CREATE POLICY "Users can delete own comment-media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'comment-media' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));