-- 1. Fix trigger to auto-join user to ALL 3 tiers (county, constituency, ward)
CREATE OR REPLACE FUNCTION public.handle_location_community_creation()
RETURNS TRIGGER AS $$
DECLARE
    v_community_id UUID;
    v_county TEXT;
    v_constituency TEXT;
    v_ward TEXT;
BEGIN
    v_county := NEW.county;
    v_constituency := NEW.constituency;
    v_ward := NEW.ward;

    -- 1. County community: create + join
    IF v_county IS NOT NULL THEN
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value, country)
        VALUES (
            'county-' || lower(regexp_replace(v_county, '\s+', '-', 'g')),
            v_county || ' County',
            'Official community for residents of ' || v_county || ' County',
            'governance', 'location', 'county', v_county, 'kenya'
        )
        ON CONFLICT (location_type, location_value) WHERE type = 'location'
        DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_community_id;

        IF v_community_id IS NULL THEN
            SELECT id INTO v_community_id FROM public.communities
            WHERE location_type = 'county' AND location_value = v_county AND type = 'location';
        END IF;

        IF v_community_id IS NOT NULL THEN
            INSERT INTO public.community_members (user_id, community_id)
            VALUES (NEW.id, v_community_id)
            ON CONFLICT (user_id, community_id) DO NOTHING;
        END IF;
    END IF;

    -- 2. Constituency community: create + join
    IF v_constituency IS NOT NULL THEN
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value, country)
        VALUES (
            'constituency-' || lower(regexp_replace(v_constituency, '\s+', '-', 'g')),
            v_constituency || ' Constituency',
            'Official community for residents of ' || v_constituency || ' Constituency',
            'governance', 'location', 'constituency', v_constituency, 'kenya'
        )
        ON CONFLICT (location_type, location_value) WHERE type = 'location'
        DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_community_id;

        IF v_community_id IS NULL THEN
            SELECT id INTO v_community_id FROM public.communities
            WHERE location_type = 'constituency' AND location_value = v_constituency AND type = 'location';
        END IF;

        IF v_community_id IS NOT NULL THEN
            INSERT INTO public.community_members (user_id, community_id)
            VALUES (NEW.id, v_community_id)
            ON CONFLICT (user_id, community_id) DO NOTHING;
        END IF;
    END IF;

    -- 3. Ward community: create + join + temporary admin
    IF v_ward IS NOT NULL THEN
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value, country)
        VALUES (
            'ward-' || lower(regexp_replace(v_ward, '\s+', '-', 'g')),
            v_ward || ' Ward',
            'Official community for residents of ' || v_ward || ' Ward',
            'governance', 'location', 'ward', v_ward, 'kenya'
        )
        ON CONFLICT (location_type, location_value) WHERE type = 'location'
        DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_community_id;

        IF v_community_id IS NULL THEN
            SELECT id INTO v_community_id FROM public.communities
            WHERE location_type = 'ward' AND location_value = v_ward AND type = 'location';
        END IF;

        IF v_community_id IS NOT NULL THEN
            INSERT INTO public.community_members (user_id, community_id)
            VALUES (NEW.id, v_community_id)
            ON CONFLICT (user_id, community_id) DO NOTHING;

            INSERT INTO public.community_moderators (
                user_id, community_id, role, is_temporary, term_expires_at, permissions
            )
            VALUES (
                NEW.id, v_community_id, 'admin', true,
                NOW() + INTERVAL '30 days',
                '{"can_manage_settings": true, "can_manage_moderators": true, "can_manage_channels": true, "can_manage_events": true, "can_manage_polls": true, "can_delete_posts": true, "can_ban_users": true}'::jsonb
            )
            ON CONFLICT (community_id, user_id) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill: join existing users to their missing location communities
INSERT INTO public.community_members (user_id, community_id)
SELECT p.id, c.id
FROM public.profiles p
JOIN public.communities c ON c.type = 'location'
  AND (
    (c.location_type = 'county' AND c.location_value = p.county)
    OR (c.location_type = 'constituency' AND c.location_value = p.constituency)
    OR (c.location_type = 'ward' AND c.location_value = p.ward)
  )
WHERE p.county IS NOT NULL
  AND p.onboarding_completed = true
ON CONFLICT (user_id, community_id) DO NOTHING;