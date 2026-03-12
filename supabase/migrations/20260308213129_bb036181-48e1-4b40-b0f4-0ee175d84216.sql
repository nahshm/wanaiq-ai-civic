
-- Update create_community_with_channels to support visibility_type and is_mature
-- Remove channel creation since the seed_community_channels trigger handles it

CREATE OR REPLACE FUNCTION create_community_with_channels(
  p_name TEXT,
  p_display_name TEXT,
  p_description TEXT,
  p_category TEXT,
  p_user_id UUID,
  p_visibility_type TEXT DEFAULT 'public',
  p_is_mature BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_community_id UUID;
BEGIN
  -- 1. Insert community
  INSERT INTO communities (name, display_name, description, category, created_by, visibility_type, is_mature)
  VALUES (p_name, p_display_name, p_description, p_category, p_user_id, p_visibility_type, p_is_mature)
  RETURNING id INTO v_community_id;
  
  -- 2. Make user an admin of the community
  INSERT INTO community_moderators (community_id, user_id, role)
  VALUES (v_community_id, p_user_id, 'admin');
  
  -- 3. Add user as a member
  INSERT INTO community_members (community_id, user_id)
  VALUES (v_community_id, p_user_id);
  
  -- Channels are automatically seeded by the seed_community_channels trigger
  
  RETURN v_community_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_community_with_channels: %', SQLERRM;
    RETURN v_community_id;
END;
$$;

-- Update rate-limited wrapper to pass new params
CREATE OR REPLACE FUNCTION create_community_ratelimited(
  p_name TEXT,
  p_display_name TEXT,
  p_description TEXT,
  p_category TEXT,
  p_visibility_type TEXT DEFAULT 'public',
  p_is_mature BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_community_id UUID;
BEGIN
  -- Check rate limit: 3 communities per hour
  IF NOT check_rate_limit('create_community', 3, 60) THEN
    RETURN NULL;
  END IF;

  SELECT create_community_with_channels(
    p_name,
    p_display_name,
    p_description,
    p_category,
    auth.uid(),
    p_visibility_type,
    p_is_mature
  ) INTO v_community_id;

  RETURN v_community_id;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER
   SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION create_community_with_channels(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_community_ratelimited(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
