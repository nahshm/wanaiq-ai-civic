-- Verify and refresh materialized views after migration
-- Run this to populate the views with initial data

-- Refresh the materialized views
REFRESH MATERIALIZED VIEW trending_posts;
REFRESH MATERIALIZED VIEW popular_communities;

-- Verify trending posts view has data
SELECT 
  COUNT(*) as trending_posts_count,
  'Trending posts populated' as status
FROM trending_posts;

-- Verify popular communities view has data
SELECT 
  COUNT(*) as popular_communities_count,
  'Popular communities populated' as status
FROM popular_communities;

-- Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('posts', 'comments', 'votes', 'communities', 'profiles')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verify RLS policies on profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test search performance (should be fast now)
EXPLAIN ANALYZE
SELECT id, title, content
FROM posts
WHERE title ILIKE '%kenya%' OR content ILIKE '%kenya%'
LIMIT 10;
