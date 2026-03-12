-- Drop BOTH overloaded versions to resolve PGRST203
DROP FUNCTION IF EXISTS public.get_unified_feed(uuid, integer, integer, text, uuid);
DROP FUNCTION IF EXISTS public.get_unified_feed(uuid, uuid, integer, integer, text);

-- Recreate as a single function with all params having defaults
CREATE OR REPLACE FUNCTION public.get_unified_feed(
  p_user_id uuid DEFAULT NULL,
  p_community_id uuid DEFAULT NULL,
  p_limit_count integer DEFAULT 20,
  p_offset_count integer DEFAULT 0,
  p_sort_by text DEFAULT 'hot'
)
RETURNS TABLE(id uuid, type text, data json, created_at timestamptz, user_id uuid, username text, avatar_url text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH combined_feed AS (
    -- Posts
    SELECT
      p.id,
      'post'::text AS type,
      p.author_id AS user_id,
      prof.username,
      prof.avatar_url,
      p.created_at,
      json_build_object(
        'id', p.id,
        'title', p.title,
        'content', p.content,
        'content_type', p.content_type,
        'community_id', p.community_id,
        'community_name', c.name,
        'community_display_name', c.display_name,
        'community_icon', c.avatar_url,
        'upvotes', p.upvotes,
        'downvotes', p.downvotes,
        'comment_count', p.comment_count,
        'author_id', p.author_id,
        'created_at', p.created_at,
        'tags', p.tags,
        'link_url', p.link_url,
        'link_title', p.link_title,
        'link_description', p.link_description,
        'link_image', p.link_image,
        'media', (
          SELECT COALESCE(json_agg(json_build_object(
            'id', pm.id,
            'file_path', pm.file_path,
            'file_type', pm.file_type
          )), '[]'::json)
          FROM post_media pm
          WHERE pm.post_id = p.id
        )
      ) AS data,
      (p.upvotes - p.downvotes) AS score,
      (p.upvotes - p.downvotes) * EXP(-0.003 * EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600) AS hot_score,
      COALESCE(p.comment_count, 0) AS activity_count
    FROM posts p
    LEFT JOIN profiles prof ON prof.id = p.author_id
    LEFT JOIN communities c ON c.id = p.community_id
    WHERE p.is_hidden IS NOT TRUE
      AND (p_community_id IS NULL OR p.community_id = p_community_id)

    UNION ALL

    -- Government Projects (national feed only)
    SELECT
      pr.id,
      'project'::text AS type,
      pr.created_by AS user_id,
      prof.username,
      prof.avatar_url,
      pr.created_at,
      json_build_object(
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
      ) AS data,
      0 AS score,
      0 AS hot_score,
      0 AS activity_count
    FROM government_projects pr
    LEFT JOIN profiles prof ON pr.created_by = prof.id
    WHERE p_community_id IS NULL

    UNION ALL

    -- Feed Activities (national feed only)
    SELECT
      fa.id,
      fa.activity_type AS type,
      fa.user_id,
      prof.username,
      prof.avatar_url,
      fa.created_at,
      json_build_object(
        'id', fa.id,
        'activity_type', fa.activity_type,
        'target_id', fa.target_id,
        'target_type', fa.target_type,
        'metadata', fa.metadata,
        'user_id', fa.user_id,
        'created_at', fa.created_at
      ) AS data,
      0 AS score,
      0 AS hot_score,
      0 AS activity_count
    FROM feed_activities fa
    LEFT JOIN profiles prof ON fa.user_id = prof.id
    WHERE fa.is_public = true
      AND p_community_id IS NULL
  )
  SELECT
    cf.id,
    cf.type,
    cf.data,
    cf.created_at,
    cf.user_id,
    cf.username,
    cf.avatar_url
  FROM combined_feed cf
  ORDER BY
    CASE WHEN p_sort_by = 'newest' OR p_sort_by = 'new' THEN cf.created_at END DESC,
    CASE WHEN p_sort_by = 'top'    THEN cf.score END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'hot'    THEN cf.hot_score END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'rising' THEN cf.activity_count END DESC NULLS LAST,
    cf.created_at DESC
  LIMIT p_limit_count
  OFFSET p_offset_count;
END;
$function$;