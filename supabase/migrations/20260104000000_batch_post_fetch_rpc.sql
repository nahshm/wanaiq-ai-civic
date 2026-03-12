-- Batch fetch posts with user votes in a single query
-- This reduces the number of database roundtrips

CREATE OR REPLACE FUNCTION get_posts_with_votes(
  user_id_param UUID DEFAULT NULL,
  limit_param INTEGER DEFAULT 20,
  offset_param INTEGER DEFAULT 0,
  sort_by TEXT DEFAULT 'new'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  upvotes INTEGER,
  downvotes INTEGER,
  comment_count INTEGER,
  tags TEXT[],
  content_sensitivity TEXT,
  is_ngo_verified BOOLEAN,
  author_id UUID,
  author_username TEXT,
  author_display_name TEXT,
  author_avatar_url TEXT,
  author_is_verified BOOLEAN,
  author_role TEXT,
  community_id UUID,
  community_name TEXT,
  community_display_name TEXT,
  community_description TEXT,
  community_member_count INTEGER,
  community_category TEXT,
  user_vote TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.created_at,
    COALESCE(p.upvotes, 0)::INTEGER as upvotes,
    COALESCE(p.downvotes, 0)::INTEGER as downvotes,
    COALESCE(p.comment_count, 0)::INTEGER as comment_count,
    COALESCE(p.tags, '{}'::TEXT[]) as tags,
    COALESCE(p.content_sensitivity, 'public') as content_sensitivity,
    COALESCE(p.is_ngo_verified, false) as is_ngo_verified,
    pr.id as author_id,
    pr.username as author_username,
    pr.display_name as author_display_name,
    pr.avatar_url as author_avatar_url,
    COALESCE(pr.is_verified, false) as author_is_verified,
    COALESCE(pr.role, 'citizen') as author_role,
    c.id as community_id,
    c.name as community_name,
    c.display_name as community_display_name,
    c.description as community_description,
    COALESCE(c.member_count, 0)::INTEGER as community_member_count,
    c.category as community_category,
    v.vote_type as user_vote
  FROM posts p
  LEFT JOIN profiles pr ON pr.id = p.author_id
  LEFT JOIN communities c ON c.id = p.community_id
  LEFT JOIN votes v ON v.post_id = p.id AND v.user_id = user_id_param
  ORDER BY 
    CASE 
      WHEN sort_by = 'new' THEN p.created_at
      WHEN sort_by = 'top' THEN p.created_at -- We'll sort by upvotes in the next case
    END DESC,
    CASE 
      WHEN sort_by = 'top' THEN p.upvotes
      WHEN sort_by = 'hot' THEN (p.upvotes - p.downvotes) - EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600
    END DESC NULLS LAST
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_posts_with_votes TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_with_votes TO anon;

COMMENT ON FUNCTION get_posts_with_votes IS 'Fetches posts with author, community, and user vote data in a single query for better performance';
