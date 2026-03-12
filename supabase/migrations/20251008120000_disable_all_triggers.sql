-- Migration: Temporarily disable all triggers to isolate the post creation issue
-- Date: 2025-10-08

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_karma_on_post') THEN
    EXECUTE 'ALTER TABLE public.posts DISABLE TRIGGER trigger_update_karma_on_post';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_karma_on_comment') THEN
    EXECUTE 'ALTER TABLE public.comments DISABLE TRIGGER trigger_update_karma_on_comment';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_activity_stats') THEN
    EXECUTE 'ALTER TABLE public.profiles DISABLE TRIGGER trigger_update_activity_stats';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_post_vote_counts') THEN
    EXECUTE 'ALTER TABLE public.votes DISABLE TRIGGER trigger_update_post_vote_counts';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_comment_vote_counts') THEN
    EXECUTE 'ALTER TABLE public.votes DISABLE TRIGGER trigger_update_comment_vote_counts';
  END IF;
  -- Additional trigger checks for any remaining triggers
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_karma_on_vote_trigger') THEN
    EXECUTE 'ALTER TABLE public.votes DISABLE TRIGGER update_karma_on_vote_trigger';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'initialize_karma_on_post') THEN
    EXECUTE 'ALTER TABLE public.posts DISABLE TRIGGER initialize_karma_on_post';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'initialize_karma_on_comment') THEN
    EXECUTE 'ALTER TABLE public.comments DISABLE TRIGGER initialize_karma_on_comment';
  END IF;
END;
$$;
