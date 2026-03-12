-- Function to compute and update leaderboard scores
-- Run this periodically (e.g., via cron job or manual trigger)

CREATE OR REPLACE FUNCTION public.compute_leaderboard_scores()
RETURNS void AS $$
BEGIN
    -- Delete existing scores for recalculation
    DELETE FROM public.leaderboard_scores;

    -- Compute all-time national leaderboard
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT 
        user_id,
        NULL as location_type,
        NULL as location_value,
        'all_time' as period,
        SUM(action_value) as total_points,
        ROW_NUMBER() OVER (ORDER BY SUM(action_value) DESC) as rank
    FROM public.user_actions
    GROUP BY user_id
    HAVING SUM(action_value) > 0;

    -- Compute monthly national leaderboard
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT 
        user_id,
        NULL as location_type,
        NULL as location_value,
        'monthly' as period,
        SUM(action_value) as total_points,
        ROW_NUMBER() OVER (ORDER BY SUM(action_value) DESC) as rank
    FROM public.user_actions
    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY user_id
    HAVING SUM(action_value) > 0;

    -- Compute weekly national leaderboard
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT 
        user_id,
        NULL as location_type,
        NULL as location_value,
        'weekly' as period,
        SUM(action_value) as total_points,
        ROW_NUMBER() OVER (ORDER BY SUM(action_value) DESC) as rank
    FROM public.user_actions
    WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
    GROUP BY user_id
    HAVING SUM(action_value) > 0;

    -- Compute location-based leaderboards (ward/constituency/county)
    -- All-time ward rankings
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT 
        ua.user_id,
        'ward' as location_type,
        p.ward as location_value,
        'all_time' as period,
        SUM(ua.action_value) as total_points,
        ROW_NUMBER() OVER (PARTITION BY p.ward ORDER BY SUM(ua.action_value) DESC) as rank
    FROM public.user_actions ua
    JOIN public.profiles p ON ua.user_id = p.id
    WHERE p.ward IS NOT NULL
    GROUP BY ua.user_id, p.ward
    HAVING SUM(ua.action_value) > 0;

    -- All-time constituency rankings
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT 
        ua.user_id,
        'constituency' as location_type,
        p.constituency as location_value,
        'all_time' as period,
        SUM(ua.action_value) as total_points,
        ROW_NUMBER() OVER (PARTITION BY p.constituency ORDER BY SUM(ua.action_value) DESC) as rank
    FROM public.user_actions ua
    JOIN public.profiles p ON ua.user_id = p.id
    WHERE p.constituency IS NOT NULL
    GROUP BY ua.user_id, p.constituency
    HAVING SUM(ua.action_value) > 0;

    -- All-time county rankings
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT 
        ua.user_id,
        'county' as location_type,
        p.county as location_value,
        'all_time' as period,
        SUM(ua.action_value) as total_points,
        ROW_NUMBER() OVER (PARTITION BY p.county ORDER BY SUM(ua.action_value) DESC) as rank
    FROM public.user_actions ua
    JOIN public.profiles p ON ua.user_id = p.id
    WHERE p.county IS NOT NULL
    GROUP BY ua.user_id, p.county
    HAVING SUM(ua.action_value) > 0;

    RAISE NOTICE 'Leaderboard scores computed successfully';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.compute_leaderboard_scores() TO authenticated;

-- Run initial computation
SELECT public.compute_leaderboard_scores();
