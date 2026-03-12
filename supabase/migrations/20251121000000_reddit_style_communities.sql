-- Reddit-Style Community Enhancements Migration
-- Adds online member tracking, visibility types, verification badges, and related features

-- 1. Add new columns to communities table
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS visibility_type TEXT DEFAULT 'public' 
  CHECK (visibility_type IN ('public', 'restricted', 'private')),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_mature BOOLEAN DEFAULT FALSE;

-- Update existing communities to have public visibility
UPDATE communities SET visibility_type = 'public' WHERE visibility_type IS NULL;

-- 2. Create table for tracking online/active members
CREATE TABLE IF NOT EXISTS community_active_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

-- Index for fast lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_community_active_members_last_seen 
ON community_active_members(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_community_active_members_community 
ON community_active_members(community_id);

-- 3. Function to get online member count (active in last 15 minutes)
CREATE OR REPLACE FUNCTION get_online_member_count(community_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM community_active_members
    WHERE community_id = community_uuid
      AND last_seen_at > NOW() - INTERVAL '15 minutes'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Function to update user's last seen timestamp in a community
CREATE OR REPLACE FUNCTION update_community_active_status(
  p_community_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO community_active_members (community_id, user_id, last_seen_at)
  VALUES (p_community_id, p_user_id, NOW())
  ON CONFLICT (community_id, user_id)
  DO UPDATE SET last_seen_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Cleanup function to remove stale active member records (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_stale_active_members()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM community_active_members
  WHERE last_seen_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Create table for community bookmarks (optional feature)
CREATE TABLE IF NOT EXISTS community_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_bookmarks_community 
ON community_bookmarks(community_id, display_order);

-- 7. RLS Policies for community_active_members
ALTER TABLE community_active_members ENABLE ROW LEVEL SECURITY;

-- Anyone can view online members of public communities
CREATE POLICY "Anyone can view active members of public communities"
ON community_active_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM communities
    WHERE id = community_active_members.community_id
    AND visibility_type = 'public'
  )
);

-- Members can view active members of their communities
CREATE POLICY "Members can view active members"
ON community_active_members FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM community_members
    WHERE community_id = community_active_members.community_id
  )
);

-- Users can update their own active status
CREATE POLICY "Users can update own active status"
ON community_active_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own active status timestamp"
ON community_active_members FOR UPDATE
USING (auth.uid() = user_id);

-- 8. RLS Policies for community_bookmarks
ALTER TABLE community_bookmarks ENABLE ROW LEVEL SECURITY;

-- Anyone can view bookmarks of public communities
CREATE POLICY "Anyone can view bookmarks of public communities"
ON community_bookmarks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM communities
    WHERE id = community_bookmarks.community_id
    AND visibility_type = 'public'
  )
);

-- Moderators can manage bookmarks
CREATE POLICY "Moderators can manage bookmarks"
ON community_bookmarks FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM community_moderators
    WHERE community_id = community_bookmarks.community_id
  )
);

-- 9. Create storage bucket for community assets (if not exists)
-- This needs to be run separately in Supabase Dashboard or via API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('community-assets', 'community-assets', true)
-- ON CONFLICT (id) DO NOTHING;

-- 10. Add helper view for communities with online counts  
CREATE OR REPLACE VIEW communities_with_stats AS
SELECT 
  c.id,
  c.name,
  c.display_name,
  c.description,
  c.category,
  c.created_at,
  c.updated_at,
  c.visibility_type,
  c.is_verified,
  c.is_mature,
  COALESCE(cm.member_count, 0) as member_count,
  COALESCE(get_online_member_count(c.id), 0) as online_count
FROM communities c
LEFT JOIN (
  SELECT community_id, COUNT(*)::INTEGER as member_count
  FROM community_members
  GROUP BY community_id
) cm ON c.id = cm.community_id;

-- Grant access to the view
GRANT SELECT ON communities_with_stats TO authenticated, anon;

-- 11. Add comment for documentation
COMMENT ON TABLE community_active_members IS 'Tracks which users are currently active/online in each community';
COMMENT ON TABLE community_bookmarks IS 'Community-specific bookmarks/links displayed in sidebar';
COMMENT ON COLUMN communities.visibility_type IS 'Public: anyone can join, Restricted: anyone can view but only approved can post, Private: invite only';
COMMENT ON COLUMN communities.is_verified IS 'Official/verified community badge';
COMMENT ON COLUMN communities.is_mature IS 'Adult content (18+) flag';
