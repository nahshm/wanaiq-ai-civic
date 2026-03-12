-- Database Performance Optimization for Home Feed
-- Adds indexes and materialized views to improve performance

-- =====================
-- POSTS TABLE INDEXES
-- =====================

-- Index for created_at DESC (New feed)
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc 
ON public.posts(created_at DESC);

-- Index for upvotes DESC (Top feed)
CREATE INDEX IF NOT EXISTS idx_posts_upvotes_desc 
ON public.posts(upvotes DESC);

-- Index for community_id (filtering by community)
CREATE INDEX IF NOT EXISTS idx_posts_community_id 
ON public.posts(community_id) 
WHERE community_id IS NOT NULL;

-- Composite index for hot/rising calculations
CREATE INDEX IF NOT EXISTS idx_posts_hot_score 
ON public.posts(created_at DESC, upvotes DESC, comment_count DESC);

-- Index for author lookups
CREATE INDEX IF NOT EXISTS idx_posts_author_id 
ON public.posts(author_id);

-- =====================
-- FULL TEXT SEARCH
-- =====================

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for title fuzzy search
CREATE INDEX IF NOT EXISTS idx_posts_title_trgm 
ON public.posts USING gin (title gin_trgm_ops);

-- GIN index for content fuzzy search
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm 
ON public.posts USING gin (content gin_trgm_ops);

-- Composite GIN index for combined search
CREATE INDEX IF NOT EXISTS idx_posts_search 
ON public.posts USING gin (to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- =====================
-- COMMENTS INDEXES
-- =====================

-- Index for post_id (loading comments for a post)
CREATE INDEX IF NOT EXISTS idx_comments_post_id 
ON public.comments(post_id);

-- Index for parent_id (threaded comments)
CREATE INDEX IF NOT EXISTS idx_comments_parent_id 
ON public.comments(parent_id) 
WHERE parent_id IS NOT NULL;

-- Index for created_at (comment ordering)
CREATE INDEX IF NOT EXISTS idx_comments_created_at 
ON public.comments(created_at DESC);

-- =====================
-- VOTES INDEXES
-- =====================

-- Composite index for user votes (checking if user voted)
CREATE INDEX IF NOT EXISTS idx_votes_user_post 
ON public.votes(user_id, post_id);

-- Index for post_id (aggregating votes)
CREATE INDEX IF NOT EXISTS idx_votes_post_id 
ON public.votes(post_id);

-- =====================
-- COMMUNITIES INDEXES
-- =====================

-- Index for member_count DESC (popular communities)
CREATE INDEX IF NOT EXISTS idx_communities_member_count 
ON public.communities(member_count DESC);

-- Index for name (lookups)
CREATE INDEX IF NOT EXISTS idx_communities_name 
ON public.communities(name);

-- =====================
-- PROFILES INDEXES
-- =====================

-- Index for username (lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON public.profiles(username) 
WHERE username IS NOT NULL;

-- Index for display_name (search)
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm 
ON public.profiles USING gin (display_name gin_trgm_ops) 
WHERE display_name IS NOT NULL;

-- =====================
-- MATERIALIZED VIEW: TRENDING POSTS
-- =====================

-- Drop existing view if exists
DROP MATERIALIZED VIEW IF EXISTS trending_posts;

-- Create materialized view for trending/hot posts
CREATE MATERIALIZED VIEW trending_posts AS
SELECT 
  p.id,
  p.title,
  p.author_id,
  p.community_id,
  p.created_at,
  p.upvotes,
  p.downvotes,
  p.comment_count,
  -- Hot score: upvotes + comments - time penalty
  (p.upvotes + p.comment_count - 
   EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600
  ) as hot_score,
  -- Rising score: (upvotes - downvotes) / age in hours
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - p.created_at)) > 0 THEN
      (p.upvotes - p.downvotes)::float / 
      GREATEST(1, EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600)
    ELSE 0
  END as rising_score
FROM posts p
WHERE 
  p.created_at > NOW() - INTERVAL '7 days' -- Only last 7 days
  AND p.upvotes >= 0 -- Filter spam/heavily downvoted
ORDER BY hot_score DESC
LIMIT 500; -- Top 500 trending posts

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_trending_posts_id ON trending_posts(id);

-- Create indexes on scores for fast sorting
CREATE INDEX idx_trending_posts_hot_score ON trending_posts(hot_score DESC);
CREATE INDEX idx_trending_posts_rising_score ON trending_posts(rising_score DESC);

-- =====================
-- MATERIALIZED VIEW: POPULAR COMMUNITIES
-- =====================

DROP MATERIALIZED VIEW IF EXISTS popular_communities;

CREATE MATERIALIZED VIEW popular_communities AS
SELECT 
  c.id,
  c.name,
  c.display_name,
  c.description,
  c.member_count,
  c.category,
  c.created_at,
  -- Activity score: recent posts + member growth
  (
    COALESCE(recent_posts.count, 0) + 
    (c.member_count / 10)
  ) as activity_score
FROM communities c
LEFT JOIN (
  SELECT 
    community_id,
    COUNT(*) as count
  FROM posts
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY community_id
) recent_posts ON c.id = recent_posts.community_id
WHERE c.member_count > 0
ORDER BY activity_score DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_popular_communities_id ON popular_communities(id);
CREATE INDEX idx_popular_communities_activity ON popular_communities(activity_score DESC);

-- =====================
-- REFRESH SCHEDULE
-- =====================

-- Note: Set up pg_cron or external scheduler to refresh these views
-- Example SQL for hourly refresh:
-- SELECT cron.schedule('refresh-trending', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY trending_posts');
-- SELECT cron.schedule('refresh-popular', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY popular_communities');

-- Manual refresh (run after migration):
REFRESH MATERIALIZED VIEW trending_posts;
REFRESH MATERIALIZED VIEW popular_communities;

-- =====================
-- ANALYZE FOR QUERY PLANNER
-- =====================

-- Update table statistics for better query planning
ANALYZE posts;
ANALYZE comments;
ANALYZE votes;
ANALYZE communities;
ANALYZE profiles;
