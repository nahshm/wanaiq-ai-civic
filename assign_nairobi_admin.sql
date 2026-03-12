DO $$
DECLARE
    v_user_id UUID := '66033a0b-3540-4ccd-988e-4ddae3057f8c';
    v_community_id UUID;
    v_community_name TEXT;
BEGIN
    -- 1. Find the community ID for c/Nairobi
    -- Tries 'county-nairobi' (standard format) first, then 'nairobi'
    SELECT id, name INTO v_community_id, v_community_name
    FROM public.communities
    WHERE name = 'county-nairobi' OR name = 'nairobi'
    ORDER BY CASE WHEN name = 'county-nairobi' THEN 1 ELSE 2 END
    LIMIT 1;

    IF v_community_id IS NULL THEN
        RAISE EXCEPTION 'Community c/Nairobi (county-nairobi or nairobi) not found';
    END IF;

    -- 2. Ensure they are a member first
    INSERT INTO public.community_members (community_id, user_id)
    VALUES (v_community_id, v_user_id)
    ON CONFLICT (community_id, user_id) DO NOTHING;

    -- 3. Assign Admin Role
    INSERT INTO public.community_moderators (community_id, user_id, role, permissions)
    VALUES (
        v_community_id, 
        v_user_id, 
        'admin',
        '{"can_manage_settings": true, "can_manage_moderators": true, "can_manage_channels": true, "can_manage_events": true, "can_manage_polls": true, "can_delete_posts": true, "can_ban_users": true}'::jsonb
    )
    ON CONFLICT (community_id, user_id) 
    DO UPDATE SET 
        role = 'admin',
        permissions = '{"can_manage_settings": true, "can_manage_moderators": true, "can_manage_channels": true, "can_manage_events": true, "can_manage_polls": true, "can_delete_posts": true, "can_ban_users": true}'::jsonb;

    RAISE NOTICE 'SUCCESS: User % assigned as Admin for Community % (%)', v_user_id, v_community_name, v_community_id;
END $$;
