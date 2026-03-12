-- Community Recommendation System
-- Recommends communities based on user location, interests, and activity patterns

-- Function to recommend communities for a user
CREATE OR REPLACE FUNCTION recommend_communities(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    display_name TEXT,
    description TEXT,
    avatar_url TEXT,
    member_count INTEGER,
    weekly_visitors INTEGER,
    weekly_contributions INTEGER,
    recommendation_score DECIMAL,
    recommendation_reason TEXT
) AS $$
DECLARE
    user_county_id UUID;
    user_constituency_id UUID;
    user_ward_id UUID;
BEGIN
    -- Get user's location IDs
    SELECT county_id, constituency_id, ward_id
    INTO user_county_id, user_constituency_id, user_ward_id
    FROM profiles
    WHERE profiles.id = p_user_id;

    RETURN QUERY
    WITH 
    -- Get communities user hasn't joined
    not_joined AS (
        SELECT c.id
        FROM communities c
        WHERE NOT EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = c.id AND cm.user_id = p_user_id
        )
    ),
    -- Get communities where user's connections are members
    connection_communities AS (
        SELECT 
            cm.community_id,
            COUNT(*) as connection_count
        FROM community_members cm
        JOIN followers f ON f.following_id = cm.user_id
        WHERE f.follower_id = p_user_id
        GROUP BY cm.community_id
    ),
    -- Calculate scores
    scored_communities AS (
        SELECT 
            c.id,
            c.name,
            c.display_name,
            c.description,
            c.avatar_url,
            COALESCE(c.member_count, 0) as member_count,
            COALESCE(get_weekly_visitors(c.id), 0) as weekly_visitors,
            COALESCE(get_weekly_contributions(c.id), 0) as weekly_contributions,
            -- Score calculation
            (
                -- Location match (highest priority for civic platform)
                CASE 
                    WHEN c.location_type = 'ward' AND c.location_value::uuid = user_ward_id THEN 100
                    WHEN c.location_type = 'constituency' AND c.location_value::uuid = user_constituency_id THEN 80
                    WHEN c.location_type = 'county' AND c.location_value::uuid = user_county_id THEN 60
                    ELSE 0
                END
                -- Activity bonus (active communities preferred)
                + LEAST(COALESCE(get_weekly_contributions(c.id), 0) * 2, 30)
                -- Size bonus (larger communities have more content)
                + LEAST(COALESCE(c.member_count, 0) / 10, 20)
                -- Connection bonus (friends are there)
                + COALESCE(cc.connection_count * 5, 0)
            )::DECIMAL as score,
            -- Reason for recommendation
            CASE 
                WHEN c.location_type = 'ward' AND c.location_value::uuid = user_ward_id THEN 'In your ward'
                WHEN c.location_type = 'constituency' AND c.location_value::uuid = user_constituency_id THEN 'In your constituency'
                WHEN c.location_type = 'county' AND c.location_value::uuid = user_county_id THEN 'In your county'
                WHEN cc.connection_count > 0 THEN format('%s people you follow are here', cc.connection_count)
                WHEN COALESCE(get_weekly_contributions(c.id), 0) > 10 THEN 'Active community'
                ELSE 'Popular community'
            END as reason
        FROM communities c
        JOIN not_joined nj ON nj.id = c.id
        LEFT JOIN connection_communities cc ON cc.community_id = c.id
    )
    SELECT 
        sc.id,
        sc.name,
        sc.display_name,
        sc.description,
        sc.avatar_url,
        sc.member_count,
        sc.weekly_visitors,
        sc.weekly_contributions,
        sc.score as recommendation_score,
        sc.reason as recommendation_reason
    FROM scored_communities sc
    WHERE sc.score > 0
    ORDER BY sc.score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION recommend_communities(UUID, INTEGER) TO authenticated;
