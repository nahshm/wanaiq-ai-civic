-- Migration: Add separate post and comment karma fields
-- Date: 2025-10-03

-- Add separate karma fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS post_karma INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_karma INTEGER DEFAULT 0;

-- Update total karma to be computed as post_karma + comment_karma
-- We'll keep the existing karma field for backward compatibility but update its calculation

-- Function to calculate post karma (not 1:1 ratio - using floor of net votes / 10)
CREATE OR REPLACE FUNCTION public.calculate_post_karma(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  post_karma INTEGER := 0;
BEGIN
  -- Calculate karma from posts: floor((upvotes - downvotes) / 10)
  SELECT COALESCE(FLOOR((COUNT(CASE WHEN v.vote_type = 'up' THEN 1 END) - COUNT(CASE WHEN v.vote_type = 'down' THEN 1 END)) / 10.0), 0)::INTEGER INTO post_karma
  FROM public.posts p
  LEFT JOIN public.votes v ON p.id = v.post_id
  WHERE p.author_id = user_uuid;

  RETURN post_karma;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate comment karma (not 1:1 ratio - using floor of net votes / 10)
CREATE OR REPLACE FUNCTION public.calculate_comment_karma(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  comment_karma INTEGER := 0;
BEGIN
  -- Calculate karma from comments: floor((upvotes - downvotes) / 10)
  SELECT COALESCE(FLOOR((COUNT(CASE WHEN v.vote_type = 'up' THEN 1 END) - COUNT(CASE WHEN v.vote_type = 'down' THEN 1 END)) / 10.0), 0)::INTEGER INTO comment_karma
  FROM public.comments c
  LEFT JOIN public.votes v ON c.id = v.comment_id
  WHERE c.author_id = user_uuid;

  RETURN comment_karma;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the main karma calculation function to use separate calculations
CREATE OR REPLACE FUNCTION public.calculate_user_karma(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_karma INTEGER := 0;
  post_k INTEGER := 0;
  comment_k INTEGER := 0;
BEGIN
  -- Calculate separate karma types
  post_k := calculate_post_karma(user_uuid);
  comment_k := calculate_comment_karma(user_uuid);

  -- Update the separate fields
  UPDATE public.profiles
  SET post_karma = post_k, comment_karma = comment_k
  WHERE id = user_uuid;

  -- Total karma is sum of post and comment karma
  total_karma := post_k + comment_k;

  RETURN total_karma;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger function to use the new calculation
-- This trigger should only fire on INSERT, not UPDATE to avoid recursion
CREATE OR REPLACE FUNCTION public.update_user_karma()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update karma on INSERT, not UPDATE to prevent recursion
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET karma = calculate_user_karma(NEW.author_id),
        last_activity = now()
    WHERE id = NEW.author_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_post_karma ON public.profiles(post_karma);
CREATE INDEX IF NOT EXISTS idx_profiles_comment_karma ON public.profiles(comment_karma);


