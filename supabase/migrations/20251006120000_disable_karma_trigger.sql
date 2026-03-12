-- Migration: Temporarily disable karma trigger to test post creation
-- Date: 2025-10-06

-- Disable the karma trigger temporarily
ALTER TABLE public.posts DISABLE TRIGGER trigger_update_karma_on_post;
ALTER TABLE public.comments DISABLE TRIGGER trigger_update_karma_on_comment;
