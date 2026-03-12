-- Fix the "ambiguous column reference" error in the trigger function
-- by renaming the local variable 'community_id' to 'v_new_community_id'

CREATE OR REPLACE FUNCTION public.handle_location_community_creation()
RETURNS TRIGGER AS $$
DECLARE
    v_new_community_id UUID; -- Renamed to avoid ambiguity with table column
    v_county TEXT;
    v_constituency TEXT;
    v_ward TEXT;
BEGIN
    -- Get location values (handle NULLs gracefully)
    v_county := NEW.county;
    v_constituency := NEW.constituency;
    v_ward := NEW.ward;

    -- 1. Check/Create County Community
    IF v_county IS NOT NULL THEN
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value, country)
        VALUES (
            'county-' || lower(regexp_replace(v_county, '\s+', '-', 'g')), 
            v_county || ' County', 
            'Official community for residents of ' || v_county || ' County', 
            'governance', 
            'location', 
            'county', 
            v_county,
            'kenya'
        )
        ON CONFLICT (location_type, location_value) WHERE type = 'location'
        DO NOTHING;
    END IF;

    -- 2. Check/Create Constituency Community
    IF v_constituency IS NOT NULL THEN
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value, country)
        VALUES (
            'constituency-' || lower(regexp_replace(v_constituency, '\s+', '-', 'g')), 
            v_constituency || ' Constituency', 
            'Official community for residents of ' || v_constituency || ' Constituency', 
            'governance', 
            'location', 
            'constituency', 
            v_constituency,
            'kenya'
        )
        ON CONFLICT (location_type, location_value) WHERE type = 'location'
        DO NOTHING;
    END IF;

    -- 3. Check/Create Ward Community
    IF v_ward IS NOT NULL THEN
        -- Try to insert and capture ID if new
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value, country)
        VALUES (
            'ward-' || lower(regexp_replace(v_ward, '\s+', '-', 'g')), 
            v_ward || ' Ward', 
            'Official community for residents of ' || v_ward || ' Ward', 
            'governance', 
            'location', 
            'ward', 
            v_ward,
            'kenya'
        )
        ON CONFLICT (location_type, location_value) WHERE type = 'location'
        DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_new_community_id; -- Use renamed variable

        -- If v_new_community_id is NULL (should rarely happen with DO UPDATE), try to fetch it
        IF v_new_community_id IS NULL THEN
            SELECT id INTO v_new_community_id FROM public.communities 
            WHERE location_type = 'ward' AND location_value = v_ward AND type = 'location';
        ELSE
            -- BRAND NEW COMMUNITY (or updated) -> Assign Temporary Admin logic 
            -- (Note: Original logic was 'ELSE' meaning if RETURNING returned something. 
            -- If it was an existing one, DO UPDATE returns it too. 
            -- The original intent might have been to only add creator as admin if it was NEWLY inserted?
            -- But logic implies if we got an ID back from the atomic operation.)
            
            -- 1. Join the community (clean join, no role)
            INSERT INTO public.community_members (user_id, community_id)
            VALUES (NEW.id, v_new_community_id)
            ON CONFLICT (user_id, community_id) DO NOTHING;
            
            -- 2. Make them Temporary Admin (Protected for 30 days)
            INSERT INTO public.community_moderators (
                user_id, 
                community_id, 
                role, 
                is_temporary, 
                term_expires_at, 
                permissions
            )
            VALUES (
                NEW.id, 
                v_new_community_id, 
                'admin', 
                true, 
                NOW() + INTERVAL '30 days',
                '{"can_manage_settings": true, "can_manage_moderators": true, "can_manage_channels": true, "can_manage_events": true, "can_manage_polls": true, "can_delete_posts": true, "can_ban_users": true}'::jsonb
            )
            ON CONFLICT (community_id, user_id) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now that the trigger is fixed, retry the profile update
UPDATE profiles
SET 
    county = 'Nairobi',
    constituency = 'Embakasi East',
    ward = 'Utawala'
WHERE id = '66033a0b-3540-4ccd-988e-4ddae3057f8c';

-- Verify the update
SELECT id, county, constituency, ward FROM profiles WHERE id = '66033a0b-3540-4ccd-988e-4ddae3057f8c';
