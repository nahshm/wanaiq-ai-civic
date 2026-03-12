-- Add GIN index on vectors.content for full-text search fallback
CREATE INDEX IF NOT EXISTS idx_vectors_content_fts 
ON public.vectors USING gin(to_tsvector('english', content));

-- Create full-text search fallback function
CREATE OR REPLACE FUNCTION public.match_documents_fts(
  search_query text,
  match_count int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    v.id,
    v.content,
    v.metadata,
    ts_rank(to_tsvector('english', v.content), plainto_tsquery('english', search_query))::float as similarity
  FROM vectors v
  WHERE to_tsvector('english', v.content) @@ plainto_tsquery('english', search_query)
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.match_documents_fts(text, int) TO authenticated;