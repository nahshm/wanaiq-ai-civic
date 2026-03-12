-- Fix Function Search Path Mutable security issue
-- Adding SET search_path = public to all functions that are missing it

-- calculate_goat_level
ALTER FUNCTION public.calculate_goat_level(p_xp integer)
SET search_path = public;

-- calculate_impact_rating (SECURITY DEFINER - important to fix)
ALTER FUNCTION public.calculate_impact_rating(p_user_id uuid)
SET search_path = public;

-- get_channel_analytics
ALTER FUNCTION public.get_channel_analytics(p_channel_id uuid)
SET search_path = public;

-- get_posts_with_votes
ALTER FUNCTION public.get_posts_with_votes(user_id_param uuid, limit_param integer, offset_param integer, sort_by text)
SET search_path = public;

-- get_weekly_contributions (fixed signature)
ALTER FUNCTION public.get_weekly_contributions(community_uuid uuid)
SET search_path = public;

-- get_weekly_visitors (fixed signature)
ALTER FUNCTION public.get_weekly_visitors(community_uuid uuid)
SET search_path = public;

-- handle_location_community_creation
ALTER FUNCTION public.handle_location_community_creation()
SET search_path = public;

-- increment_channel_metric (fixed signature)
ALTER FUNCTION public.increment_channel_metric(p_channel_id uuid, p_metric text)
SET search_path = public;

-- log_community_visit
ALTER FUNCTION public.log_community_visit(p_community_id uuid)
SET search_path = public;

-- log_promise_creation
ALTER FUNCTION public.log_promise_creation()
SET search_path = public;

-- log_verification_vote
ALTER FUNCTION public.log_verification_vote()
SET search_path = public;

-- prevent_locked_channel_deletion
ALTER FUNCTION public.prevent_locked_channel_deletion()
SET search_path = public;

-- recommend_communities
ALTER FUNCTION public.recommend_communities(p_user_id uuid, p_limit integer)
SET search_path = public;

-- seed_community_channels
ALTER FUNCTION public.seed_community_channels()
SET search_path = public;

-- sync_official_verification
ALTER FUNCTION public.sync_official_verification()
SET search_path = public;

-- update_administrative_division_timestamp
ALTER FUNCTION public.update_administrative_division_timestamp()
SET search_path = public;

-- update_endorsement_count
ALTER FUNCTION public.update_endorsement_count()
SET search_path = public;

-- update_government_institution_timestamp
ALTER FUNCTION public.update_government_institution_timestamp()
SET search_path = public;

-- update_project_verification_count
ALTER FUNCTION public.update_project_verification_count()
SET search_path = public;

-- update_sentiment_counts
ALTER FUNCTION public.update_sentiment_counts()
SET search_path = public;

-- update_thread_reply_count
ALTER FUNCTION public.update_thread_reply_count()
SET search_path = public;

-- update_updated_at_column
ALTER FUNCTION public.update_updated_at_column()
SET search_path = public;

-- update_verification_truth_score
ALTER FUNCTION public.update_verification_truth_score()
SET search_path = public;

-- validate_project_location
ALTER FUNCTION public.validate_project_location()
SET search_path = public;