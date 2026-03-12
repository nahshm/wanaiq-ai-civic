-- ============================================================================
-- MIGRATION: Unified Activity Feed System (FIXED VERSION)
-- Purpose: Transform WanaIQ into a National Town Hall with unified activity stream
-- Author: Platform Team
-- Date: 2026-02-14
-- FIXED: Removed link_url reference that doesn't exist in posts table
-- ============================================================================

-- Clean up old version
DROP FUNCTION IF EXISTS get_unified_feed(uuid, int, int) CASCADE;
DROP FUNCTION IF EXISTS get_personalized_feed(uuid, int) CASCADE;
DROP FUNCTION IF EXISTS log_feed_activity(uuid, text, text, text, jsonb, boolean) CASCADE;
DROP FUNCTION IF EXISTS trigger_log_post_created() CASCADE;
DROP FUNCTION IF EXISTS trigger_log_project_submitted() CASCADE;
DROP TABLE IF EXISTS feed_activities CASCADE;

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
-- 2. CREATE UNIFIED FEED RPC FUNCTION (FIXED)
-- This function aggregates posts, projects, and activities
-- FIXED: Removed p.link_url column that doesn't exist
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
    -- Posts (FIXED: removed link_url, added community data)
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
        'community_name', c.name,
        'community_icon', c.avatar_url,
        'upvote_count', p.upvotes,
        'downvote_count', p.downvotes,
        'comment_count', p.comment_count,
        'author_id', p.author_id,
        'created_at', p.created_at,
        'media', (
          SELECT jsonb_agg(jsonb_build_object(
            'id', pm.id,
            'file_path', pm.file_path,
            'file_type', pm.file_type
          ))
          FROM post_media pm
          WHERE pm.post_id = p.id
        )
      ) as data
    FROM posts p
    LEFT JOIN profiles prof ON p.author_id = prof.id
    LEFT JOIN communities c ON p.community_id = c.id
    
    UNION ALL
    
    -- Projects
    SELECT 
      pr.id,
      'project'::text as type,
      pr.created_by as user_id,
      prof.username,
      prof.avatar_url,
      pr.created_at,
      jsonb_build_object(
        'id', pr.id,
        'name', pr.title,
        'description', pr.description,
        'status', pr.status,
        'location', pr.location,
        'county', pr.county,
        'constituency', pr.constituency,
        'ward', pr.ward,
        'budget', pr.budget_allocated,
        'completion_percentage', pr.progress_percentage,
        'submitted_by', pr.created_by,
        'created_at', pr.created_at,
        'media_urls', pr.media_urls
      ) as data
    FROM government_projects pr
    LEFT JOIN profiles prof ON pr.created_by = prof.id
    
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
-- 3. CREATE PERSONALIZED FEED RPC FUNCTION (FIXED)
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
    -- Posts from user's communities or location (FIXED: removed link_url, added community data)
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
        'community_name', c.name,
        'community_icon', c.avatar_url,
        'upvote_count', p.upvotes,
        'downvote_count', p.downvotes,
        'comment_count', p.comment_count,
        'media', (
           SELECT jsonb_agg(jsonb_build_object(
             'id', pm.id,
             'file_path', pm.file_path,
             'file_type', pm.file_type
           ))
           FROM post_media pm
           WHERE pm.post_id = p.id
        )
      ) as data,
      CASE 
        WHEN p.community_id IN (SELECT community_id FROM user_communities) THEN 100
        WHEN p.author_id = p_user_id THEN 90
        ELSE 50
      END as relevance_score
    FROM posts p
    LEFT JOIN profiles prof ON p.author_id = prof.id
    LEFT JOIN communities c ON p.community_id = c.id
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
      pr.created_by as user_id,
      prof.username,
      prof.avatar_url,
      pr.created_at,
      jsonb_build_object(
        'id', pr.id,
        'name', pr.title,
        'description', pr.description,
        'status', pr.status,
        'location', pr.location,
        'county', pr.county,
        'media_urls', pr.media_urls
      ) as data,
      CASE 
        WHEN pr.ward = user_ward THEN 100
        WHEN pr.constituency = user_constituency THEN 80
        WHEN pr.county = user_county THEN 60
        ELSE 40
      END as relevance_score
    FROM government_projects pr
    LEFT JOIN profiles prof ON pr.created_by = prof.id
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
-- 4. CREATE HELPER FUNCTION TO LOG ACTIVITIES
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
-- 5. CREATE TRIGGERS FOR AUTOMATIC ACTIVITY LOGGING
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
    NEW.created_by,
    'project_submitted',
    NEW.id::text,
    'project',
    jsonb_build_object(
      'name', NEW.title,
      'location', NEW.location,
      'county', NEW.county,
      'status', NEW.status,
      'image_url', (CASE WHEN NEW.media_urls IS NOT NULL AND array_length(NEW.media_urls, 1) > 0 THEN NEW.media_urls[1] ELSE NULL END)
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_project_submitted ON government_projects;
CREATE TRIGGER on_project_submitted
  AFTER INSERT ON government_projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_project_submitted();

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE feed_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public activities
DROP POLICY IF EXISTS "Public activities are viewable by everyone" ON feed_activities;
CREATE POLICY "Public activities are viewable by everyone"
  ON feed_activities FOR SELECT
  USING (is_public = true);

-- Policy: Users can view their own activities
DROP POLICY IF EXISTS "Users can view their own activities" ON feed_activities;
CREATE POLICY "Users can view their own activities"
  ON feed_activities FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own activities
DROP POLICY IF EXISTS "Users can create their own activities" ON feed_activities;
CREATE POLICY "Users can create their own activities"
  ON feed_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own activities
DROP POLICY IF EXISTS "Users can update their own activities" ON feed_activities;
CREATE POLICY "Users can update their own activities"
  ON feed_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON feed_activities TO authenticated;
GRANT INSERT ON feed_activities TO authenticated;
GRANT UPDATE ON feed_activities TO authenticated;
