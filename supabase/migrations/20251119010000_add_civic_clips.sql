-- Add video content (CivicClips) functionality to WanaIQ platform
-- Migration: Create tables for video content, engagement tracking, and storage configuration

-- ============================================================================
-- 1. CONTENT TYPE ENUM
-- ============================================================================

-- Create content_type enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('text', 'video', 'image', 'poll', 'live');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add content_type column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS content_type content_type DEFAULT 'text';

-- Add video metadata column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS video_data jsonb;

-- ============================================================================
-- 2. CIVIC CLIPS TABLE - Video-specific metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS civic_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE UNIQUE,
  
  -- Video file information
  video_url text NOT NULL,
  thumbnail_url text,
  duration integer, -- in seconds
  width integer,
  height integer,
  aspect_ratio text DEFAULT '9:16', -- vertical video default
  file_size bigint,
  format text DEFAULT 'mp4',
  quality text DEFAULT 'original',
  
  -- Processing status
  processing_status text DEFAULT 'pending', -- pending, processing, ready, failed
  processing_error text,
  
  -- Engagement metrics
  views_count integer DEFAULT 0,
  watch_time_total integer DEFAULT 0, -- total seconds watched across all users
  average_watch_percentage numeric(5,2) DEFAULT 0, -- average % of video watched
  
  -- Discovery & categorization
  hashtags text[] DEFAULT '{}',
  category text, -- civic_education, promise_update, project_showcase, explainer, etc.
  
  -- Civic reference (link to official, promise, or project)
  civic_type text, -- 'official', 'promise', 'project', null
  civic_reference_id uuid, -- ID of related official/promise/project
  
  -- Accessibility
  captions_url text, -- Link to VTT captions file
  transcript text, -- Auto-generated/manual transcript for search
  
  -- Featured content
  is_featured boolean DEFAULT false,
  featured_at timestamptz,
  featured_by uuid REFERENCES profiles(id),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_civic_clips_post ON civic_clips(post_id);
CREATE INDEX IF NOT EXISTS idx_civic_clips_category ON civic_clips(category);
CREATE INDEX IF NOT EXISTS idx_civic_clips_status ON civic_clips(processing_status);
CREATE INDEX IF NOT EXISTS idx_civic_clips_hashtags ON civic_clips USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_civic_clips_reference ON civic_clips(civic_type, civic_reference_id);
CREATE INDEX IF NOT EXISTS idx_civic_clips_featured ON civic_clips(is_featured, featured_at DESC) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_civic_clips_created ON civic_clips(created_at DESC);

-- ============================================================================
-- 3. VIDEO ENGAGEMENT TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS civic_clip_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid REFERENCES civic_clips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Watch metrics
  watch_duration integer NOT NULL, -- seconds watched
  watch_percentage numeric(5,2), -- % of video watched
  completed boolean DEFAULT false, -- watched to end (>=90%)
  
  -- Session info
  device_type text, -- mobile, desktop, tablet
  viewed_at timestamptz DEFAULT now()
);

-- Note: No unique constraint - we track all views for accurate analytics
-- Views can be deduplicated in queries if needed (e.g., COUNT(DISTINCT user_id))

CREATE INDEX IF NOT EXISTS idx_clip_views_clip ON civic_clip_views(clip_id);
CREATE INDEX IF NOT EXISTS idx_clip_views_user ON civic_clip_views(user_id);
CREATE INDEX IF NOT EXISTS idx_clip_views_date ON civic_clip_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_clip_views_clip_user ON civic_clip_views(clip_id, user_id);

-- ============================================================================
-- 4. VIDEO QUALITY VARIANTS (for adaptive streaming - future)
-- ============================================================================

CREATE TABLE IF NOT EXISTS civic_clip_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid REFERENCES civic_clips(id) ON DELETE CASCADE,
  
  quality text NOT NULL, -- 1080p, 720p, 480p, 360p, 240p
  video_url text NOT NULL,
  file_size bigint,
  bitrate integer, -- in kbps
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(clip_id, quality)
);

CREATE INDEX IF NOT EXISTS idx_clip_variants_clip ON civic_clip_variants(clip_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE civic_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_clip_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_clip_variants ENABLE ROW LEVEL SECURITY;

-- Civic clips policies
DROP POLICY IF EXISTS "Civic clips are viewable by everyone" ON civic_clips;
CREATE POLICY "Civic clips are viewable by everyone"
  ON civic_clips FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create civic clips" ON civic_clips;
CREATE POLICY "Users can create civic clips"
  ON civic_clips FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own civic clips" ON civic_clips;
CREATE POLICY "Users can update their own civic clips"
  ON civic_clips FOR UPDATE
  USING (
    post_id IN (
      SELECT id FROM posts WHERE author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own civic clips" ON civic_clips;
CREATE POLICY "Users can delete their own civic clips"
  ON civic_clips FOR DELETE
  USING (
    post_id IN (
      SELECT id FROM posts WHERE author_id = auth.uid()
    )
  );

-- Clip views policies
DROP POLICY IF EXISTS "Users can view all clip views" ON civic_clip_views;
CREATE POLICY "Users can view all clip views"
  ON civic_clip_views FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create clip views" ON civic_clip_views;
CREATE POLICY "Users can create clip views"
  ON civic_clip_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Clip variants policies
DROP POLICY IF EXISTS "Clip variants are viewable by everyone" ON civic_clip_variants;
CREATE POLICY "Clip variants are viewable by everyone"
  ON civic_clip_variants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only system can manage variants" ON civic_clip_variants;
CREATE POLICY "Only system can manage variants"
  ON civic_clip_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- ============================================================================
-- 6. TRIGGER TO UPDATE VIEW COUNTS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_clip_view_counts() RETURNS trigger AS $$
BEGIN
  -- Update views_count
  UPDATE civic_clips
  SET 
    views_count = views_count + 1,
    watch_time_total = watch_time_total + NEW.watch_duration,
    average_watch_percentage = (
      SELECT AVG(watch_percentage) 
      FROM civic_clip_views 
      WHERE clip_id = NEW.clip_id
    ),
    updated_at = now()
  WHERE id = NEW.clip_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS civic_clip_views_update_counts ON civic_clip_views;
CREATE TRIGGER civic_clip_views_update_counts
AFTER INSERT ON civic_clip_views
FOR EACH ROW EXECUTE FUNCTION update_clip_view_counts();

-- ============================================================================
-- 7. TRIGGER TO UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_civic_clips_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS civic_clips_updated_at ON civic_clips;
CREATE TRIGGER civic_clips_updated_at
BEFORE UPDATE ON civic_clips
FOR EACH ROW EXECUTE FUNCTION update_civic_clips_updated_at();

-- ============================================================================
-- 8. STORAGE BUCKET SETUP (run in Supabase dashboard or via API)
-- ============================================================================

-- Note: Storage buckets must be created via Supabase dashboard or Storage API
-- This is a placeholder for documentation purposes

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('civic-clips', 'civic-clips', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies would be:
-- 1. Users can upload to their own folder
-- 2. All videos are publicly readable
-- 3. Users can update/delete their own videos

COMMENT ON TABLE civic_clips IS 'Stores metadata for video content (CivicClips)';
COMMENT ON TABLE civic_clip_views IS 'Tracks video viewing analytics and engagement';
COMMENT ON TABLE civic_clip_variants IS 'Stores different quality versions of videos for adaptive streaming';

COMMENT ON COLUMN civic_clips.processing_status IS 'pending: uploaded, processing: being transcoded, ready: available, failed: error occurred';
COMMENT ON COLUMN civic_clips.category IS 'civic_education, promise_update, project_showcase, explainer, community_report, etc.';
COMMENT ON COLUMN civic_clips.civic_reference_id IS 'Links video to an official, promise, or project for context';
COMMENT ON COLUMN civic_clip_views.watch_percentage IS 'Percentage of video watched (0-100)';
COMMENT ON COLUMN civic_clip_views.completed IS 'True if user watched >=90% of the video';
