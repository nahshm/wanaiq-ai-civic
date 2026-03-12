-- Add Reddit-style visual columns to communities table
-- Adds banner, avatar, and other missing columns for full Reddit-style support

-- 1. Add visual and metadata columns
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS description_html TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_communities_created_by 
ON communities(created_by);

-- 3. Drop and recreate the communities_with_stats view to include new columns
DROP VIEW IF EXISTS communities_with_stats;

CREATE VIEW communities_with_stats AS
SELECT 
  c.id,
  c.name,
  c.display_name,
  c.description,
  c.description_html,
  c.category,
  c.banner_url,
  c.avatar_url,
  c.created_at,
  c.updated_at,
  c.created_by,
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

-- 4. Add comments for documentation
COMMENT ON COLUMN communities.banner_url IS 'Community banner image URL (recommended 1920x384px)';
COMMENT ON COLUMN communities.avatar_url IS 'Community icon/avatar URL (recommended 256x256px)';
COMMENT ON COLUMN communities.description_html IS 'Rich text HTML description of the community';
COMMENT ON COLUMN communities.created_by IS 'User ID of community creator (becomes first admin)';
