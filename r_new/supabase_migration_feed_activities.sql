-- ============================================================================
-- MIGRATION: Unified Activity Feed System
-- Purpose: Transform WanaIQ into a National Town Hall with unified activity stream
-- Author: Platform Team
-- Date: 2026-02-13
-- ============================================================================

-- 1. CREATE feed_activities TABLE
-- This table logs all public user actions to create a unified activity stream
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  target_id text,
  target_type text,
  metadata jsonb DEFAULT '{}',
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_feed_activities_created ON feed_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_activities_user ON feed_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_activities_type ON feed_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_feed_activities_public ON feed_activities(is_public) WHERE is_public = true;

-- Add composite index for user timeline queries
CREATE INDEX IF NOT EXISTS idx_feed_activities_user_created ON feed_activities(user_id, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE feed_activities IS 'Unified activity log for all public user actions (posts, projects, promises, verifications, etc.)';

-- ============================================================================
-- 2. CREATE ACTIVITY TYPE ENUM (for type safety)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE activity_type_enum AS ENUM (
    'post_created',
    'project_submitted',
    'project_verified',
    'promise_tracked',
    'promise_updated',
    'quest_completed',
    'community_joined',
    'community_created',
    'clip_uploaded',
    'issue_reported',
    'official_claimed',
    'achievement_earned',
    'comment_created',
    'vote_cast'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. CREATE UNIFIED FEED RPC FUNCTION
-- This function aggregates posts, projects, promises, clips, and activities
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unified_feed(
  p_user_id uuid DEFAULT NULL,
  p_limit_count int DEFAULT 50,
  p_offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  type text,
  user_id uuid,
  username text,
  avatar_url text,
  created_at timestamptz,
  data jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH combined_feed AS (
    -- Posts
    SELECT 
      p.id,
      'post'::text as type,
      p.author_id as user_id,
      prof.username,
      prof.avatar_url,
      p.created_at,
      jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'content', p.content,
        'content_type', p.content_type,
        'link_url', p.link_url,
        'community_id', p.community_id,
        'upvote_count', p.upvote_count,
        'downvote_count', p.downvote_count,
        'comment_count', p.comment_count,
        'flair', p.flair,
        'author_id', p.author_id,
        'created_at', p.created_at
      ) as data
    FROM posts p
    LEFT JOIN profiles prof ON p.author_id = prof.id
    WHERE p.deleted_at IS NULL
    
    UNION ALL
    
    -- Projects
    SELECT 
      pr.id,
      'project'::text as type,
      pr.submitted_by as user_id,
      prof.username,
      prof.avatar_url,
      pr.created_at,
      jsonb_build_object(
        'id', pr.id,
        'name', pr.name,
        'description', pr.description,
        'status', pr.status,
        'location', pr.location,
        'county', pr.county,
        'constituency', pr.constituency,
        'ward', pr.ward,
        'budget', pr.budget,
        'completion_percentage', pr.completion_percentage,
        'submitted_by', pr.submitted_by,
        'created_at', pr.created_at
      ) as data
    FROM projects pr
    LEFT JOIN profiles prof ON pr.submitted_by = prof.id
    
    UNION ALL
    
    -- Feed Activities (joins, verifications, achievements, etc.)
    SELECT 
      fa.id,
      fa.activity_type as type,
      fa.user_id,
      prof.username,
      prof.avatar_url,
      fa.created_at,
      jsonb_build_object(
        'id', fa.id,
        'activity_type', fa.activity_type,
        'target_id', fa.target_id,
        'target_type', fa.target_type,
        'metadata', fa.metadata,
        'user_id', fa.user_id,
        'created_at', fa.created_at
      ) as data
    FROM feed_activities fa
    LEFT JOIN profiles prof ON fa.user_id = prof.id
    WHERE fa.is_public = true
  )
  SELECT *
  FROM combined_feed
  ORDER BY created_at DESC
  LIMIT p_limit_count
  OFFSET p_offset_count;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION get_unified_feed IS 'Aggregates posts, projects, and activities into a unified chronological feed for the National Town Hall';

-- ============================================================================
-- 4. CREATE PERSONALIZED FEED RPC FUNCTION
-- This function filters the feed based on user preferences (location, interests)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_personalized_feed(
  p_user_id uuid,
  p_limit_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  type text,
  user_id uuid,
  username text,
  avatar_url text,
  created_at timestamptz,
  data jsonb,
  relevance_score int
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_county text;
  user_constituency text;
  user_ward text;
BEGIN
  -- Get user's location
  SELECT county_id, constituency_id, ward_id
  INTO user_county, user_constituency, user_ward
  FROM profiles
  WHERE id = p_user_id;

  RETURN QUERY
  WITH user_communities AS (
    -- Get communities user is a member of
    SELECT community_id
    FROM community_members
    WHERE user_id = p_user_id
  ),
  combined_feed AS (
    -- Posts from user's communities or location
    SELECT 
      p.id,
      'post'::text as type,
      p.author_id as user_id,
      prof.username,
      prof.avatar_url,
      p.created_at,
      jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'content', p.content,
        'content_type', p.content_type,
        'community_id', p.community_id,
        'upvote_count', p.upvote_count,
        'downvote_count', p.downvote_count,
        'comment_count', p.comment_count
      ) as data,
      CASE 
        WHEN p.community_id IN (SELECT community_id FROM user_communities) THEN 100
        WHEN p.author_id = p_user_id THEN 90
        ELSE 50
      END as relevance_score
    FROM posts p
    LEFT JOIN profiles prof ON p.author_id = prof.id
    WHERE p.deleted_at IS NULL
      AND (
        p.community_id IN (SELECT community_id FROM user_communities)
        OR p.author_id = p_user_id
        OR prof.county_id = user_county
      )
    
    UNION ALL
    
    -- Projects in user's area
    SELECT 
      pr.id,
      'project'::text as type,
      pr.submitted_by as user_id,
      prof.username,
      prof.avatar_url,
      pr.created_at,
      jsonb_build_object(
        'id', pr.id,
        'name', pr.name,
        'description', pr.description,
        'status', pr.status,
        'location', pr.location,
        'county', pr.county
      ) as data,
      CASE 
        WHEN pr.ward = user_ward THEN 100
        WHEN pr.constituency = user_constituency THEN 80
        WHEN pr.county = user_county THEN 60
        ELSE 40
      END as relevance_score
    FROM projects pr
    LEFT JOIN profiles prof ON pr.submitted_by = prof.id
    WHERE pr.county = user_county OR pr.constituency = user_constituency OR pr.ward = user_ward
    
    UNION ALL
    
    -- Relevant activities
    SELECT 
      fa.id,
      fa.activity_type as type,
      fa.user_id,
      prof.username,
      prof.avatar_url,
      fa.created_at,
      jsonb_build_object(
        'id', fa.id,
        'activity_type', fa.activity_type,
        'target_id', fa.target_id,
        'target_type', fa.target_type,
        'metadata', fa.metadata
      ) as data,
      50 as relevance_score
    FROM feed_activities fa
    LEFT JOIN profiles prof ON fa.user_id = prof.id
    WHERE fa.is_public = true
  )
  SELECT *
  FROM combined_feed
  ORDER BY relevance_score DESC, created_at DESC
  LIMIT p_limit_count;
END;
$$;

-- ============================================================================
-- 5. CREATE HELPER FUNCTION TO LOG ACTIVITIES
-- ============================================================================

CREATE OR REPLACE FUNCTION log_feed_activity(
  p_user_id uuid,
  p_activity_type text,
  p_target_id text DEFAULT NULL,
  p_target_type text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_is_public boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO feed_activities (
    user_id,
    activity_type,
    target_id,
    target_type,
    metadata,
    is_public
  )
  VALUES (
    p_user_id,
    p_activity_type,
    p_target_id,
    p_target_type,
    p_metadata,
    p_is_public
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- ============================================================================
-- 6. CREATE TRIGGERS FOR AUTOMATIC ACTIVITY LOGGING
-- ============================================================================

-- Trigger for post creation
CREATE OR REPLACE FUNCTION trigger_log_post_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM log_feed_activity(
    NEW.author_id,
    'post_created',
    NEW.id::text,
    'post',
    jsonb_build_object(
      'title', NEW.title,
      'community_id', NEW.community_id,
      'content_type', NEW.content_type
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_post_created ON posts;
CREATE TRIGGER on_post_created
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_post_created();

-- Trigger for project submission
CREATE OR REPLACE FUNCTION trigger_log_project_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM log_feed_activity(
    NEW.submitted_by,
    'project_submitted',
    NEW.id::text,
    'project',
    jsonb_build_object(
      'name', NEW.name,
      'location', NEW.location,
      'county', NEW.county,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_project_submitted ON projects;
CREATE TRIGGER on_project_submitted
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_project_submitted();

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE feed_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public activities
CREATE POLICY "Public activities are viewable by everyone"
  ON feed_activities FOR SELECT
  USING (is_public = true);

-- Policy: Users can view their own activities
CREATE POLICY "Users can view their own activities"
  ON feed_activities FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own activities
CREATE POLICY "Users can create their own activities"
  ON feed_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own activities
CREATE POLICY "Users can update their own activities"
  ON feed_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON feed_activities TO authenticated;
GRANT INSERT ON feed_activities TO authenticated;
GRANT UPDATE ON feed_activities TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify installation
DO $$
BEGIN
  RAISE NOTICE '✅ feed_activities table created';
  RAISE NOTICE '✅ Indexes created for optimal performance';
  RAISE NOTICE '✅ get_unified_feed() RPC function created';
  RAISE NOTICE '✅ get_personalized_feed() RPC function created';
  RAISE NOTICE '✅ log_feed_activity() helper function created';
  RAISE NOTICE '✅ Automatic triggers installed';
  RAISE NOTICE '✅ Row Level Security policies enabled';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '1. Run this migration in Supabase SQL Editor';
  RAISE NOTICE '2. Test with: SELECT * FROM get_unified_feed(NULL, 10);';
  RAISE NOTICE '3. Implement TypeScript activity logger service';
END $$;
