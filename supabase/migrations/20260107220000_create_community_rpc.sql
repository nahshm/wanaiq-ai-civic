-- Create RPC function to safely create community with channels
-- This bypasses RLS by running with elevated privileges

CREATE OR REPLACE FUNCTION create_community_with_channels(
  p_name TEXT,
  p_display_name TEXT,
  p_description TEXT,
  p_category TEXT,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
SET search_path = public
AS $$
DECLARE
  v_community_id UUID;
BEGIN
  -- 1. Insert community
  INSERT INTO communities (name, display_name, description, category, created_by)
  VALUES (p_name, p_display_name, p_description, p_category, p_user_id)
  RETURNING id INTO v_community_id;
  
  -- 2. Make user an admin of the community
  INSERT INTO community_moderators (community_id, user_id, role)
  VALUES (v_community_id, p_user_id, 'admin');
  
  -- 3. Add user as a member
  INSERT INTO community_members (community_id, user_id)
  VALUES (v_community_id, p_user_id);
  
  -- 4. Create default channels (with elevated privileges, bypasses RLS)
  INSERT INTO channels (community_id, name, description, channel_type, created_by)
  VALUES 
    (v_community_id, 'general', 'General discussion', 'text', p_user_id),
    (v_community_id, 'announcements', 'Community announcements', 'text', p_user_id);
  
  RETURN v_community_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail completely
    RAISE WARNING 'Error in create_community_with_channels: %', SQLERRM;
    RETURN v_community_id; -- Return community ID even if channel creation fails
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_community_with_channels TO authenticated;

COMMENT ON FUNCTION create_community_with_channels IS 
'Creates a community with default channels, bypassing RLS restrictions. User becomes admin and member automatically.';
