-- Migration: Enhance profiles and communities for Reddit-style features
-- Date: 2025-09-30

-- Add new columns to profiles table for enhanced user profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS karma INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS expertise TEXT[],
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "activity_visibility": "public", "contact_visibility": "private"}'::jsonb,
ADD COLUMN IF NOT EXISTS activity_stats JSONB DEFAULT '{"post_count": 0, "comment_count": 0, "upvote_count": 0, "join_date": null}'::jsonb,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add new columns to communities table for enhanced community management
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS sensitivity_level TEXT DEFAULT 'public' CHECK (sensitivity_level IN ('public', 'moderated', 'private')),
ADD COLUMN IF NOT EXISTS allow_post_flairs BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_user_flairs BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS theme_color TEXT,
ADD COLUMN IF NOT EXISTS description_html TEXT,
ADD COLUMN IF NOT EXISTS sidebar_content TEXT,
ADD COLUMN IF NOT EXISTS submission_rules TEXT,
ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS minimum_karma_to_post INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_moderate BOOLEAN DEFAULT false;

-- Create community_moderators table
CREATE TABLE IF NOT EXISTS public.community_moderators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'moderator' CHECK (role IN ('moderator', 'admin')),
  permissions JSONB DEFAULT '{"can_delete": true, "can_ban": true, "can_approve": true, "can_flair": true}'::jsonb,
  added_by UUID REFERENCES public.profiles(id),
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community_rules table
CREATE TABLE IF NOT EXISTS public.community_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create community_flairs table
CREATE TABLE IF NOT EXISTS public.community_flairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  text_color TEXT DEFAULT '#000000',
  background_color TEXT DEFAULT '#ffffff',
  flair_type TEXT DEFAULT 'post' CHECK (flair_type IN ('post', 'user')),
  is_enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, name, flair_type)
);

-- Create user_activity_log table for activity tracking
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('post_created', 'comment_created', 'post_upvoted', 'comment_upvoted', 'community_joined', 'profile_updated')),
  entity_id UUID, -- Can reference posts, comments, communities
  entity_type TEXT CHECK (entity_type IN ('post', 'comment', 'community')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_privacy_settings table for granular privacy controls
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  activity_visibility TEXT DEFAULT 'public' CHECK (activity_visibility IN ('public', 'friends', 'private')),
  contact_visibility TEXT DEFAULT 'private' CHECK (contact_visibility IN ('public', 'friends', 'private')),
  show_online_status BOOLEAN DEFAULT true,
  allow_messages TEXT DEFAULT 'everyone' CHECK (allow_messages IN ('everyone', 'friends', 'nobody')),
  data_sharing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on new tables
ALTER TABLE public.community_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_flairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_moderators
CREATE POLICY "Community moderators are viewable by community members"
ON public.community_moderators FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_moderators.community_id
    AND cm.user_id = auth.uid()
  ) OR auth.uid() = user_id
);

CREATE POLICY "Community admins can manage moderators"
ON public.community_moderators FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.community_moderators cm
    WHERE cm.community_id = community_moderators.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- RLS Policies for community_rules
CREATE POLICY "Community rules are viewable by everyone"
ON public.community_rules FOR SELECT USING (true);

CREATE POLICY "Community moderators can manage rules"
ON public.community_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.community_moderators cm
    WHERE cm.community_id = community_rules.community_id
    AND cm.user_id = auth.uid()
  )
);

-- RLS Policies for community_flairs
CREATE POLICY "Community flairs are viewable by everyone"
ON public.community_flairs FOR SELECT USING (true);

CREATE POLICY "Community moderators can manage flairs"
ON public.community_flairs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.community_moderators cm
    WHERE cm.community_id = community_flairs.community_id
    AND cm.user_id = auth.uid()
  )
);

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view their own activity"
ON public.user_activity_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
ON public.user_activity_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_privacy_settings
CREATE POLICY "Users can manage their own privacy settings"
ON public.user_privacy_settings FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_karma ON public.profiles(karma);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON public.profiles(last_activity);
CREATE INDEX IF NOT EXISTS idx_communities_sensitivity_level ON public.communities(sensitivity_level);
CREATE INDEX IF NOT EXISTS idx_community_moderators_community_id ON public.community_moderators(community_id);
CREATE INDEX IF NOT EXISTS idx_community_rules_community_id ON public.community_rules(community_id);
CREATE INDEX IF NOT EXISTS idx_community_flairs_community_id ON public.community_flairs(community_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at);

-- Create functions for karma calculation
CREATE OR REPLACE FUNCTION public.calculate_user_karma(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_karma INTEGER := 0;
BEGIN
  -- Calculate karma from posts
  SELECT COALESCE(SUM(upvotes - downvotes), 0) INTO total_karma
  FROM public.posts
  WHERE author_id = user_uuid;

  -- Add karma from comments
  total_karma := total_karma + COALESCE((
    SELECT SUM(upvotes - downvotes)
    FROM public.comments
    WHERE author_id = user_uuid
  ), 0);

  RETURN total_karma;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user karma
CREATE OR REPLACE FUNCTION public.update_user_karma()
RETURNS TRIGGER AS $$  
BEGIN  
  -- Prevent recursion by checking TG_OP and TG_LEVEL
  IF (TG_OP = 'UPDATE' AND TG_LEVEL = 'ROW') THEN
    IF (OLD.karma IS DISTINCT FROM NEW.karma) THEN
      RETURN NEW;
    END IF;
  END IF;

  UPDATE public.profiles  
  SET karma = calculate_user_karma(NEW.author_id),  
      last_activity = now()  
  WHERE id = NEW.author_id;  
  
  RETURN NEW;  
END;  
$$ LANGUAGE plpgsql SECURITY DEFINER;  

-- Function to update activity stats
CREATE OR REPLACE FUNCTION public.update_user_activity_stats()
RETURNS TRIGGER AS $$
DECLARE
  post_count INTEGER := 0;
  comment_count INTEGER := 0;
  upvote_count INTEGER := 0;
BEGIN
  -- Prevent recursion by checking TG_OP and TG_LEVEL
  IF (TG_OP = 'UPDATE' AND TG_LEVEL = 'ROW') THEN
    IF (OLD.activity_stats IS DISTINCT FROM NEW.activity_stats) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Get counts
  SELECT COUNT(*) INTO post_count FROM public.posts WHERE author_id = NEW.id;
  SELECT COUNT(*) INTO comment_count FROM public.comments WHERE author_id = NEW.id;
  SELECT COUNT(*) INTO upvote_count FROM public.votes WHERE user_id = NEW.id AND vote_type = 'up';

  -- Update activity stats
  UPDATE public.profiles
  SET activity_stats = jsonb_build_object(
    'post_count', post_count,
    'comment_count', comment_count,
    'upvote_count', upvote_count,
    'join_date', (SELECT created_at FROM public.profiles WHERE id = NEW.id)
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic karma and activity updates
CREATE TRIGGER trigger_update_karma_on_post
  AFTER INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_user_karma();

CREATE TRIGGER trigger_update_karma_on_comment
  AFTER INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_user_karma();

CREATE TRIGGER trigger_update_activity_stats
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_activity_stats();

-- Create trigger for activity logging
CREATE OR REPLACE FUNCTION public.log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, activity_type, entity_id, entity_type, metadata)
  VALUES (
    NEW.author_id,
    CASE
      WHEN TG_TABLE_NAME = 'posts' THEN 'post_created'
      WHEN TG_TABLE_NAME = 'comments' THEN 'comment_created'
    END,
    NEW.id,
    CASE
      WHEN TG_TABLE_NAME = 'posts' THEN 'post'
      WHEN TG_TABLE_NAME = 'comments' THEN 'comment'
    END,
    jsonb_build_object('title', COALESCE(NEW.title, NEW.content))
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_post_activity
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER trigger_log_comment_activity
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

-- Update existing profiles with default privacy settings
INSERT INTO public.user_privacy_settings (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Update timestamp triggers for new tables
CREATE TRIGGER update_community_rules_updated_at
  BEFORE UPDATE ON public.community_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_privacy_settings_updated_at
  BEFORE UPDATE ON public.user_privacy_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
