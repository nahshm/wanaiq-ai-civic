


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq" WITH SCHEMA "pgmq";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgrouting" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE TYPE "public"."activity_type_enum" AS ENUM (
    'post_created',
    'project_submitted',
    'project_verified',
    'promise_tracked',
    'promise_updated',
    'quest_completed',
    'community_joined',
    'community_created',
    'clip_uploaded',
    'issue_reported',
    'official_claimed',
    'achievement_earned',
    'comment_created',
    'vote_cast'
);


ALTER TYPE "public"."activity_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'moderator',
    'official',
    'expert',
    'journalist',
    'citizen',
    'super_admin'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."content_type" AS ENUM (
    'text',
    'video',
    'image',
    'poll',
    'live'
);


ALTER TYPE "public"."content_type" OWNER TO "postgres";


CREATE TYPE "public"."official_level" AS ENUM (
    'executive',
    'governor',
    'senator',
    'mp',
    'women_rep',
    'mca'
);


ALTER TYPE "public"."official_level" OWNER TO "postgres";


CREATE TYPE "public"."promise_status" AS ENUM (
    'completed',
    'ongoing',
    'not_started',
    'cancelled'
);


ALTER TYPE "public"."promise_status" OWNER TO "postgres";


CREATE TYPE "public"."user_persona" AS ENUM (
    'active_citizen',
    'community_organizer',
    'civic_learner',
    'government_watcher',
    'professional',
    'youth_leader',
    'ngo_worker',
    'journalist',
    'business_owner'
);


ALTER TYPE "public"."user_persona" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."acknowledge_warning"("p_warning_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  UPDATE user_warnings
  SET acknowledged = true, acknowledged_at = NOW()
  WHERE id = p_warning_id
    AND user_id = auth.uid()
    AND acknowledged = false;
$$;


ALTER FUNCTION "public"."acknowledge_warning"("p_warning_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."agent_hide_comment"("p_comment_id" "uuid", "p_agent" "text", "p_reason" "text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  UPDATE comments
  SET is_hidden = true, hidden_reason = p_reason, hidden_by_agent = p_agent
  WHERE id = p_comment_id AND is_hidden = false;
$$;


ALTER FUNCTION "public"."agent_hide_comment"("p_comment_id" "uuid", "p_agent" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."agent_hide_post"("p_post_id" "uuid", "p_agent" "text", "p_reason" "text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  UPDATE posts
  SET is_hidden = true, hidden_reason = p_reason, hidden_by_agent = p_agent
  WHERE id = p_post_id AND is_hidden = false;
$$;


ALTER FUNCTION "public"."agent_hide_post"("p_post_id" "uuid", "p_agent" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_create_office_for_position"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO offices (position_id, position_code, country_code, governance_level, jurisdiction_name)
  VALUES (NEW.id, NEW.position_code, NEW.country_code, NEW.governance_level, NEW.jurisdiction_name)
  ON CONFLICT (position_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_create_office_for_position"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_link_positions_to_community"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.type = 'location' AND NEW.location_type IS NOT NULL AND NEW.location_value IS NOT NULL THEN
    INSERT INTO position_communities (position_id, community_id, access_level)
    SELECT gp.id, NEW.id, 'read'
    FROM government_positions gp
    WHERE LOWER(gp.governance_level) = LOWER(NEW.location_type)
      AND LOWER(gp.jurisdiction_name) LIKE '%' || LOWER(NEW.location_value) || '%'
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_link_positions_to_community"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_comment_karma"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  comment_karma INTEGER := 0;
BEGIN
  SELECT COALESCE(FLOOR((SUM(upvotes) - SUM(downvotes)) / 10.0), 0)::INTEGER INTO comment_karma
  FROM public.comments
  WHERE author_id = user_uuid;
  RETURN comment_karma;
END;
$$;


ALTER FUNCTION "public"."calculate_comment_karma"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_goat_level"("p_xp" integer) RETURNS TABLE("level" integer, "title" "text")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT gl.level, gl.title
    FROM goat_levels gl
    WHERE gl.xp_required <= p_xp
    ORDER BY gl.xp_required DESC
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."calculate_goat_level"("p_xp" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_impact_rating"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_actions_score INTEGER := 0;
    v_resolution_score INTEGER := 0;
    v_community_score INTEGER := 0;
    v_reliability_score INTEGER := 0;
    v_total_score INTEGER := 0;
    v_actions_count INTEGER;
    v_resolved_count INTEGER;
    v_endorsements_received INTEGER;
    v_verified_expertise_count INTEGER;
BEGIN
    -- Calculate actions score (max 30 points)
    SELECT COUNT(*) INTO v_actions_count
    FROM civic_actions WHERE user_id = p_user_id;
    v_actions_score := LEAST(v_actions_count * 2, 30);
    
    -- Calculate resolution score (max 30 points)
    SELECT COUNT(*) INTO v_resolved_count
    FROM civic_actions WHERE user_id = p_user_id AND status = 'resolved';
    v_resolution_score := LEAST(v_resolved_count * 5, 30);
    
    -- Calculate community score (max 25 points)
    SELECT COALESCE(SUM(endorsement_count), 0) INTO v_endorsements_received
    FROM user_expertise WHERE user_id = p_user_id;
    v_community_score := LEAST(v_endorsements_received, 25);
    
    -- Calculate reliability score (max 15 points)
    SELECT COUNT(*) INTO v_verified_expertise_count
    FROM user_expertise WHERE user_id = p_user_id AND is_verified = true;
    v_reliability_score := LEAST(v_verified_expertise_count * 5, 15);
    
    -- Total (max 100)
    v_total_score := v_actions_score + v_resolution_score + v_community_score + v_reliability_score;
    
    -- Update civic_impact_scores
    INSERT INTO civic_impact_scores (
        user_id, impact_rating, actions_score, resolution_score, 
        community_score, reliability_score, calculated_at, updated_at
    )
    VALUES (
        p_user_id, v_total_score, v_actions_score, v_resolution_score,
        v_community_score, v_reliability_score, NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        impact_rating = v_total_score,
        actions_score = v_actions_score,
        resolution_score = v_resolution_score,
        community_score = v_community_score,
        reliability_score = v_reliability_score,
        calculated_at = NOW(),
        updated_at = NOW();
    
    RETURN v_total_score;
END;
$$;


ALTER FUNCTION "public"."calculate_impact_rating"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_post_karma"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  post_karma INTEGER := 0;
BEGIN
  SELECT COALESCE(FLOOR((SUM(upvotes) - SUM(downvotes)) / 10.0), 0)::INTEGER INTO post_karma
  FROM public.posts
  WHERE author_id = user_uuid;
  RETURN post_karma;
END;
$$;


ALTER FUNCTION "public"."calculate_post_karma"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_user_karma"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN calculate_post_karma(user_uuid) + calculate_comment_karma(user_uuid);
END;
$$;


ALTER FUNCTION "public"."calculate_user_karma"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_award_achievements"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF (SELECT COUNT(*) FROM civic_actions WHERE user_id = NEW.user_id) = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description)
    VALUES (NEW.user_id, 'first_issue', 'Community Guardian', 'Reported your first civic issue')
    ON CONFLICT DO NOTHING;
  END IF;
  IF (SELECT COUNT(*) FROM civic_actions WHERE user_id = NEW.user_id) = 5 THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description)
    VALUES (NEW.user_id, 'issue_hunter', 'Issue Hunter', 'Reported 5 civic issues')
    ON CONFLICT DO NOTHING;
  END IF;
  IF (SELECT COUNT(*) FROM civic_actions WHERE user_id = NEW.user_id) = 10 THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description)
    VALUES (NEW.user_id, 'community_champion', 'Community Champion', 'Reported 10 civic issues')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_and_award_achievements"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_badge_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_badge_id UUID;
    v_current_count INTEGER;
    v_required_count INTEGER;
BEGIN
    IF NEW.action_type = 'fact_check_submitted' THEN
        SELECT COUNT(*) INTO v_current_count
        FROM public.user_actions
        WHERE user_id = NEW.user_id AND action_type = 'fact_check_submitted';
        FOR v_badge_id, v_required_count IN 
            SELECT b.id, (b.requirements->>'count')::INTEGER
            FROM public.badges b
            WHERE b.category = 'fact_checker' AND b.is_active = TRUE
        LOOP
            IF v_current_count >= v_required_count THEN
                INSERT INTO public.user_badges (user_id, badge_id, progress)
                VALUES (NEW.user_id, v_badge_id, v_current_count)
                ON CONFLICT (user_id, badge_id) DO UPDATE SET progress = v_current_count;
            END IF;
        END LOOP;
    END IF;
    IF NEW.action_type = 'project_submitted' THEN
        SELECT COUNT(*) INTO v_current_count
        FROM public.user_actions
        WHERE user_id = NEW.user_id AND action_type = 'project_submitted';
        FOR v_badge_id, v_required_count IN 
            SELECT b.id, (b.requirements->>'count')::INTEGER
            FROM public.badges b
            WHERE b.category = 'community_reporter' AND b.is_active = TRUE
        LOOP
            IF v_current_count >= v_required_count THEN
                INSERT INTO public.user_badges (user_id, badge_id, progress)
                VALUES (NEW.user_id, v_badge_id, v_current_count)
                ON CONFLICT (user_id, badge_id) DO UPDATE SET progress = v_current_count;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_badge_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("p_action" "text", "p_max_requests" integer DEFAULT 10, "p_window_minutes" integer DEFAULT 1) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_user_id UUID;
  v_current_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_lock_acquired BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- CONCURRENCY PROTECTION: Acquire advisory lock to prevent race conditions
  -- Lock ID is hash of (user_id + action) to make it unique per user-action pair
  v_lock_acquired := pg_try_advisory_xact_lock(
    hashtext(v_user_id::text || p_action)
  );
  
  IF NOT v_lock_acquired THEN
    -- If lock not acquired, another request is processing - fail fast
    RAISE EXCEPTION 'Too many concurrent requests. Please retry.';
  END IF;

  -- Get current rate limit record (now protected by advisory lock)
  SELECT request_count, window_start 
  INTO v_current_count, v_window_start
  FROM rate_limits
  WHERE user_id = v_user_id 
    AND action = p_action;

  -- If no record exists or window expired, create/reset
  IF v_current_count IS NULL OR v_window_start < (now() - (p_window_minutes || ' minutes')::interval) THEN
    INSERT INTO rate_limits (user_id, action, request_count, window_start)
    VALUES (v_user_id, p_action, 1, now())
    ON CONFLICT (user_id, action) 
    DO UPDATE SET 
      request_count = 1,
      window_start = now();
    
    RETURN TRUE; -- First request in new window
  END IF;

  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RAISE EXCEPTION 'Rate limit exceeded for %. Try again in % seconds.', 
      p_action, 
      EXTRACT(EPOCH FROM ((v_window_start + (p_window_minutes || ' minutes')::interval) - now()))::INTEGER;
  END IF;

  -- Increment counter (safe from race conditions due to advisory lock)
  UPDATE rate_limits
  SET request_count = request_count + 1
  WHERE user_id = v_user_id AND action = p_action;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."check_rate_limit"("p_action" "text", "p_max_requests" integer, "p_window_minutes" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_rate_limit"("p_action" "text", "p_max_requests" integer, "p_window_minutes" integer) IS 'Checks and enforces rate limits for user actions';



CREATE OR REPLACE FUNCTION "public"."cleanup_rate_limits"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Delete records older than 1 hour
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;


ALTER FUNCTION "public"."cleanup_rate_limits"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_rate_limits"() IS 'Removes expired rate limit records (run hourly)';



CREATE OR REPLACE FUNCTION "public"."cleanup_stale_active_members"() RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM community_active_members
  WHERE last_seen_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_stale_active_members"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."comments_search_vector_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."comments_search_vector_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."communities_search_vector_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."communities_search_vector_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_quest"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO public.user_actions (user_id, action_type, action_value, entity_type, entity_id)
        SELECT NEW.user_id, 'quest_completed', q.points, 'quest', NEW.quest_id
        FROM public.quests q
        WHERE q.id = NEW.quest_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."complete_quest"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_leaderboard_scores"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    DELETE FROM public.leaderboard_scores;
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT user_id, NULL, NULL, 'all_time', SUM(action_value), ROW_NUMBER() OVER (ORDER BY SUM(action_value) DESC)
    FROM public.user_actions GROUP BY user_id HAVING SUM(action_value) > 0;
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT user_id, NULL, NULL, 'monthly', SUM(action_value), ROW_NUMBER() OVER (ORDER BY SUM(action_value) DESC)
    FROM public.user_actions WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) GROUP BY user_id HAVING SUM(action_value) > 0;
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT user_id, NULL, NULL, 'weekly', SUM(action_value), ROW_NUMBER() OVER (ORDER BY SUM(action_value) DESC)
    FROM public.user_actions WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) GROUP BY user_id HAVING SUM(action_value) > 0;
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT ua.user_id, 'ward', p.ward, 'all_time', SUM(ua.action_value), ROW_NUMBER() OVER (PARTITION BY p.ward ORDER BY SUM(ua.action_value) DESC)
    FROM public.user_actions ua JOIN public.profiles p ON ua.user_id = p.id WHERE p.ward IS NOT NULL GROUP BY ua.user_id, p.ward HAVING SUM(ua.action_value) > 0;
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT ua.user_id, 'constituency', p.constituency, 'all_time', SUM(ua.action_value), ROW_NUMBER() OVER (PARTITION BY p.constituency ORDER BY SUM(ua.action_value) DESC)
    FROM public.user_actions ua JOIN public.profiles p ON ua.user_id = p.id WHERE p.constituency IS NOT NULL GROUP BY ua.user_id, p.constituency HAVING SUM(ua.action_value) > 0;
    INSERT INTO public.leaderboard_scores (user_id, location_type, location_value, period, total_points, rank)
    SELECT ua.user_id, 'county', p.county, 'all_time', SUM(ua.action_value), ROW_NUMBER() OVER (PARTITION BY p.county ORDER BY SUM(ua.action_value) DESC)
    FROM public.user_actions ua JOIN public.profiles p ON ua.user_id = p.id WHERE p.county IS NOT NULL GROUP BY ua.user_id, p.county HAVING SUM(ua.action_value) > 0;
END;
$$;


ALTER FUNCTION "public"."compute_leaderboard_scores"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_civic_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.referenced_promise_id IS NOT NULL THEN
    INSERT INTO public.comment_notifications (comment_id, recipient_id, notification_type, title, message, action_url)
    SELECT NEW.id, dp.official_id, 'promise_mentioned', 'Your promise was mentioned in a comment',
      'A comment referenced your development promise: ' || substring(NEW.content, 1, 100) || '...',
      '/posts/' || NEW.post_id || '#comment-' || NEW.id
    FROM public.development_promises dp
    WHERE dp.id = NEW.referenced_promise_id AND dp.official_id != NEW.author_id;
  END IF;
  IF NEW.referenced_project_id IS NOT NULL THEN
    INSERT INTO public.comment_notifications (comment_id, recipient_id, notification_type, title, message, action_url)
    SELECT NEW.id, gp.created_by, 'project_mentioned', 'Your project was mentioned in a comment',
      'A comment referenced your government project: ' || substring(NEW.content, 1, 100) || '...',
      '/projects/' || NEW.referenced_project_id
    FROM public.government_projects gp
    WHERE gp.id = NEW.referenced_project_id AND gp.created_by != NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_civic_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_comment_ratelimited"("p_content" "text", "p_post_id" "uuid", "p_parent_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  -- Check rate limit: 20 comments per minute
  IF NOT check_rate_limit('create_comment', 20, 1) THEN
    RETURN NULL;
  END IF;

  -- Create comment
  INSERT INTO comments (
    content,
    post_id,
    parent_id,
    author_id
  )
  VALUES (
    p_content,
    p_post_id,
    p_parent_id,
    auth.uid()
  )
  RETURNING id INTO v_comment_id;

  RETURN v_comment_id;
END;
$$;


ALTER FUNCTION "public"."create_comment_ratelimited"("p_content" "text", "p_post_id" "uuid", "p_parent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_comment_references"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.comment_references WHERE comment_id = NEW.id;
  IF NEW.referenced_promise_id IS NOT NULL THEN
    INSERT INTO public.comment_references (comment_id, reference_type, reference_id, reference_title, reference_url)
    SELECT NEW.id, 'promise', NEW.referenced_promise_id, dp.title, '/promises/' || NEW.referenced_promise_id
    FROM public.development_promises dp WHERE dp.id = NEW.referenced_promise_id;
  END IF;
  IF NEW.referenced_project_id IS NOT NULL THEN
    INSERT INTO public.comment_references (comment_id, reference_type, reference_id, reference_title, reference_url)
    SELECT NEW.id, 'project', NEW.referenced_project_id, gp.title, '/projects/' || NEW.referenced_project_id
    FROM public.government_projects gp WHERE gp.id = NEW.referenced_project_id;
  END IF;
  IF NEW.is_official_response = true AND NEW.official_verification_id IS NOT NULL THEN
    INSERT INTO public.comment_references (comment_id, reference_type, reference_id, reference_title, reference_url)
    SELECT NEW.id, 'official', NEW.official_verification_id, o.name || ' (' || o.position || ')', '/officials/' || NEW.official_verification_id
    FROM public.officials o WHERE o.id = NEW.official_verification_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_comment_references"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_community_ratelimited"("p_name" "text", "p_display_name" "text", "p_description" "text", "p_category" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_community_id UUID;
BEGIN
  -- Check rate limit: 3 communities per hour (stricter)
  IF NOT check_rate_limit('create_community', 3, 60) THEN
    RETURN NULL;
  END IF;

  -- Use existing RPC function
  SELECT create_community_with_channels(
    p_name,
    p_display_name,
    p_description,
    p_category,
    auth.uid()
  ) INTO v_community_id;

  RETURN v_community_id;
END;
$$;


ALTER FUNCTION "public"."create_community_ratelimited"("p_name" "text", "p_display_name" "text", "p_description" "text", "p_category" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_community_with_channels"("p_name" "text", "p_display_name" "text", "p_description" "text", "p_category" "text", "p_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."create_community_with_channels"("p_name" "text", "p_display_name" "text", "p_description" "text", "p_category" "text", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_community_with_channels"("p_name" "text", "p_display_name" "text", "p_description" "text", "p_category" "text", "p_user_id" "uuid") IS 'Creates a community with default channels, bypassing RLS restrictions. User becomes admin and member automatically.';



CREATE OR REPLACE FUNCTION "public"."create_office_for_position"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.offices (position_id, position_code, country_code, jurisdiction_name, governance_level) 
    VALUES (NEW.id, NEW.position_code, NEW.country_code, NEW.jurisdiction_name, NEW.governance_level);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_office_for_position"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_post_ratelimited"("p_title" "text", "p_content" "text", "p_community_id" "uuid", "p_tags" "text"[] DEFAULT ARRAY[]::"text"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_post_id UUID;
BEGIN
  -- Check rate limit: 10 posts per minute
  IF NOT check_rate_limit('create_post', 10, 1) THEN
    RETURN NULL;
  END IF;

  -- Create post
  INSERT INTO posts (
    title, 
    content, 
    author_id, 
    community_id, 
    tags
  )
  VALUES (
    p_title,
    p_content,
    auth.uid(),
    p_community_id,
    p_tags
  )
  RETURNING id INTO v_post_id;

  RETURN v_post_id;
END;
$$;


ALTER FUNCTION "public"."create_post_ratelimited"("p_title" "text", "p_content" "text", "p_community_id" "uuid", "p_tags" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."development_promises_search_vector_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."development_promises_search_vector_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_case_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.case_number := UPPER(SUBSTRING(NEW.category, 1, 3)) || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(MD5(NEW.id::text), 1, 4));
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_case_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_agent_threshold"("p_agent" "text", "p_key" "text") RETURNS double precision
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT (state_value::TEXT)::FLOAT
  FROM agent_state
  WHERE agent_name = p_agent AND state_key = p_key;
$$;


ALTER FUNCTION "public"."get_agent_threshold"("p_agent" "text", "p_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_channel_analytics"("p_channel_id" "uuid") RETURNS TABLE("total_posts" integer, "total_messages" integer, "avg_daily_activity" numeric, "most_active_day" "date")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(ca.post_count), 0)::INTEGER as total_posts,
        COALESCE(SUM(ca.message_count), 0)::INTEGER as total_messages,
        COALESCE(AVG(ca.post_count + ca.message_count), 0)::DECIMAL as avg_daily_activity,
        (SELECT date FROM channel_analytics 
         WHERE channel_id = p_channel_id 
         ORDER BY (post_count + message_count) DESC LIMIT 1) as most_active_day
    FROM channel_analytics ca
    WHERE ca.channel_id = p_channel_id
    AND ca.date >= CURRENT_DATE - INTERVAL '7 days';
END;
$$;


ALTER FUNCTION "public"."get_channel_analytics"("p_channel_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_online_member_count"("community_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM community_active_members
    WHERE community_id = community_uuid
      AND last_seen_at > NOW() - INTERVAL '15 minutes'
  );
END;
$$;


ALTER FUNCTION "public"."get_online_member_count"("community_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_personalized_feed"("p_user_id" "uuid", "p_limit_count" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "type" "text", "user_id" "uuid", "username" "text", "avatar_url" "text", "created_at" timestamp with time zone, "data" "jsonb", "relevance_score" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_county text;
  user_constituency text;
  user_ward text;
BEGIN
  -- Get user's location
  SELECT county_id, constituency_id, ward_id
  INTO user_county, user_constituency, user_ward
  FROM profiles
  WHERE id = p_user_id;

  RETURN QUERY
  WITH user_communities AS (
    -- Get communities user is a member of
    SELECT community_id
    FROM community_members
    WHERE user_id = p_user_id
  ),
  combined_feed AS (
    -- Posts from user's communities or location (FIXED: removed link_url, added community data)
    SELECT 
      p.id,
      'post'::text as type,
      p.author_id as user_id,
      prof.username,
      prof.avatar_url,
      p.created_at,
      jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'content', p.content,
        'content_type', p.content_type,
        'community_id', p.community_id,
        'community_name', c.name,
        'community_icon', c.avatar_url,
        'upvote_count', p.upvotes,
        'downvote_count', p.downvotes,
        'comment_count', p.comment_count,
        'media', (
           SELECT jsonb_agg(jsonb_build_object(
             'id', pm.id,
             'file_path', pm.file_path,
             'file_type', pm.file_type
           ))
           FROM post_media pm
           WHERE pm.post_id = p.id
        )
      ) as data,
      CASE 
        WHEN p.community_id IN (SELECT community_id FROM user_communities) THEN 100
        WHEN p.author_id = p_user_id THEN 90
        ELSE 50
      END as relevance_score
    FROM posts p
    LEFT JOIN profiles prof ON p.author_id = prof.id
    LEFT JOIN communities c ON p.community_id = c.id
    WHERE p.deleted_at IS NULL
      AND (
        p.community_id IN (SELECT community_id FROM user_communities)
        OR p.author_id = p_user_id
        OR prof.county_id = user_county
      )
    
    UNION ALL
    
    -- Projects in user's area
    SELECT 
      pr.id,
      'project'::text as type,
      pr.created_by as user_id,
      prof.username,
      prof.avatar_url,
      pr.created_at,
      jsonb_build_object(
        'id', pr.id,
        'name', pr.title,
        'description', pr.description,
        'status', pr.status,
        'location', pr.location,
        'county', pr.county,
        'media_urls', pr.media_urls
      ) as data,
      CASE 
        WHEN pr.ward = user_ward THEN 100
        WHEN pr.constituency = user_constituency THEN 80
        WHEN pr.county = user_county THEN 60
        ELSE 40
      END as relevance_score
    FROM government_projects pr
    LEFT JOIN profiles prof ON pr.created_by = prof.id
    WHERE pr.county = user_county OR pr.constituency = user_constituency OR pr.ward = user_ward
    
    UNION ALL
    
    -- Relevant activities
    SELECT 
      fa.id,
      fa.activity_type as type,
      fa.user_id,
      prof.username,
      prof.avatar_url,
      fa.created_at,
      jsonb_build_object(
        'id', fa.id,
        'activity_type', fa.activity_type,
        'target_id', fa.target_id,
        'target_type', fa.target_type,
        'metadata', fa.metadata
      ) as data,
      50 as relevance_score
    FROM feed_activities fa
    LEFT JOIN profiles prof ON fa.user_id = prof.id
    WHERE fa.is_public = true
  )
  SELECT *
  FROM combined_feed
  ORDER BY relevance_score DESC, created_at DESC
  LIMIT p_limit_count;
END;
$$;


ALTER FUNCTION "public"."get_personalized_feed"("p_user_id" "uuid", "p_limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_posts_with_votes"("user_id_param" "uuid" DEFAULT NULL::"uuid", "limit_param" integer DEFAULT 20, "offset_param" integer DEFAULT 0, "sort_by" "text" DEFAULT 'new'::"text") RETURNS TABLE("id" "uuid", "title" "text", "content" "text", "created_at" timestamp with time zone, "upvotes" integer, "downvotes" integer, "comment_count" integer, "tags" "text"[], "content_sensitivity" "text", "is_ngo_verified" boolean, "author_id" "uuid", "author_username" "text", "author_display_name" "text", "author_avatar_url" "text", "author_is_verified" boolean, "author_official_position" "text", "author_role" "text", "community_id" "uuid", "community_name" "text", "community_display_name" "text", "community_description" "text", "community_member_count" integer, "community_category" "text", "user_vote" "text")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.created_at,
    COALESCE(p.upvotes, 0)::INTEGER as upvotes,
    COALESCE(p.downvotes, 0)::INTEGER as downvotes,
    COALESCE(p.comment_count, 0)::INTEGER as comment_count,
    COALESCE(p.tags, '{}'::TEXT[]) as tags,
    COALESCE(p.content_sensitivity, 'public') as content_sensitivity,
    COALESCE(p.is_ngo_verified, false) as is_ngo_verified,
    pr.id as author_id,
    pr.username as author_username,
    pr.display_name as author_display_name,
    pr.avatar_url as author_avatar_url,
    COALESCE(pr.is_verified, false) as author_is_verified,
    pr.official_position as author_official_position,  -- NEW: Include official position
    COALESCE(pr.role, 'citizen') as author_role,
    c.id as community_id,
    c.name as community_name,
    c.display_name as community_display_name,
    c.description as community_description,
    COALESCE(c.member_count, 0)::INTEGER as community_member_count,
    c.category as community_category,
    v.vote_type as user_vote
  FROM posts p
  LEFT JOIN profiles pr ON pr.id = p.author_id
  LEFT JOIN communities c ON c.id = p.community_id
  LEFT JOIN votes v ON v.post_id = p.id AND v.user_id = user_id_param
  ORDER BY 
    CASE 
      WHEN sort_by = 'new' THEN p.created_at
      WHEN sort_by = 'top' THEN p.created_at
    END DESC,
    CASE 
      WHEN sort_by = 'top' THEN p.upvotes
      WHEN sort_by = 'hot' THEN (p.upvotes - p.downvotes) - EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600
    END DESC NULLS LAST
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;


ALTER FUNCTION "public"."get_posts_with_votes"("user_id_param" "uuid", "limit_param" integer, "offset_param" integer, "sort_by" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_posts_with_votes"("user_id_param" "uuid", "limit_param" integer, "offset_param" integer, "sort_by" "text") IS 'Fetches posts with author, community, and user vote data including official position for verified officials';



CREATE OR REPLACE FUNCTION "public"."get_profile_with_privacy"("profile_id" "uuid") RETURNS TABLE("id" "uuid", "username" "text", "display_name" "text", "avatar_url" "text", "bio" "text", "role" "text", "is_verified" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "privacy_settings" "jsonb")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    CASE 
      WHEN p.id = auth.uid() OR p.privacy_settings->>'allow_contact' = 'true' 
      THEN p.bio 
      ELSE NULL 
    END,
    p.role,
    p.is_verified,
    p.created_at,
    p.updated_at,
    CASE 
      WHEN p.id = auth.uid() 
      THEN p.privacy_settings 
      ELSE '{}'::jsonb 
    END
  FROM public.profiles p 
  WHERE p.id = profile_id;
$$;


ALTER FUNCTION "public"."get_profile_with_privacy"("profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_rate_limit_status"("p_action" "text" DEFAULT NULL::"text") RETURNS TABLE("action" "text", "request_count" integer, "window_start" timestamp with time zone, "time_until_reset" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rl.action,
    rl.request_count,
    rl.window_start,
    EXTRACT(EPOCH FROM ((rl.window_start + interval '1 minute') - now()))::INTEGER as time_until_reset
  FROM rate_limits rl
  WHERE rl.user_id = auth.uid()
    AND (p_action IS NULL OR rl.action = p_action)
    AND rl.window_start > now() - interval '1 hour';
END;
$$;


ALTER FUNCTION "public"."get_rate_limit_status"("p_action" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_rate_limit_status"("p_action" "text") IS 'Returns current rate limit status for authenticated user';



CREATE OR REPLACE FUNCTION "public"."get_unified_feed"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_limit_count" integer DEFAULT 20, "p_offset_count" integer DEFAULT 0, "p_sort_by" "text" DEFAULT 'newest'::"text") RETURNS TABLE("id" "uuid", "type" "text", "data" json, "created_at" timestamp with time zone, "user_id" "uuid", "username" "text", "avatar_url" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    'post'::text AS type,
    json_build_object(
      'id', p.id,
      'title', p.title,
      'content', p.content,
      'community_id', p.community_id,
      'community_name', c.name,
      'community_icon', c.avatar_url,
      'author_id', p.author_id,
      'created_at', p.created_at,
      'upvotes', p.upvotes,
      'downvotes', p.downvotes,
      'comment_count', p.comment_count,
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
    p.created_at,
    p.author_id AS user_id,
    pr.username,
    pr.avatar_url
  FROM posts p
  LEFT JOIN profiles pr ON pr.id = p.author_id
  LEFT JOIN communities c ON c.id = p.community_id
  WHERE p.is_hidden IS NOT TRUE
  ORDER BY
    CASE WHEN p_sort_by = 'newest'  THEN p.created_at END DESC,
    CASE WHEN p_sort_by = 'top'     THEN (p.upvotes - p.downvotes) END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'hot'     THEN (p.upvotes - p.downvotes) * EXP(-0.003 * EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600) END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'rising'  THEN p.comment_count END DESC NULLS LAST,
    p.created_at DESC
  LIMIT p_limit_count
  OFFSET p_offset_count;
END;
$$;


ALTER FUNCTION "public"."get_unified_feed"("p_user_id" "uuid", "p_limit_count" integer, "p_offset_count" integer, "p_sort_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_warning_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::INT FROM user_warnings
  WHERE user_id = p_user_id AND acknowledged = false;
$$;


ALTER FUNCTION "public"."get_user_warning_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_weekly_contributions"("community_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
    post_count INTEGER;
    comment_count INTEGER;
BEGIN
    -- Count posts in the community from the last 7 days
    SELECT COUNT(*) INTO post_count
    FROM posts
    WHERE community_id = community_uuid
    AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Count comments on posts in this community from the last 7 days
    SELECT COUNT(*) INTO comment_count
    FROM comments c
    JOIN posts p ON c.post_id = p.id
    WHERE p.community_id = community_uuid
    AND c.created_at >= NOW() - INTERVAL '7 days';
    
    RETURN COALESCE(post_count, 0) + COALESCE(comment_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_weekly_contributions"("community_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_weekly_visitors"("community_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT user_id)
        FROM community_visits
        WHERE community_id = community_uuid
        AND visit_date >= CURRENT_DATE - INTERVAL '7 days'
    );
END;
$$;


ALTER FUNCTION "public"."get_weekly_visitors"("community_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."government_projects_search_vector_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.county, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.constituency, '')), 'C');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."government_projects_search_vector_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_location_community_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_location_community_creation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
          COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_channel_metric"("p_channel_id" "uuid", "p_metric" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO channel_analytics (channel_id, date)
    VALUES (p_channel_id, CURRENT_DATE)
    ON CONFLICT (channel_id, date) DO NOTHING;
    
    IF p_metric = 'post' THEN
        UPDATE channel_analytics 
        SET post_count = post_count + 1, updated_at = NOW()
        WHERE channel_id = p_channel_id AND date = CURRENT_DATE;
    ELSIF p_metric = 'message' THEN
        UPDATE channel_analytics 
        SET message_count = message_count + 1, updated_at = NOW()
        WHERE channel_id = p_channel_id AND date = CURRENT_DATE;
    END IF;
END;
$$;


ALTER FUNCTION "public"."increment_channel_metric"("p_channel_id" "uuid", "p_metric" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_user_karma"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.profiles
  SET karma = calculate_user_karma(NEW.author_id), last_activity = now()
  WHERE id = NEW.author_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_user_karma"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin','super_admin')
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role, 'super_admin'::app_role)
  )
$$;


ALTER FUNCTION "public"."is_admin"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::app_role
  )
$$;


ALTER FUNCTION "public"."is_super_admin"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_comment_moderation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF (OLD.moderation_status IS DISTINCT FROM NEW.moderation_status) OR
     (OLD.fact_check_status IS DISTINCT FROM NEW.fact_check_status) OR
     (OLD.is_hidden IS DISTINCT FROM NEW.is_hidden) THEN
    INSERT INTO public.comment_moderation_log (comment_id, moderator_id, action, reason, previous_status, new_status, toxicity_score, metadata)
    VALUES (NEW.id, NEW.moderator_id,
      CASE WHEN NEW.moderation_status = 'removed' THEN 'remove' WHEN NEW.moderation_status = 'approved' THEN 'approve'
           WHEN NEW.is_hidden = true THEN 'hide' WHEN NEW.is_hidden = false AND OLD.is_hidden = true THEN 'unhide'
           WHEN NEW.fact_check_status IN ('verified', 'disputed', 'rejected') THEN 'fact_check' ELSE 'moderate' END,
      COALESCE(NEW.moderation_reason, NEW.hidden_reason),
      CASE WHEN OLD.moderation_status IS NOT NULL THEN OLD.moderation_status
           WHEN OLD.is_hidden IS NOT NULL THEN CASE WHEN OLD.is_hidden THEN 'hidden' ELSE 'visible' END ELSE 'unverified' END,
      CASE WHEN NEW.moderation_status IS NOT NULL THEN NEW.moderation_status
           WHEN NEW.is_hidden IS NOT NULL THEN CASE WHEN NEW.is_hidden THEN 'hidden' ELSE 'visible' END ELSE NEW.fact_check_status END,
      NEW.toxicity_score, jsonb_build_object('fact_check_notes', NEW.fact_check_notes, 'content_warnings', NEW.content_warnings));
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_comment_moderation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_community_visit"("p_community_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    IF current_user_id IS NULL THEN
        RETURN; -- Not authenticated, do nothing
    END IF;
    
    INSERT INTO community_visits (community_id, user_id, visit_date, visited_at)
    VALUES (p_community_id, current_user_id, CURRENT_DATE, NOW())
    ON CONFLICT ON CONSTRAINT unique_daily_visit 
    DO UPDATE SET visited_at = NOW();
END;
$$;


ALTER FUNCTION "public"."log_community_visit"("p_community_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_feed_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_target_id" "text" DEFAULT NULL::"text", "p_target_type" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_is_public" boolean DEFAULT true) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO feed_activities (
    user_id,
    activity_type,
    target_id,
    target_type,
    metadata,
    is_public
  )
  VALUES (
    p_user_id,
    p_activity_type,
    p_target_id,
    p_target_type,
    p_metadata,
    p_is_public
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;


ALTER FUNCTION "public"."log_feed_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_target_id" "text", "p_target_type" "text", "p_metadata" "jsonb", "p_is_public" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_promise_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.office_activity_log (
    office_holder_id,
    activity_type,
    title,
    description,
    created_at
  ) VALUES (
    NEW.office_holder_id,
    'promise_created',
    NEW.title,
    NEW.description,
    NOW()
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_promise_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_promise_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_actions (user_id, action_type, action_value, entity_type, entity_id, metadata)
  VALUES (
    NEW.submitted_by,
    'promise_logged',
    5,
    'promise',
    NEW.id,
    jsonb_build_object(
      'title', NEW.title,
      'politician_id', NEW.politician_id,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_promise_creation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_question_answered_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only fire when answer transitions from NULL to a value
  IF OLD.answer IS NULL AND NEW.answer IS NOT NULL THEN
    INSERT INTO public.office_activity_log (
      office_holder_id,
      activity_type,
      title,
      description,
      created_at
    ) VALUES (
      NEW.office_holder_id,
      'question_answered',
      'Answered a citizen question',
      LEFT(NEW.question, 200),
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_question_answered_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_user_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    activity_type TEXT;
    entity_type TEXT;
    entity_title TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN activity_type := 'created';
    ELSIF TG_OP = 'UPDATE' THEN activity_type := 'updated';
    ELSIF TG_OP = 'DELETE' THEN activity_type := 'deleted'; END IF;
    IF TG_TABLE_NAME = 'posts' THEN
        entity_type := 'post';
        IF TG_OP = 'DELETE' THEN entity_title := 'Post deleted'; ELSE entity_title := COALESCE(NEW.title, 'Untitled Post'); END IF;
    ELSIF TG_TABLE_NAME = 'comments' THEN
        entity_type := 'comment';
        IF TG_OP = 'DELETE' THEN entity_title := 'Comment deleted';
        ELSE entity_title := LEFT(COALESCE(NEW.content, ''), 100) || CASE WHEN LENGTH(COALESCE(NEW.content, '')) > 100 THEN '...' ELSE '' END; END IF;
    ELSE entity_type := TG_TABLE_NAME; entity_title := 'Unknown entity'; END IF;
    INSERT INTO public.user_activities (user_id, activity_type, entity_type, entity_id, entity_title, created_at)
    VALUES (COALESCE(NEW.author_id, OLD.author_id), activity_type, entity_type, COALESCE(NEW.id, OLD.id), entity_title, NOW());
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_user_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_verification_vote"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_actions (user_id, action_type, action_value, entity_type, entity_id, metadata)
  VALUES (
    NEW.user_id,
    'verification_vote_cast',
    2,
    'verification',
    NEW.verification_id,
    jsonb_build_object('vote_type', NEW.vote_type)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_verification_vote"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_threshold" double precision DEFAULT 0.7, "match_count" integer DEFAULT 5) RETURNS TABLE("id" "uuid", "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT
        v.id,
        v.content,
        v.metadata,
        1 - (v.embedding <=> query_embedding) AS similarity
    FROM vectors v
    WHERE 1 - (v.embedding <=> query_embedding) > match_threshold
    ORDER BY v.embedding <=> query_embedding
    LIMIT match_count;
$$;


ALTER FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."maybe_escalate_civic_issue"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_action    RECORD;
  v_existing  uuid;
  v_county_name text;
BEGIN
  IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;

  -- Re-read action with updated support_count
  SELECT ca.*, co.name as county_name
  INTO v_action
  FROM public.civic_actions ca
  LEFT JOIN public.counties co ON co.id = ca.county_id
  WHERE ca.id = NEW.action_id;

  -- Only escalate at threshold of 3 supporters
  IF v_action.support_count < 3 THEN RETURN NEW; END IF;

  -- Check if we already escalated this action
  SELECT id INTO v_existing
  FROM public.accountability_alerts
  WHERE details->>'source_civic_action_id' = v_action.id::text
  LIMIT 1;

  IF v_existing IS NOT NULL THEN RETURN NEW; END IF;

  -- Create accountability alert using the real schema
  INSERT INTO public.accountability_alerts (
    alert_type,
    subject_type,
    subject_id,
    subject_name,
    severity,
    summary,
    details,
    county,
    is_public
  ) VALUES (
    'community_issue',
    'civic_action',
    v_action.id,
    v_action.title,
    CASE v_action.urgency WHEN 'high' THEN 8 WHEN 'medium' THEN 5 ELSE 3 END,
    v_action.support_count::text || ' residents have reported: ' || v_action.title ||
      CASE WHEN v_action.location_text IS NOT NULL THEN ' at ' || v_action.location_text ELSE '' END,
    jsonb_build_object(
      'source_civic_action_id', v_action.id,
      'case_number', v_action.case_number,
      'category', v_action.category,
      'action_level', v_action.action_level,
      'support_count', v_action.support_count,
      'description', v_action.description
    ),
    COALESCE(v_action.county_name, 'Unknown'),
    true
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."maybe_escalate_civic_issue"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_accountability_alert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_recipient_row RECORD;
  v_title TEXT;
  v_message TEXT;
BEGIN
  IF NEW.is_public = false THEN RETURN NEW; END IF;
  v_title   := 'Civic Alert: ' || LEFT(COALESCE(NEW.subject_name, 'Unknown'), 60);
  v_message := LEFT(COALESCE(NEW.summary, 'A new accountability alert has been issued for your area.'), 280);
  FOR v_recipient_row IN
    SELECT p.id FROM public.profiles p
    WHERE (NEW.county IS NULL OR p.county = NEW.county) AND p.id IS NOT NULL
    ORDER BY p.created_at DESC LIMIT 50
  LOOP
    INSERT INTO public.comment_notifications (
      comment_id, recipient_id, notification_type, title, message, action_url, is_read, metadata, created_at
    ) VALUES (
      NULL, v_recipient_row.id, 'civic_alert', v_title, v_message,
      '/feed?alert=' || NEW.id::text, false,
      jsonb_build_object('alert_id', NEW.id, 'severity', NEW.severity, 'county', NEW.county),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_accountability_alert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_community_on_project"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_community_id UUID;
    v_location_type TEXT;
    v_location_value TEXT;
BEGIN
    IF NEW.ward IS NOT NULL THEN v_location_type := 'ward'; v_location_value := NEW.ward;
    ELSIF NEW.constituency IS NOT NULL THEN v_location_type := 'constituency'; v_location_value := NEW.constituency;
    ELSIF NEW.county IS NOT NULL THEN v_location_type := 'county'; v_location_value := NEW.county;
    ELSE RETURN NEW; END IF;
    SELECT id INTO v_community_id FROM public.communities WHERE location_type = v_location_type AND location_value = v_location_value AND type = 'location';
    IF v_community_id IS NOT NULL THEN
        INSERT INTO public.posts (title, content, author_id, community_id, tags)
        VALUES ('New Project Reported: ' || NEW.title,
          'A new project has been reported in our ' || v_location_type || '. \n\n**Description:** ' || left(NEW.description, 200) || '...\n\n[View Project Details](/projects/' || NEW.id || ')',
          NEW.created_by, v_community_id, ARRAY['project-alert', 'civic-watch']);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_community_on_project"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_on_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_supporter RECORD;
  v_message text;
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  v_message := 'Issue "' || NEW.title || '" status changed to: ' ||
               upper(replace(NEW.status, '_', ' '));

  -- Notify the reporter
  INSERT INTO public.comment_notifications (
    user_id,
    actor_id,
    notification_type,
    comment_id,
    post_id,
    message
  ) VALUES (
    NEW.user_id,
    NEW.user_id,  -- system notification
    'civic_status_update',
    NULL,
    NULL,
    v_message
  ) ON CONFLICT DO NOTHING;

  -- Notify all supporters
  FOR v_supporter IN
    SELECT user_id FROM public.civic_action_supporters WHERE action_id = NEW.id
  LOOP
    IF v_supporter.user_id <> NEW.user_id THEN
      INSERT INTO public.comment_notifications (
        user_id,
        actor_id,
        notification_type,
        comment_id,
        post_id,
        message
      ) VALUES (
        v_supporter.user_id,
        NEW.user_id,
        'civic_status_update',
        NULL,
        NULL,
        v_message
      ) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Log status change in civic_action_updates
  INSERT INTO public.civic_action_updates (
    action_id,
    previous_status,
    new_status,
    comment
  ) VALUES (
    NEW.id,
    OLD.status,
    NEW.status,
    'Status updated from ' || OLD.status || ' to ' || NEW.status
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_on_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_quill_draft_approved"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  IF NEW.status != 'approved' THEN RETURN NEW; END IF;
  INSERT INTO public.admin_notifications (
    recipient_role, title, message, severity, action_url, is_read, created_at
  ) VALUES (
    'admin',
    'Quill Draft Approved: ' || LEFT(COALESCE(NEW.title, 'Untitled'), 80),
    'The ' || COALESCE(NEW.draft_type, 'draft') || ' from ' || COALESCE(NEW.agent_name, 'agent') || ' has been approved and is ready to publish.',
    'info', '/admin?tab=agent-control', false, NOW()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_quill_draft_approved"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_user_warning"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.comment_notifications (
    comment_id, recipient_id, notification_type, title, message, action_url, is_read, created_at
  ) VALUES (
    NULL, NEW.user_id, 'agent_warning',
    CASE NEW.severity
      WHEN 'info'          THEN 'Community Guideline Notice'
      WHEN 'warning'       THEN 'Content Warning Issued'
      WHEN 'strike'        THEN 'Strike on Your Account'
      WHEN 'temp_ban'      THEN 'Temporary Account Restriction'
      WHEN 'permanent_ban' THEN 'Account Permanently Restricted'
      ELSE                      'Account Notice'
    END,
    LEFT(NEW.reason, 300), '/profile/warnings', false, NOW()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_user_warning"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."officials_search_vector_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.position, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.constituency, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.county, '')), 'B');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."officials_search_vector_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."posts_search_vector_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."posts_search_vector_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_locked_channel_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF OLD.is_locked = TRUE THEN
        RAISE EXCEPTION 'Cannot delete locked core channel: %', OLD.name;
    END IF;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."prevent_locked_channel_deletion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."profile_allows_community_visibility"("target_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (
      SELECT (privacy_settings->>'show_community_membership')::boolean
      FROM public.profiles
      WHERE id = target_user_id
    ),
    false  -- default: hidden
  );
$$;


ALTER FUNCTION "public"."profile_allows_community_visibility"("target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."profile_allows_community_visibility"("target_user_id" "uuid") IS 'H6: Returns true if the target user has enabled show_community_membership in privacy_settings';



CREATE OR REPLACE FUNCTION "public"."profiles_search_vector_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'B');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."profiles_search_vector_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recommend_communities"("p_user_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "name" "text", "display_name" "text", "description" "text", "avatar_url" "text", "member_count" integer, "weekly_visitors" integer, "weekly_contributions" integer, "recommendation_score" numeric, "recommendation_reason" "text")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."recommend_communities"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_office_dashboard_snapshot"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.office_dashboard_snapshot;
END;
$$;


ALTER FUNCTION "public"."refresh_office_dashboard_snapshot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."route_issue_to_institution"("p_action_id" "uuid", "p_institution_id" "uuid", "p_formal_letter" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.civic_actions
  SET
    institution_id = p_institution_id,
    formal_letter  = COALESCE(p_formal_letter, formal_letter),
    updated_at     = now()
  WHERE id = p_action_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'civic_action % not found', p_action_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."route_issue_to_institution"("p_action_id" "uuid", "p_institution_id" "uuid", "p_formal_letter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_community_channels"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- FEED CHANNEL - User posts (appears at top, above Information)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'community-feed', 'feed', 'FEED', TRUE, 0, 'User posts and community updates');
    
    -- CORE LOCKED CHANNELS (Standard Civic Suite)
    
    -- Announcements (Read-only for members)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'announcements', 'announcement', 'INFO', TRUE, 1, 'Official updates from leadership');
    
    -- Project Tracker (Forum for structured tracking)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'project-tracker', 'forum', 'MONITORING', TRUE, 2, 'Track government projects and development');
    
    -- Public Forum (General discussion)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'public-forum', 'forum', 'ENGAGEMENT', TRUE, 3, 'Open community discussions');
    
    -- OPTIONAL DEFAULT CHANNELS (Can be deleted by admin)
    
    -- General Chat
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'general-chat', 'chat', 'ENGAGEMENT', FALSE, 4, 'Casual conversations');
    
    -- Baraza - Audio/Video Community Hall
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'baraza', 'voice', 'ENGAGEMENT', FALSE, 5, 'Community voice and video gatherings');
    
    -- Leaders Grid (Monitoring)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'our-leaders', 'feed', 'MONITORING', FALSE, 6, 'View elected officials and office holders');
    
    -- Promises Watch (Monitoring)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'promises-watch', 'feed', 'MONITORING', FALSE, 7, 'Track campaign promises and commitments');
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."seed_community_channels"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_civic_action_support_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_action_id uuid;
  v_new_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_action_id := OLD.action_id;
  ELSE
    v_action_id := NEW.action_id;
  END IF;

  SELECT COUNT(*) INTO v_new_count
  FROM public.civic_action_supporters
  WHERE action_id = v_action_id;

  UPDATE public.civic_actions
  SET support_count = v_new_count
  WHERE id = v_action_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_civic_action_support_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_issue_comment_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.civic_actions SET comment_count = comment_count + 1 WHERE id = NEW.action_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.civic_actions SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.action_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_issue_comment_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_official_verification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    position_title TEXT;
BEGIN
    -- When verification_status changes to 'verified'
    IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
        -- Get the position title
        SELECT title INTO position_title
        FROM government_positions
        WHERE id = NEW.position_id;
        
        -- Update the user's profile
        UPDATE profiles
        SET 
            is_verified = true,
            official_position = position_title,
            official_position_id = NEW.position_id,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        RAISE NOTICE 'Verified official % for position %', NEW.user_id, position_title;
    END IF;
    
    -- When verification_status changes FROM 'verified' to something else
    IF OLD.verification_status = 'verified' AND NEW.verification_status != 'verified' THEN
        -- Check if user has any OTHER verified positions
        IF NOT EXISTS (
            SELECT 1 FROM office_holders 
            WHERE user_id = NEW.user_id 
            AND id != NEW.id 
            AND verification_status = 'verified'
            AND is_active = true
        ) THEN
            -- No other verified positions, remove verified status
            UPDATE profiles
            SET 
                is_verified = false,
                official_position = NULL,
                official_position_id = NULL,
                updated_at = NOW()
            WHERE id = NEW.user_id;
            
            RAISE NOTICE 'Unverified official %', NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_official_verification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_user_action"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'government_projects' AND TG_OP = 'INSERT' THEN
        INSERT INTO public.user_actions (user_id, action_type, action_value, entity_type, entity_id)
        VALUES (NEW.created_by, 'project_submitted', 10, 'project', NEW.id);
    ELSIF TG_TABLE_NAME = 'project_updates' AND TG_OP = 'INSERT' THEN
        IF NEW.is_fact_check THEN
            INSERT INTO public.user_actions (user_id, action_type, action_value, entity_type, entity_id)
            VALUES (NEW.reporter_id, 'fact_check_submitted', 5, 'update', NEW.id);
        ELSE
            INSERT INTO public.user_actions (user_id, action_type, action_value, entity_type, entity_id)
            VALUES (NEW.reporter_id, 'project_update_posted', 5, 'update', NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_user_action"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_log_post_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM log_feed_activity(
    NEW.author_id,
    'post_created',
    NEW.id::text,
    'post',
    jsonb_build_object(
      'title', NEW.title,
      'community_id', NEW.community_id,
      'content_type', NEW.content_type
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_log_post_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_log_project_submitted"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM log_feed_activity(
    NEW.created_by,
    'project_submitted',
    NEW.id::text,
    'project',
    jsonb_build_object(
      'name', NEW.title,
      'location', NEW.location,
      'county', NEW.county,
      'status', NEW.status,
      'image_url', (CASE WHEN NEW.media_urls IS NOT NULL AND array_length(NEW.media_urls, 1) > 0 THEN NEW.media_urls[1] ELSE NULL END)
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_log_project_submitted"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_administrative_division_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_administrative_division_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_all_karma"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.profiles
  SET post_karma = calculate_post_karma(id), comment_karma = calculate_comment_karma(id),
      karma = calculate_user_karma(id), last_activity = COALESCE(last_activity, NOW())
  WHERE id IN (SELECT id FROM public.profiles);
END;
$$;


ALTER FUNCTION "public"."update_all_karma"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_baraza_spaces_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_baraza_spaces_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_challenge_votes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE public.challenge_submissions
    SET votes = (SELECT COUNT(*) FROM public.challenge_votes WHERE submission_id = NEW.submission_id)
    WHERE id = NEW.submission_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_challenge_votes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_chat_room_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE chat_rooms SET updated_at = NOW() WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_chat_room_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_civic_clips_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_civic_clips_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_clip_view_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE civic_clips
  SET views_count = views_count + 1, watch_time_total = watch_time_total + NEW.watch_duration,
      average_watch_percentage = (SELECT AVG(watch_percentage) FROM civic_clip_views WHERE clip_id = NEW.clip_id),
      updated_at = now()
  WHERE id = NEW.clip_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_clip_view_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_karma_from_awards"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  comment_record RECORD;
BEGIN
  SELECT * INTO comment_record FROM public.comments WHERE id =
    CASE WHEN TG_OP = 'INSERT' THEN NEW.comment_id WHEN TG_OP = 'DELETE' THEN OLD.comment_id END;
  IF comment_record IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.comments SET karma = karma + (SELECT points FROM public.comment_awards WHERE id = NEW.award_id) WHERE id = NEW.comment_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.comments SET karma = karma - (SELECT points FROM public.comment_awards WHERE id = OLD.award_id) WHERE id = OLD.comment_id;
      RETURN OLD;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_comment_karma_from_awards"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_media_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.comments SET updated_at = now() WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_comment_media_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_vote_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  comment_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN comment_id := OLD.comment_id; ELSE comment_id := NEW.comment_id; END IF;
  IF comment_id IS NOT NULL THEN
    UPDATE public.comments
    SET upvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE comment_id = comments.id AND vote_type = 'up'), 0),
        downvotes = COALESCE((SELECT COUNT(*) FROM public.votes WHERE comment_id = comments.id AND vote_type = 'down'), 0)
    WHERE id = comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_comment_vote_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_community_active_status"("p_community_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO community_active_members (community_id, user_id, last_seen_at)
  VALUES (p_community_id, p_user_id, NOW())
  ON CONFLICT (community_id, user_id) DO UPDATE SET last_seen_at = NOW();
END;
$$;


ALTER FUNCTION "public"."update_community_active_status"("p_community_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_endorsement_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_expertise
        SET 
            endorsement_count = endorsement_count + 1,
            is_verified = CASE WHEN endorsement_count + 1 >= 10 THEN true ELSE is_verified END,
            verified_at = CASE WHEN endorsement_count + 1 >= 10 AND verified_at IS NULL THEN NOW() ELSE verified_at END,
            updated_at = NOW()
        WHERE id = NEW.expertise_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_expertise
        SET 
            endorsement_count = GREATEST(0, endorsement_count - 1),
            updated_at = NOW()
        WHERE id = OLD.expertise_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_endorsement_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_government_institution_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_government_institution_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_institution_handlers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."update_institution_handlers_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_karma_on_vote"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.post_id IS NOT NULL THEN SELECT author_id INTO affected_user_id FROM public.posts WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN SELECT author_id INTO affected_user_id FROM public.comments WHERE id = NEW.comment_id; END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN SELECT author_id INTO affected_user_id FROM public.posts WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN SELECT author_id INTO affected_user_id FROM public.comments WHERE id = OLD.comment_id; END IF;
  END IF;
  IF affected_user_id IS NOT NULL THEN
    UPDATE public.profiles SET karma = calculate_user_karma(affected_user_id), last_activity = now() WHERE id = affected_user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_karma_on_vote"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_mod_mail_thread_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE mod_mail_threads SET updated_at = NOW() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_mod_mail_thread_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_office_promises_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_office_promises_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_office_tables_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_office_tables_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_offices_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."update_offices_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_onboarding_progress_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_onboarding_progress_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_vote_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  target_post_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN target_post_id := OLD.post_id; ELSE target_post_id := NEW.post_id; END IF;
  IF target_post_id IS NOT NULL THEN
    UPDATE public.posts
    SET upvotes = COALESCE((SELECT COUNT(*) FROM public.votes v WHERE v.post_id = posts.id AND v.vote_type = 'up'), 0),
        downvotes = COALESCE((SELECT COUNT(*) FROM public.votes v WHERE v.post_id = posts.id AND v.vote_type = 'down'), 0)
    WHERE id = target_post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_post_vote_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_ratelimited"("p_display_name" "text" DEFAULT NULL::"text", "p_bio" "text" DEFAULT NULL::"text", "p_avatar_url" "text" DEFAULT NULL::"text", "p_banner_url" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check rate limit: 5 profile updates per minute
  IF NOT check_rate_limit('update_profile', 5, 1) THEN
    RETURN FALSE;
  END IF;

  -- Update profile
  UPDATE profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    bio = COALESCE(p_bio, bio),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    banner_url = COALESCE(p_banner_url, banner_url),
    updated_at = now()
  WHERE id = auth.uid();

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_profile_ratelimited"("p_display_name" "text", "p_bio" "text", "p_avatar_url" "text", "p_banner_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_verification_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE government_projects
    SET verification_count = verification_count + 1
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE government_projects
    SET verification_count = GREATEST(verification_count - 1, 0)
    WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_project_verification_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_sentiment_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  WITH sentiment_counts AS (
    SELECT 
      sentiment_id,
      SUM(CASE WHEN sentiment_type = 'positive' THEN 1 ELSE 0 END) AS pos_count,
      SUM(CASE WHEN sentiment_type = 'neutral' THEN 1 ELSE 0 END) AS neu_count,
      SUM(CASE WHEN sentiment_type = 'negative' THEN 1 ELSE 0 END) AS neg_count
    FROM public.sentiment_votes
    WHERE sentiment_id = COALESCE(NEW.sentiment_id, OLD.sentiment_id)
    GROUP BY sentiment_id
  )
  UPDATE public.sentiment_scores s
  SET 
    positive_count = sc.pos_count,
    neutral_count = sc.neu_count,
    negative_count = sc.neg_count,
    updated_at = NOW()
  FROM sentiment_counts sc
  WHERE s.id = sc.sentiment_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_sentiment_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_skill_credibility"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE public.user_skills
    SET endorsement_count = (SELECT COUNT(*) FROM public.skill_endorsements WHERE user_skill_id = NEW.user_skill_id),
        credibility_score = (SELECT COALESCE(SUM(weight), 0) FROM public.skill_endorsements WHERE user_skill_id = NEW.user_skill_id)
    WHERE id = NEW.user_skill_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_skill_credibility"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_support_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE civic_actions SET support_count = support_count + 1 WHERE id = NEW.action_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE civic_actions SET support_count = GREATEST(support_count - 1, 0) WHERE id = OLD.action_id; END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_support_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_thread_reply_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_threads 
        SET reply_count = reply_count + 1, last_reply_at = NOW()
        WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_threads 
        SET reply_count = reply_count - 1
        WHERE id = OLD.thread_id;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_thread_reply_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_activity_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  post_count INTEGER := 0;
  comment_count INTEGER := 0;
  upvote_count INTEGER := 0;
BEGIN
  IF current_setting('app.updating_activity_stats', true) = 'true' THEN RETURN NEW; END IF;
  PERFORM set_config('app.updating_activity_stats', 'true', false);
  SELECT COUNT(*) INTO post_count FROM public.posts WHERE author_id = NEW.id;
  SELECT COUNT(*) INTO comment_count FROM public.comments WHERE author_id = NEW.id;
  SELECT COUNT(*) INTO upvote_count FROM public.votes WHERE user_id = NEW.id AND vote_type = 'up';
  UPDATE public.profiles SET activity_stats = jsonb_build_object('post_count', post_count, 'comment_count', comment_count,
    'upvote_count', upvote_count, 'join_date', (SELECT created_at FROM public.profiles WHERE id = NEW.id)) WHERE id = NEW.id;
  PERFORM set_config('app.updating_activity_stats', 'false', false);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_activity_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_karma"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET karma = calculate_user_karma(NEW.author_id), last_activity = now() WHERE id = NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_karma"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_verification_truth_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  WITH vote_counts AS (
    SELECT 
      verification_id,
      SUM(CASE WHEN vote_type = 'true' THEN 1 ELSE 0 END) AS true_count,
      SUM(CASE WHEN vote_type = 'misleading' THEN 1 ELSE 0 END) AS misleading_count,
      SUM(CASE WHEN vote_type = 'outdated' THEN 1 ELSE 0 END) AS outdated_count,
      COUNT(*) AS total
    FROM public.verification_votes
    WHERE verification_id = COALESCE(NEW.verification_id, OLD.verification_id)
    GROUP BY verification_id
  )
  UPDATE public.verifications v
  SET 
    truth_score = LEAST(100, GREATEST(0, ROUND((vc.true_count::NUMERIC / NULLIF(vc.total, 0)) * 100))),
    total_votes = vc.total,
    status = CASE 
      WHEN (vc.true_count::NUMERIC / NULLIF(vc.total, 0)) > 0.8 THEN 'VERIFIED'
      WHEN vc.outdated_count > vc.true_count AND vc.outdated_count > vc.misleading_count THEN 'DEBUNKED'
      WHEN (vc.true_count::NUMERIC / NULLIF(vc.total, 0)) < 0.4 THEN 'DISPUTED'
      WHEN vc.misleading_count > vc.true_count THEN 'DISPUTED'
      ELSE 'PENDING'
    END,
    updated_at = NOW()
  FROM vote_counts vc
  WHERE v.id = vc.verification_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_verification_truth_score"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_is_room_participant"("room_uuid" "uuid", "user_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.room_id = room_uuid AND cp.user_id = user_uuid
  );
END;
$$;


ALTER FUNCTION "public"."user_is_room_participant"("room_uuid" "uuid", "user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_comment_media"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  max_file_size INTEGER := 50 * 1024 * 1024;
  allowed_image_types TEXT[] := ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  allowed_video_types TEXT[] := ARRAY['video/mp4', 'video/webm', 'video/ogg'];
  allowed_document_types TEXT[] := ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  allowed_audio_types TEXT[] := ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg'];
BEGIN
  IF NEW.file_size > max_file_size THEN RAISE EXCEPTION 'File size exceeds maximum allowed size of 50MB'; END IF;
  CASE NEW.file_type
    WHEN 'image' THEN IF NEW.mime_type NOT IN (SELECT unnest(allowed_image_types)) THEN RAISE EXCEPTION 'Invalid image file type: %', NEW.mime_type; END IF;
    WHEN 'video' THEN IF NEW.mime_type NOT IN (SELECT unnest(allowed_video_types)) THEN RAISE EXCEPTION 'Invalid video file type: %', NEW.mime_type; END IF;
    WHEN 'document' THEN IF NEW.mime_type NOT IN (SELECT unnest(allowed_document_types)) THEN RAISE EXCEPTION 'Invalid document file type: %', NEW.mime_type; END IF;
    WHEN 'audio' THEN IF NEW.mime_type NOT IN (SELECT unnest(allowed_audio_types)) THEN RAISE EXCEPTION 'Invalid audio file type: %', NEW.mime_type; END IF;
    ELSE RAISE EXCEPTION 'Invalid file type: %', NEW.file_type;
  END CASE;
  INSERT INTO public.comment_media_processing_log (media_id, action, status, message, metadata)
  VALUES (NEW.id, 'upload', 'started', 'Media upload initiated', jsonb_build_object('file_size', NEW.file_size, 'mime_type', NEW.mime_type, 'file_type', NEW.file_type));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_comment_media"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_project_location"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_county TEXT;
    v_user_constituency TEXT;
    v_user_ward TEXT;
BEGIN
    -- Allow national-level projects for everyone
    IF NEW.ward IS NULL AND NEW.constituency IS NULL AND NEW.county IS NULL THEN
        RETURN NEW; -- National project, no restriction
    END IF;

    -- Get user's location from profile
    SELECT county, constituency, ward INTO v_user_county, v_user_constituency, v_user_ward
    FROM public.profiles
    WHERE id = NEW.created_by;

    -- Hierarchical validation:
    -- User can create projects at ANY level within their location hierarchy
    
    -- County-level project: Just check county matches
    IF NEW.ward IS NULL AND NEW.constituency IS NULL AND NEW.county IS NOT NULL THEN
        IF NEW.county = v_user_county THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Constituency-level project: Check county and constituency match
    IF NEW.ward IS NULL AND NEW.constituency IS NOT NULL THEN
        IF NEW.county = v_user_county AND NEW.constituency = v_user_constituency THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Ward-level project: Check all three match
    IF NEW.ward IS NOT NULL THEN
        IF NEW.county = v_user_county AND 
           NEW.constituency = v_user_constituency AND 
           NEW.ward = v_user_ward THEN
            RETURN NEW;
        END IF;
    END IF;

    -- If we get here, location doesn't match
    RAISE EXCEPTION 'You can only post projects within your registered location. Your location: County=%, Constituency=%, Ward=%. Project location: County=%, Constituency=%, Ward=%',
        v_user_county, v_user_constituency, v_user_ward, NEW.county, NEW.constituency, NEW.ward;
END;
$$;


ALTER FUNCTION "public"."validate_project_location"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_project_location"() IS 'Validates that users can only create projects within their registered location hierarchy. Allows county, constituency, or ward level projects as long as they are within the users location.';



CREATE OR REPLACE FUNCTION "public"."vote_ratelimited"("p_target_type" "text", "p_target_id" "uuid", "p_vote_type" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check rate limit: 30 votes per minute
  IF NOT check_rate_limit('vote', 30, 1) THEN
    RETURN FALSE;
  END IF;

  -- Upsert vote
  INSERT INTO votes (
    user_id,
    post_id,
    comment_id,
    vote_type
  )
  VALUES (
    auth.uid(),
    CASE WHEN p_target_type = 'post' THEN p_target_id ELSE NULL END,
    CASE WHEN p_target_type = 'comment' THEN p_target_id ELSE NULL END,
    p_vote_type
  )
  ON CONFLICT (user_id, post_id, comment_id)
  DO UPDATE SET vote_type = EXCLUDED.vote_type;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."vote_ratelimited"("p_target_type" "text", "p_target_id" "uuid", "p_vote_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."waas_notify_guardian"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  payload    jsonb;
  _content_type text;
  _request_id bigint;
BEGIN
  -- Determine content type from the trigger's table name
  _content_type := TG_TABLE_NAME; -- 'posts' or 'comments'

  payload := jsonb_build_object(
    'type',         'INSERT',
    'table',        TG_TABLE_NAME,
    'schema',       TG_TABLE_SCHEMA,
    'content_type', _content_type,
    'record',       to_jsonb(NEW)
  );

  SELECT net.http_post(
    url     := 'https://zcnjpczplkbdmmovlrtv.supabase.co/functions/v1/civic-guardian',
    body    := payload,
    headers := '{"Content-Type":"application/json"}'::jsonb
  ) INTO _request_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."waas_notify_guardian"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accountability_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alert_type" "text" NOT NULL,
    "subject_type" "text" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "subject_name" "text",
    "severity" integer DEFAULT 5 NOT NULL,
    "summary" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "county" "text",
    "constituency" "text",
    "is_public" boolean DEFAULT true NOT NULL,
    "acknowledged" boolean DEFAULT false NOT NULL,
    "acknowledged_by" "uuid",
    "acknowledged_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "quill_draft_id" "uuid",
    CONSTRAINT "accountability_alerts_alert_type_check" CHECK (("alert_type" = ANY (ARRAY['delay'::"text", 'budget_overrun'::"text", 'stalled'::"text", 'promise_broken'::"text", 'completed_early'::"text", 'discrepancy'::"text", 'community_issue'::"text"]))),
    CONSTRAINT "accountability_alerts_severity_check" CHECK ((("severity" >= 1) AND ("severity" <= 10))),
    CONSTRAINT "accountability_alerts_subject_type_check" CHECK (("subject_type" = ANY (ARRAY['project'::"text", 'promise'::"text", 'official'::"text", 'budget'::"text", 'civic_action'::"text"])))
);


ALTER TABLE "public"."accountability_alerts" OWNER TO "postgres";


COMMENT ON TABLE "public"."accountability_alerts" IS 'Public alerts from Accountability Tracker. Shown in feed and dashboard.';



CREATE TABLE IF NOT EXISTS "public"."admin_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_role" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text",
    "action_url" "text",
    "is_read" boolean DEFAULT false,
    "read_by" "uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."administrative_divisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_code" character varying(3) NOT NULL,
    "division_code" character varying(50),
    "name" character varying(200) NOT NULL,
    "name_local" character varying(200),
    "governance_level" character varying(50) NOT NULL,
    "level_index" integer NOT NULL,
    "parent_id" "uuid",
    "population" integer,
    "area_sq_km" numeric(10,2),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "administrative_divisions_level_index_check" CHECK ((("level_index" >= 1) AND ("level_index" <= 5)))
);


ALTER TABLE "public"."administrative_divisions" OWNER TO "postgres";


COMMENT ON TABLE "public"."administrative_divisions" IS 'Polymorphic table for global administrative hierarchies supporting 1-5 governance levels';



COMMENT ON COLUMN "public"."administrative_divisions"."governance_level" IS 'Template-defined level name (e.g., state, province, prefecture, county, lga)';



COMMENT ON COLUMN "public"."administrative_divisions"."level_index" IS 'Numeric hierarchy position (1=top-level, 5=deepest)';



COMMENT ON COLUMN "public"."administrative_divisions"."parent_id" IS 'Self-referencing FK for hierarchical relationships';



COMMENT ON COLUMN "public"."administrative_divisions"."metadata" IS 'JSONB field for country-specific attributes (e.g., state_code for USA, pincode for India)';



CREATE TABLE IF NOT EXISTS "public"."agent_drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_name" "text" DEFAULT 'civic-quill'::"text" NOT NULL,
    "draft_type" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "title" "text",
    "content" "text" NOT NULL,
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "source_event" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "agent_drafts_draft_type_check" CHECK (("draft_type" = ANY (ARRAY['warning_message'::"text", 'civic_summary'::"text", 'user_notification'::"text", 'educational_post'::"text", 'accountability_report'::"text", 'alert_caption'::"text"]))),
    CONSTRAINT "agent_drafts_language_check" CHECK (("language" = ANY (ARRAY['en'::"text", 'sw'::"text", 'bilingual'::"text"]))),
    CONSTRAINT "agent_drafts_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'sent'::"text", 'rejected'::"text", 'expired'::"text"]))),
    CONSTRAINT "agent_drafts_target_type_check" CHECK (("target_type" = ANY (ARRAY['user'::"text", 'community'::"text", 'public'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."agent_drafts" OWNER TO "postgres";


COMMENT ON TABLE "public"."agent_drafts" IS 'Human-gated content queue. All Quill output requires admin approval before delivery.';



CREATE TABLE IF NOT EXISTS "public"."agent_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "source_agent" "text" NOT NULL,
    "target_agent" "text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_detail" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    CONSTRAINT "agent_events_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'done'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."agent_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."agent_events" IS 'Event bus for inter-agent communication in the WAAS system.';



CREATE TABLE IF NOT EXISTS "public"."agent_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid",
    "run_id" "uuid",
    "agent_name" "text" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "rating" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "agent_feedback_rating_check" CHECK (("rating" = ANY (ARRAY['correct'::"text", 'too_aggressive'::"text", 'too_lenient'::"text", 'wrong_category'::"text", 'hallucinated'::"text"])))
);


ALTER TABLE "public"."agent_feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."agent_feedback" IS 'Human ratings of agent decisions. Monthly review drives prompt and threshold improvements.';



CREATE TABLE IF NOT EXISTS "public"."agent_proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_name" "text" NOT NULL,
    "proposal_type" "text" NOT NULL,
    "subject_type" "text",
    "subject_id" "uuid",
    "reasoning" "text" NOT NULL,
    "confidence" double precision,
    "evidence" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "action_taken" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    CONSTRAINT "agent_proposals_confidence_check" CHECK ((("confidence" >= (0)::double precision) AND ("confidence" <= (1)::double precision))),
    CONSTRAINT "agent_proposals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'auto_actioned'::"text", 'expired'::"text"]))),
    CONSTRAINT "agent_proposals_subject_type_check" CHECK (("subject_type" = ANY (ARRAY['user'::"text", 'post'::"text", 'comment'::"text", 'project'::"text", 'promise'::"text", 'official'::"text"])))
);


ALTER TABLE "public"."agent_proposals" OWNER TO "postgres";


COMMENT ON TABLE "public"."agent_proposals" IS 'Pending agent decisions. Reviewed by Minion or human admins.';



CREATE TABLE IF NOT EXISTS "public"."agent_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_name" "text" NOT NULL,
    "trigger_type" "text" NOT NULL,
    "items_scanned" integer DEFAULT 0 NOT NULL,
    "items_actioned" integer DEFAULT 0 NOT NULL,
    "items_failed" integer DEFAULT 0 NOT NULL,
    "duration_ms" integer,
    "status" "text" NOT NULL,
    "error_summary" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "agent_runs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'partial'::"text", 'failed'::"text"]))),
    CONSTRAINT "agent_runs_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['cron'::"text", 'webhook'::"text", 'event'::"text", 'api'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."agent_runs" OWNER TO "postgres";


COMMENT ON TABLE "public"."agent_runs" IS 'Audit log for every agent execution. Use for monitoring and alerting.';



CREATE TABLE IF NOT EXISTS "public"."agent_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_name" "text" NOT NULL,
    "state_key" "text" NOT NULL,
    "state_value" "jsonb" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."agent_state" OWNER TO "postgres";


COMMENT ON TABLE "public"."agent_state" IS 'Persistent memory for each agent. Survives between runs.';



CREATE TABLE IF NOT EXISTS "public"."ai_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_slug" "text" NOT NULL,
    "api_key" "text" NOT NULL,
    "models" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_configurations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."anonymous_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "text" NOT NULL,
    "category" "text" NOT NULL,
    "severity" "text" DEFAULT 'medium'::"text" NOT NULL,
    "title" "text",
    "encrypted_content" "text" NOT NULL,
    "location_text" "text",
    "county_id" "uuid",
    "constituency_id" "uuid",
    "ward_id" "uuid",
    "evidence_count" integer DEFAULT 0,
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "escalated_to" "text"[],
    "escalated_at" timestamp with time zone,
    "assigned_to" "uuid",
    "risk_score" numeric DEFAULT 0,
    "is_identity_protected" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."anonymous_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "operation" "text" NOT NULL,
    "duration_ms" numeric NOT NULL,
    "status" "text" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_metrics" OWNER TO "postgres";


COMMENT ON TABLE "public"."api_metrics" IS 'Stores API call performance data';



CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "category" "text" NOT NULL,
    "tier" "text" DEFAULT 'bronze'::"text" NOT NULL,
    "requirements" "jsonb" NOT NULL,
    "points_reward" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "badges_category_check" CHECK (("category" = ANY (ARRAY['fact_checker'::"text", 'community_reporter'::"text", 'policy_analyst'::"text", 'voting_champion'::"text", 'civic_educator'::"text"]))),
    CONSTRAINT "badges_tier_check" CHECK (("tier" = ANY (ARRAY['bronze'::"text", 'silver'::"text", 'gold'::"text", 'platinum'::"text"])))
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."baraza_spaces" (
    "space_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "host_user_id" "uuid" NOT NULL,
    "participant_count" integer DEFAULT 0,
    "is_live" boolean DEFAULT false,
    "scheduled_start" timestamp with time zone,
    "scheduled_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."baraza_spaces" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_promises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "politician_id" "uuid" NOT NULL,
    "politician_name" character varying(255),
    "status" character varying(50) DEFAULT 'IN_PROGRESS'::character varying NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "verification_id" "uuid",
    "sentiment_id" "uuid",
    "due_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "campaign_promises_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['KEPT'::character varying, 'BROKEN'::character varying, 'IN_PROGRESS'::character varying, 'COMPROMISED'::character varying])::"text"[])))
);


ALTER TABLE "public"."campaign_promises" OWNER TO "postgres";


COMMENT ON TABLE "public"."campaign_promises" IS 'User-tracked political campaign promises';



CREATE TABLE IF NOT EXISTS "public"."challenge_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "submission" "jsonb" NOT NULL,
    "votes" integer DEFAULT 0,
    "rank" integer,
    "status" "text" DEFAULT 'pending'::"text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "challenge_submissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'winner'::"text"])))
);


ALTER TABLE "public"."challenge_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenge_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "voted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."challenge_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "voting_end_date" timestamp with time zone,
    "rules" "jsonb" DEFAULT '{}'::"jsonb",
    "reward_description" "text",
    "reward_points" integer DEFAULT 100,
    "status" "text" DEFAULT 'upcoming'::"text",
    "banner_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "challenges_category_check" CHECK (("category" = ANY (ARRAY['photo_contest'::"text", 'report_challenge'::"text", 'fact_check_marathon'::"text", 'budget_analysis'::"text"]))),
    CONSTRAINT "challenges_status_check" CHECK (("status" = ANY (ARRAY['upcoming'::"text", 'active'::"text", 'voting'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."channel_analytics" (
    "channel_id" "uuid" NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "message_count" integer DEFAULT 0,
    "post_count" integer DEFAULT 0,
    "active_users" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."channel_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" DEFAULT 'text'::"text",
    "description" "text",
    "is_private" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text" DEFAULT 'ENGAGEMENT'::"text",
    "is_locked" boolean DEFAULT false,
    "emoji_prefix" "text",
    "position" integer DEFAULT 0,
    CONSTRAINT "channels_type_check" CHECK (("type" = ANY (ARRAY['announcement'::"text", 'forum'::"text", 'chat'::"text", 'feed'::"text", 'text'::"text", 'voice'::"text", 'video'::"text"])))
);


ALTER TABLE "public"."channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "room_id" "uuid",
    "sender_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "channel_id" "uuid",
    "reply_to_id" "uuid"
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_participants" (
    "room_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "last_read_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_rooms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "name" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chat_rooms_type_check" CHECK (("type" = ANY (ARRAY['direct'::"text", 'group'::"text"])))
);


ALTER TABLE "public"."chat_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."civic_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "action_type" "text" DEFAULT 'report_issue'::"text" NOT NULL,
    "action_level" "text" DEFAULT 'ward'::"text" NOT NULL,
    "status" "text" DEFAULT 'submitted'::"text",
    "case_number" "text",
    "urgency" "text" DEFAULT 'medium'::"text",
    "ward_id" "uuid",
    "constituency_id" "uuid",
    "county_id" "uuid",
    "location_text" "text",
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "media_urls" "text"[],
    "upvotes" integer DEFAULT 0,
    "is_public" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "support_count" integer DEFAULT 0,
    "assigned_to" "uuid",
    "comment_count" integer DEFAULT 0,
    "institution_id" "uuid",
    "acknowledged_by" "uuid",
    "acknowledged_at" timestamp with time zone,
    "formal_letter" "text"
);


ALTER TABLE "public"."civic_actions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."civic_action_analytics" WITH ("security_invoker"='true') AS
 SELECT "ward_id",
    "constituency_id",
    "county_id",
    "category",
    "status",
    "count"(*) AS "issue_count",
    "avg"(
        CASE
            WHEN (("status" = 'resolved'::"text") AND ("updated_at" > "created_at")) THEN (EXTRACT(epoch FROM ("updated_at" - "created_at")) / (86400)::numeric)
            ELSE NULL::numeric
        END) AS "avg_days_to_resolve"
   FROM "public"."civic_actions"
  GROUP BY "ward_id", "constituency_id", "county_id", "category", "status";


ALTER VIEW "public"."civic_action_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."civic_action_supporters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action_id" "uuid",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."civic_action_supporters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."civic_action_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action_id" "uuid",
    "user_id" "uuid",
    "previous_status" "text",
    "new_status" "text",
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."civic_action_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."civic_clip_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clip_id" "uuid",
    "quality" "text" NOT NULL,
    "video_url" "text" NOT NULL,
    "file_size" bigint,
    "bitrate" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."civic_clip_variants" OWNER TO "postgres";


COMMENT ON TABLE "public"."civic_clip_variants" IS 'Stores different quality versions of videos for adaptive streaming';



CREATE TABLE IF NOT EXISTS "public"."civic_clip_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clip_id" "uuid",
    "user_id" "uuid",
    "watch_duration" integer NOT NULL,
    "watch_percentage" numeric(5,2),
    "completed" boolean DEFAULT false,
    "device_type" "text",
    "viewed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."civic_clip_views" OWNER TO "postgres";


COMMENT ON TABLE "public"."civic_clip_views" IS 'Tracks video viewing analytics and engagement';



COMMENT ON COLUMN "public"."civic_clip_views"."watch_percentage" IS 'Percentage of video watched (0-100)';



COMMENT ON COLUMN "public"."civic_clip_views"."completed" IS 'True if user watched >=90% of the video';



CREATE TABLE IF NOT EXISTS "public"."civic_clips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "video_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "duration" integer,
    "width" integer,
    "height" integer,
    "aspect_ratio" "text" DEFAULT '9:16'::"text",
    "file_size" bigint,
    "format" "text" DEFAULT 'mp4'::"text",
    "quality" "text" DEFAULT 'original'::"text",
    "processing_status" "text" DEFAULT 'pending'::"text",
    "processing_error" "text",
    "views_count" integer DEFAULT 0,
    "watch_time_total" integer DEFAULT 0,
    "average_watch_percentage" numeric(5,2) DEFAULT 0,
    "hashtags" "text"[] DEFAULT '{}'::"text"[],
    "category" "text",
    "civic_type" "text",
    "civic_reference_id" "uuid",
    "captions_url" "text",
    "transcript" "text",
    "is_featured" boolean DEFAULT false,
    "featured_at" timestamp with time zone,
    "featured_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "fact_check_status" "text" DEFAULT 'unverified'::"text",
    "official_response" "text" DEFAULT 'none'::"text",
    "source_citation_url" "text",
    CONSTRAINT "civic_clips_fact_check_status_check" CHECK (("fact_check_status" = ANY (ARRAY['verified'::"text", 'disputed'::"text", 'pending'::"text", 'unverified'::"text"]))),
    CONSTRAINT "civic_clips_official_response_check" CHECK (("official_response" = ANY (ARRAY['responded'::"text", 'awaiting'::"text", 'none'::"text"])))
);


ALTER TABLE "public"."civic_clips" OWNER TO "postgres";


COMMENT ON TABLE "public"."civic_clips" IS 'Stores metadata for video content (CivicClips)';



COMMENT ON COLUMN "public"."civic_clips"."processing_status" IS 'pending: uploaded, processing: being transcoded, ready: available, failed: error occurred';



COMMENT ON COLUMN "public"."civic_clips"."category" IS 'civic_education, promise_update, project_showcase, explainer, community_report, etc.';



COMMENT ON COLUMN "public"."civic_clips"."civic_reference_id" IS 'Links video to an official, promise, or project for context';



COMMENT ON COLUMN "public"."civic_clips"."fact_check_status" IS 'Status of fact checking: verified, disputed, pending, unverified';



COMMENT ON COLUMN "public"."civic_clips"."official_response" IS 'Status of official response: responded, awaiting, none';



COMMENT ON COLUMN "public"."civic_clips"."source_citation_url" IS 'URL to source citation if available';



CREATE TABLE IF NOT EXISTS "public"."civic_impact_scores" (
    "user_id" "uuid" NOT NULL,
    "impact_rating" integer DEFAULT 0,
    "trust_tier" "text" DEFAULT 'resident'::"text",
    "goat_level" integer DEFAULT 1,
    "goat_title" "text" DEFAULT 'Street Monitor'::"text",
    "goat_xp" integer DEFAULT 0,
    "actions_score" integer DEFAULT 0,
    "resolution_score" integer DEFAULT 0,
    "community_score" integer DEFAULT 0,
    "reliability_score" integer DEFAULT 0,
    "calculated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "civic_impact_scores_goat_level_check" CHECK (("goat_level" >= 1)),
    CONSTRAINT "civic_impact_scores_impact_rating_check" CHECK ((("impact_rating" >= 0) AND ("impact_rating" <= 100))),
    CONSTRAINT "civic_impact_scores_trust_tier_check" CHECK (("trust_tier" = ANY (ARRAY['resident'::"text", 'verified_resident'::"text", 'verified_user'::"text", 'verified_official'::"text"])))
);


ALTER TABLE "public"."civic_impact_scores" OWNER TO "postgres";


COMMENT ON TABLE "public"."civic_impact_scores" IS 'Core table for user civic impact ratings and GOAT levels';



CREATE TABLE IF NOT EXISTS "public"."civic_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "icon" "text",
    "category" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."civic_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."civic_issue_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comment" "text" NOT NULL,
    "media_urls" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."civic_issue_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_award_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "award_id" "uuid" NOT NULL,
    "awarded_by" "uuid" NOT NULL,
    "awarded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comment_award_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_awards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "color" "text" DEFAULT '#6B7280'::"text" NOT NULL,
    "background_color" "text" DEFAULT '#F3F4F6'::"text" NOT NULL,
    "points" integer DEFAULT 1 NOT NULL,
    "category" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_awards_category_check" CHECK (("category" = ANY (ARRAY['civic'::"text", 'helpful'::"text", 'insightful'::"text", 'creative'::"text"])))
);


ALTER TABLE "public"."comment_awards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_flairs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#6B7280'::"text" NOT NULL,
    "background_color" "text" DEFAULT '#F3F4F6'::"text" NOT NULL,
    "icon" "text",
    "category" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_flairs_category_check" CHECK (("category" = ANY (ARRAY['civic'::"text", 'discussion'::"text", 'moderation'::"text", 'fact-check'::"text"])))
);


ALTER TABLE "public"."comment_flairs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "filename" "text" NOT NULL,
    "original_filename" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "file_width" integer,
    "file_height" integer,
    "duration" integer,
    "thumbnail_path" "text",
    "caption" "text",
    "alt_text" "text",
    "upload_source" "text" DEFAULT 'direct'::"text",
    "processing_status" "text" DEFAULT 'pending'::"text",
    "processing_error" "text",
    "sort_order" integer DEFAULT 0,
    "is_nsfw" boolean DEFAULT false,
    "content_moderation_score" numeric(3,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_media_file_type_check" CHECK (("file_type" = ANY (ARRAY['image'::"text", 'video'::"text", 'document'::"text", 'audio'::"text"]))),
    CONSTRAINT "comment_media_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."comment_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_media_processing_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "media_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "status" "text" NOT NULL,
    "message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_media_processing_log_action_check" CHECK (("action" = ANY (ARRAY['upload'::"text", 'process'::"text", 'moderate'::"text", 'delete'::"text"]))),
    CONSTRAINT "comment_media_processing_log_status_check" CHECK (("status" = ANY (ARRAY['started'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."comment_media_processing_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_moderation_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "moderator_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "reason" "text",
    "previous_status" "text",
    "new_status" "text",
    "toxicity_score" numeric(3,2),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_moderation_log_action_check" CHECK (("action" = ANY (ARRAY['approve'::"text", 'remove'::"text", 'hide'::"text", 'unhide'::"text", 'fact_check'::"text", 'mark_toxic'::"text"])))
);


ALTER TABLE "public"."comment_moderation_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid",
    "recipient_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "action_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['promise_mentioned'::"text", 'project_mentioned'::"text", 'official_tagged'::"text", 'fact_check_complete'::"text", 'moderation_action'::"text"])))
);


ALTER TABLE "public"."comment_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_references" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "reference_type" "text" NOT NULL,
    "reference_id" "uuid" NOT NULL,
    "reference_title" "text",
    "reference_url" "text",
    "context" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_references_reference_type_check" CHECK (("reference_type" = ANY (ARRAY['promise'::"text", 'project'::"text", 'official'::"text", 'policy'::"text", 'budget'::"text", 'law'::"text"])))
);


ALTER TABLE "public"."comment_references" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "post_id" "uuid",
    "parent_id" "uuid",
    "upvotes" integer DEFAULT 0,
    "downvotes" integer DEFAULT 0,
    "depth" integer DEFAULT 0,
    "is_collapsed" boolean DEFAULT false,
    "moderation_status" "text" DEFAULT 'approved'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "referenced_promise_id" "uuid",
    "referenced_project_id" "uuid",
    "is_official_response" boolean DEFAULT false,
    "official_verification_id" "uuid",
    "priority_level" "text" DEFAULT 'normal'::"text",
    "civic_tags" "text"[],
    "discussion_type" "text",
    "moderator_id" "uuid",
    "moderation_reason" "text",
    "moderation_timestamp" timestamp with time zone,
    "toxicity_score" numeric(3,2),
    "content_warnings" "text"[],
    "fact_check_status" "text" DEFAULT 'unverified'::"text",
    "fact_checker_id" "uuid",
    "fact_check_notes" "text",
    "fact_check_timestamp" timestamp with time zone,
    "is_hidden" boolean DEFAULT false,
    "hidden_reason" "text",
    "appeal_status" "text" DEFAULT 'none'::"text",
    "flair_id" "uuid",
    "search_vector" "tsvector",
    "verification_id" "uuid",
    "sentiment_id" "uuid",
    "hidden_by_agent" "text",
    "agent_flags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "parent_comment_id" "uuid",
    CONSTRAINT "comments_appeal_status_check" CHECK (("appeal_status" = ANY (ARRAY['none'::"text", 'pending'::"text", 'approved'::"text", 'denied'::"text"]))),
    CONSTRAINT "comments_discussion_type_check" CHECK (("discussion_type" = ANY (ARRAY['general'::"text", 'policy'::"text", 'budget'::"text", 'service'::"text", 'accountability'::"text", 'transparency'::"text"]))),
    CONSTRAINT "comments_fact_check_status_check" CHECK (("fact_check_status" = ANY (ARRAY['unverified'::"text", 'pending'::"text", 'verified'::"text", 'disputed'::"text", 'rejected'::"text"]))),
    CONSTRAINT "comments_moderation_status_check" CHECK (("moderation_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'removed'::"text"]))),
    CONSTRAINT "comments_priority_level_check" CHECK (("priority_level" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "comments_toxicity_score_check" CHECK ((("toxicity_score" >= (0)::numeric) AND ("toxicity_score" <= (1)::numeric)))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."comments"."search_vector" IS 'Full-text search vector for comment content (trigger-maintained)';



CREATE TABLE IF NOT EXISTS "public"."communities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "member_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sensitivity_level" "text" DEFAULT 'public'::"text",
    "allow_post_flairs" boolean DEFAULT true,
    "allow_user_flairs" boolean DEFAULT true,
    "banner_url" "text",
    "theme_color" "text",
    "description_html" "text",
    "sidebar_content" "text",
    "submission_rules" "text",
    "is_nsfw" boolean DEFAULT false,
    "minimum_karma_to_post" integer DEFAULT 0,
    "auto_moderate" boolean DEFAULT false,
    "search_vector" "tsvector",
    "visibility_type" "text" DEFAULT 'public'::"text",
    "is_verified" boolean DEFAULT false,
    "is_mature" boolean DEFAULT false,
    "avatar_url" "text",
    "created_by" "uuid",
    "type" "text" DEFAULT 'interest'::"text",
    "location_type" "text",
    "location_value" "text",
    "country" "text" DEFAULT 'kenya'::"text",
    "region_type" "text",
    CONSTRAINT "communities_category_check" CHECK (("category" = ANY (ARRAY['governance'::"text", 'civic-education'::"text", 'accountability'::"text", 'discussion'::"text"]))),
    CONSTRAINT "communities_location_type_check" CHECK (("location_type" = ANY (ARRAY['county'::"text", 'constituency'::"text", 'ward'::"text", 'province'::"text", 'district'::"text", 'sector'::"text", 'state'::"text", 'lga'::"text", 'region'::"text", 'national'::"text"]))),
    CONSTRAINT "communities_sensitivity_level_check" CHECK (("sensitivity_level" = ANY (ARRAY['public'::"text", 'moderated'::"text", 'private'::"text"]))),
    CONSTRAINT "communities_type_check" CHECK (("type" = ANY (ARRAY['location'::"text", 'interest'::"text"]))),
    CONSTRAINT "communities_visibility_type_check" CHECK (("visibility_type" = ANY (ARRAY['public'::"text", 'restricted'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."communities" OWNER TO "postgres";


COMMENT ON COLUMN "public"."communities"."banner_url" IS 'Community banner image URL (recommended 1920x384px)';



COMMENT ON COLUMN "public"."communities"."description_html" IS 'Rich text HTML description of the community';



COMMENT ON COLUMN "public"."communities"."search_vector" IS 'Full-text search vector for community name and description (trigger-maintained)';



COMMENT ON COLUMN "public"."communities"."visibility_type" IS 'Public: anyone can join, Restricted: anyone can view but only approved can post, Private: invite only';



COMMENT ON COLUMN "public"."communities"."is_verified" IS 'Official/verified community badge';



COMMENT ON COLUMN "public"."communities"."is_mature" IS 'Adult content (18+) flag';



COMMENT ON COLUMN "public"."communities"."avatar_url" IS 'Community icon/avatar URL (recommended 256x256px)';



COMMENT ON COLUMN "public"."communities"."created_by" IS 'User ID of community creator (becomes first admin)';



CREATE TABLE IF NOT EXISTS "public"."community_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "community_id" "uuid",
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."community_members" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."communities_with_stats" WITH ("security_invoker"='true') AS
 SELECT "c"."id",
    "c"."name",
    "c"."display_name",
    "c"."description",
    "c"."description_html",
    "c"."category",
    "c"."banner_url",
    "c"."avatar_url",
    "c"."created_at",
    "c"."updated_at",
    "c"."created_by",
    "c"."visibility_type",
    "c"."is_verified",
    "c"."is_mature",
    COALESCE("cm"."member_count", 0) AS "member_count",
    COALESCE("public"."get_online_member_count"("c"."id"), 0) AS "online_count"
   FROM ("public"."communities" "c"
     LEFT JOIN ( SELECT "community_members"."community_id",
            ("count"(*))::integer AS "member_count"
           FROM "public"."community_members"
          GROUP BY "community_members"."community_id") "cm" ON (("c"."id" = "cm"."community_id")));


ALTER VIEW "public"."communities_with_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_active_members" (
    "community_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_active_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."community_active_members" IS 'Tracks which users are currently active/online in each community';



CREATE TABLE IF NOT EXISTS "public"."community_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "url" "text" NOT NULL,
    "icon" "text" DEFAULT 'link'::"text",
    "position" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."community_bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone,
    "location_type" "text" DEFAULT 'online'::"text",
    "location_data" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "community_events_location_type_check" CHECK (("location_type" = ANY (ARRAY['online'::"text", 'physical'::"text"])))
);


ALTER TABLE "public"."community_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_flairs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "text_color" "text" DEFAULT '#000000'::"text",
    "background_color" "text" DEFAULT '#ffffff'::"text",
    "flair_type" "text" DEFAULT 'post'::"text",
    "is_enabled" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "community_flairs_flair_type_check" CHECK (("flair_type" = ANY (ARRAY['post'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."community_flairs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_institutions" (
    "community_id" "uuid" NOT NULL,
    "institution_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_institutions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_moderators" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'moderator'::"text",
    "permissions" "jsonb" DEFAULT '{"can_ban": true, "can_flair": true, "can_delete": true, "can_approve": true}'::"jsonb",
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "is_temporary" boolean DEFAULT false,
    "term_expires_at" timestamp with time zone,
    CONSTRAINT "community_moderators_role_check" CHECK (("role" = ANY (ARRAY['moderator'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."community_moderators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_poll_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "poll_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "option_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_poll_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_polls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_polls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "priority" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "visit_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "visited_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_visits" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."constituencies" AS
 SELECT "ad"."id",
    "ad"."name",
    "ad"."parent_id" AS "county_id",
    "ad"."population",
    "ad"."created_at",
    "jsonb_build_object"('name', "parent"."name") AS "counties"
   FROM ("public"."administrative_divisions" "ad"
     LEFT JOIN "public"."administrative_divisions" "parent" ON (("ad"."parent_id" = "parent"."id")))
  WHERE (("ad"."governance_level")::"text" = 'constituency'::"text");


ALTER VIEW "public"."constituencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "comment_id" "uuid",
    "flagged_by_ai" boolean DEFAULT true,
    "verdict" "text" NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_flags_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'removed'::"text", 'warn_author'::"text", 'appealed'::"text", 'escalated'::"text"]))),
    CONSTRAINT "content_flags_target_check" CHECK (((("post_id" IS NOT NULL) AND ("comment_id" IS NULL)) OR (("post_id" IS NULL) AND ("comment_id" IS NOT NULL)))),
    CONSTRAINT "content_flags_verdict_check" CHECK (("verdict" = ANY (ARRAY['APPROVED'::"text", 'FLAGGED'::"text", 'BLOCKED'::"text", 'NEEDS_REVISION'::"text"])))
);


ALTER TABLE "public"."content_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contractors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "registration_number" character varying(100),
    "contact_person" character varying(255),
    "phone" character varying(50),
    "email" character varying(255),
    "website" character varying(255),
    "company_type" character varying(100),
    "specialization" "text"[],
    "years_experience" integer,
    "total_projects_completed" integer DEFAULT 0,
    "average_rating" numeric(3,2) DEFAULT 0.0,
    "total_ratings" integer DEFAULT 0,
    "is_verified" boolean DEFAULT false,
    "verification_date" "date",
    "blacklisted" boolean DEFAULT false,
    "blacklist_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contractors_average_rating_check" CHECK ((("average_rating" >= (0)::numeric) AND ("average_rating" <= (5)::numeric)))
);


ALTER TABLE "public"."contractors" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."contractor_contacts" WITH ("security_invoker"='true') AS
 SELECT "id",
    "name",
    "email",
    "phone",
    "contact_person",
    "website",
    "registration_number",
    "company_type",
    "specialization",
    "created_at"
   FROM "public"."contractors";


ALTER VIEW "public"."contractor_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contractor_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contractor_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "rater_id" "uuid",
    "rater_name" character varying(255),
    "overall_rating" integer NOT NULL,
    "quality_rating" integer,
    "timeliness_rating" integer,
    "communication_rating" integer,
    "professionalism_rating" integer,
    "review_text" "text",
    "recommend" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contractor_ratings_communication_rating_check" CHECK ((("communication_rating" >= 1) AND ("communication_rating" <= 5))),
    CONSTRAINT "contractor_ratings_overall_rating_check" CHECK ((("overall_rating" >= 1) AND ("overall_rating" <= 5))),
    CONSTRAINT "contractor_ratings_professionalism_rating_check" CHECK ((("professionalism_rating" >= 1) AND ("professionalism_rating" <= 5))),
    CONSTRAINT "contractor_ratings_quality_rating_check" CHECK ((("quality_rating" >= 1) AND ("quality_rating" <= 5))),
    CONSTRAINT "contractor_ratings_timeliness_rating_check" CHECK ((("timeliness_rating" >= 1) AND ("timeliness_rating" <= 5)))
);


ALTER TABLE "public"."contractor_ratings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."counties" AS
 SELECT "id",
    "name",
    "country_code" AS "country",
    "population",
    "created_at"
   FROM "public"."administrative_divisions"
  WHERE (("governance_level")::"text" = 'county'::"text");


ALTER VIEW "public"."counties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."country_governance_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_code" character varying(3) NOT NULL,
    "country_name" character varying(100) NOT NULL,
    "governance_system" "jsonb" NOT NULL,
    "flag_emoji" character varying(10),
    "is_verified" boolean DEFAULT false,
    "submitted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."country_governance_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."country_governance_templates" IS 'Stores governance structures for countries with JSONB levels array and metadata for template-driven UI rendering';



CREATE TABLE IF NOT EXISTS "public"."crisis_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "text" NOT NULL,
    "anonymous_report_id" "uuid",
    "crisis_type" "text" NOT NULL,
    "severity" "text" DEFAULT 'high'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "location_text" "text",
    "latitude" numeric,
    "longitude" numeric,
    "evidence_urls" "text"[],
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "escalated_to_ngo" "uuid"[],
    "response_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crisis_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."development_promises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "official_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "status" "public"."promise_status" DEFAULT 'not_started'::"public"."promise_status" NOT NULL,
    "budget_allocated" numeric(15,2),
    "budget_used" numeric(15,2),
    "funding_source" "text",
    "contractor" "text",
    "start_date" "date",
    "expected_completion_date" "date",
    "actual_completion_date" "date",
    "progress_percentage" integer DEFAULT 0,
    "location" "text",
    "beneficiaries_count" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector",
    "office_holder_id" "uuid",
    CONSTRAINT "development_promises_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100)))
);


ALTER TABLE "public"."development_promises" OWNER TO "postgres";


COMMENT ON COLUMN "public"."development_promises"."search_vector" IS 'Full-text search vector for promise title, description, and location (trigger-maintained)';



CREATE TABLE IF NOT EXISTS "public"."election_cycles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_id" "uuid",
    "election_date" "date" NOT NULL,
    "election_type" character varying(50),
    "declared_candidates" "jsonb" DEFAULT '[]'::"jsonb",
    "winner_user_id" "uuid",
    "results_certified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."election_cycles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "error_message" "text" NOT NULL,
    "error_stack" "text",
    "component_name" "text",
    "user_id" "uuid",
    "page_url" "text",
    "user_agent" "text",
    "severity" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "error_logs_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."error_logs" IS 'Stores application errors for monitoring';



CREATE TABLE IF NOT EXISTS "public"."expertise_endorsements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expertise_id" "uuid" NOT NULL,
    "endorser_id" "uuid" NOT NULL,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expertise_endorsements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "feature_key" "text" NOT NULL,
    "feature_name" "text" NOT NULL,
    "description" "text",
    "is_enabled" boolean DEFAULT true,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feed_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "target_id" "text",
    "target_type" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_public" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feed_activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."feed_activities" IS 'Unified activity log for all public user actions (posts, projects, promises, verifications, etc.)';



CREATE TABLE IF NOT EXISTS "public"."forum_replies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "parent_reply_id" "uuid",
    "content" "text" NOT NULL,
    "upvotes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."forum_replies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forum_reply_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reply_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."forum_reply_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forum_thread_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."forum_thread_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forum_threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "community_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "pinned" boolean DEFAULT false,
    "locked" boolean DEFAULT false,
    "reply_count" integer DEFAULT 0,
    "last_reply_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."forum_threads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goat_levels" (
    "level" integer NOT NULL,
    "title" "text" NOT NULL,
    "xp_required" integer NOT NULL,
    "description" "text",
    "badge_color" "text" DEFAULT '#3B82F6'::"text"
);


ALTER TABLE "public"."goat_levels" OWNER TO "postgres";


COMMENT ON TABLE "public"."goat_levels" IS 'Reference table for GOAT level progression system';



CREATE TABLE IF NOT EXISTS "public"."governance_hierarchies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country" "text" NOT NULL,
    "level_1_name" "text",
    "level_2_name" "text",
    "level_3_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."governance_hierarchies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."government_institutions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "acronym" character varying(20),
    "institution_type" character varying(50) NOT NULL,
    "jurisdiction_type" character varying(50) NOT NULL,
    "jurisdiction_name" character varying(200),
    "country_code" character varying(3) DEFAULT 'KE'::character varying NOT NULL,
    "parent_institution_id" "uuid",
    "reporting_level" integer DEFAULT 1,
    "description" "text",
    "website" character varying(200),
    "contact_email" character varying(200),
    "contact_phone" character varying(50),
    "physical_address" "text",
    "is_active" boolean DEFAULT true,
    "established_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "slug" character varying(120),
    "division_id" "uuid",
    "position_id" "uuid",
    "banner_url" "text",
    "custom_avatar_url" "text",
    CONSTRAINT "valid_jurisdiction" CHECK ((((("jurisdiction_type")::"text" = 'national'::"text") AND ("jurisdiction_name" IS NULL)) OR ((("jurisdiction_type")::"text" = ANY ((ARRAY['county'::character varying, 'multi-county'::character varying])::"text"[])) AND ("jurisdiction_name" IS NOT NULL))))
);


ALTER TABLE "public"."government_institutions" OWNER TO "postgres";


COMMENT ON TABLE "public"."government_institutions" IS 'Government ministries, departments, and agencies responsible for projects';



COMMENT ON COLUMN "public"."government_institutions"."jurisdiction_type" IS 'Scope of authority: national, county, or multi-county';



COMMENT ON COLUMN "public"."government_institutions"."reporting_level" IS 'Hierarchy depth: 1=Ministry, 2=Department, 3=Unit';



COMMENT ON COLUMN "public"."government_institutions"."banner_url" IS 'Custom banner image for this institution (1920x384px recommended). Falls back to linked community banner if null.';



COMMENT ON COLUMN "public"."government_institutions"."custom_avatar_url" IS 'Custom avatar for this institution. Falls back to placeholder if null.';



CREATE TABLE IF NOT EXISTS "public"."government_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_code" character varying(100) NOT NULL,
    "title" character varying(200) NOT NULL,
    "description" "text",
    "country_code" character varying(3) NOT NULL,
    "governance_level" character varying(50) NOT NULL,
    "jurisdiction_name" character varying(200) NOT NULL,
    "jurisdiction_code" character varying(50),
    "term_years" integer DEFAULT 5,
    "term_limit" integer DEFAULT 2,
    "next_election_date" "date",
    "election_type" character varying(50),
    "is_elected" boolean DEFAULT true,
    "responsibilities" "text",
    "authority_level" integer DEFAULT 50,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "banner_url" "text",
    "custom_avatar_url" "text",
    "budget_info" "jsonb",
    "resolutions" "jsonb"
);


ALTER TABLE "public"."government_positions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."government_positions"."banner_url" IS 'Custom banner image for this office position (1920x384px recommended). Falls back to linked community banner if null.';



COMMENT ON COLUMN "public"."government_positions"."custom_avatar_url" IS 'Custom avatar for this office position. Falls back to holder profile avatar or placeholder.';



CREATE TABLE IF NOT EXISTS "public"."government_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" character varying(100),
    "status" character varying(50) DEFAULT 'planned'::character varying,
    "priority" character varying(20) DEFAULT 'medium'::character varying,
    "budget_allocated" numeric(15,2),
    "budget_used" numeric(15,2),
    "funding_source" character varying(255),
    "funding_type" character varying(100),
    "location" "text",
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "county" character varying(100),
    "constituency" character varying(100),
    "ward" character varying(100),
    "planned_start_date" "date",
    "actual_start_date" "date",
    "planned_completion_date" "date",
    "actual_completion_date" "date",
    "progress_percentage" integer DEFAULT 0,
    "completion_notes" "text",
    "official_id" "uuid",
    "lead_contractor_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_updated_by" "uuid",
    "search_vector" "tsvector",
    "is_verified" boolean DEFAULT false,
    "media_urls" "text"[] DEFAULT '{}'::"text"[],
    "documents_urls" "text"[] DEFAULT '{}'::"text"[],
    "community_confidence" numeric(3,2) DEFAULT 0.0,
    "verification_id" "uuid",
    "sentiment_id" "uuid",
    "project_level" "text" DEFAULT 'county'::"text",
    "verification_count" integer DEFAULT 0,
    "primary_responsible_type" character varying(20) DEFAULT 'official'::character varying,
    "primary_official_id" "uuid",
    "primary_institution_id" "uuid",
    "office_holder_id" "uuid",
    CONSTRAINT "government_projects_community_confidence_check" CHECK ((("community_confidence" >= (0)::numeric) AND ("community_confidence" <= (1)::numeric))),
    CONSTRAINT "government_projects_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100))),
    CONSTRAINT "government_projects_project_level_check" CHECK (("project_level" = ANY (ARRAY['national'::"text", 'county'::"text", 'constituency'::"text", 'ward'::"text"])))
);


ALTER TABLE "public"."government_projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."government_projects"."search_vector" IS 'Full-text search vector for project title, description, and location (trigger-maintained)';



COMMENT ON COLUMN "public"."government_projects"."verification_id" IS 'Links to community verification data';



COMMENT ON COLUMN "public"."government_projects"."sentiment_id" IS 'Links to community sentiment tracking';



CREATE TABLE IF NOT EXISTS "public"."hidden_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "hidden_items_item_type_check" CHECK (("item_type" = ANY (ARRAY['post'::"text", 'comment'::"text"])))
);


ALTER TABLE "public"."hidden_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."institution_handlers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "granted_by_holder_id" "uuid",
    "approved_by" "uuid",
    "role" character varying(50) DEFAULT 'handler'::character varying NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "request_message" "text",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "institution_handlers_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['handler'::character varying, 'admin'::character varying])::"text"[]))),
    CONSTRAINT "institution_handlers_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."institution_handlers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."institution_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."institution_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaderboard_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "location_type" "text",
    "location_value" "text",
    "period" "text" NOT NULL,
    "total_points" integer DEFAULT 0,
    "rank" integer,
    "computed_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "leaderboard_scores_location_type_check" CHECK (("location_type" = ANY (ARRAY['ward'::"text", 'constituency'::"text", 'county'::"text", 'national'::"text"]))),
    CONSTRAINT "leaderboard_scores_period_check" CHECK (("period" = ANY (ARRAY['all_time'::"text", 'monthly'::"text", 'weekly'::"text"])))
);


ALTER TABLE "public"."leaderboard_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mod_mail_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_internal" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mod_mail_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mod_mail_threads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subject" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mod_mail_threads_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'archived'::"text", 'spam'::"text"])))
);


ALTER TABLE "public"."mod_mail_threads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderation_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "flag_id" "uuid",
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "moderation_log_action_check" CHECK (("action" = ANY (ARRAY['approve'::"text", 'remove'::"text", 'warn_author'::"text", 'escalate'::"text", 'appeal_approved'::"text", 'appeal_rejected'::"text"])))
);


ALTER TABLE "public"."moderation_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "content_type" "text" NOT NULL,
    "content_preview" "text",
    "verdict" "text" NOT NULL,
    "reason" "text",
    "ai_confidence" real,
    "model_used" "text",
    "processing_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "moderation_logs_verdict_check" CHECK (("verdict" = ANY (ARRAY['APPROVED'::"text", 'NEEDS_REVISION'::"text", 'BLOCKED'::"text"])))
);


ALTER TABLE "public"."moderation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ngo_partners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "hotline" "text",
    "website" "text",
    "logo_url" "text",
    "sla_hours" integer DEFAULT 24,
    "is_active" boolean DEFAULT true,
    "reports_received" integer DEFAULT 0,
    "avg_response_hours" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ngo_partners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."office_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "office_holder_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "reference_id" "uuid",
    "reference_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."office_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."office_holders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_id" "uuid",
    "user_id" "uuid",
    "term_start" "date" NOT NULL,
    "term_end" "date" NOT NULL,
    "is_active" boolean DEFAULT true,
    "verification_status" character varying(20) DEFAULT 'pending'::character varying,
    "verification_method" character varying(50),
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "rejection_notes" "text",
    "claimed_at" timestamp with time zone DEFAULT "now"(),
    "proof_documents" "jsonb",
    "is_historical" boolean DEFAULT false,
    CONSTRAINT "office_holders_verification_status_check" CHECK ((("verification_status")::"text" = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying, 'expired'::character varying])::"text"[])))
);


ALTER TABLE "public"."office_holders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."office_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "office_holder_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text",
    "asked_by" "uuid" NOT NULL,
    "answered_by" "uuid",
    "asked_at" timestamp with time zone DEFAULT "now"(),
    "answered_at" timestamp with time zone,
    "upvotes" integer DEFAULT 0,
    "is_pinned" boolean DEFAULT false,
    CONSTRAINT "valid_answer" CHECK (((("answer" IS NOT NULL) AND ("answered_at" IS NOT NULL) AND ("answered_by" IS NOT NULL)) OR (("answer" IS NULL) AND ("answered_at" IS NULL) AND ("answered_by" IS NULL))))
);


ALTER TABLE "public"."office_questions" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."office_dashboard_snapshot" AS
 SELECT "gp"."id" AS "position_id",
    "gp"."position_code",
    "gp"."jurisdiction_name",
    "gp"."governance_level",
    "count"(DISTINCT "dp"."id") AS "promises_total",
    "count"(DISTINCT "dp"."id") FILTER (WHERE (("dp"."status")::"text" = 'completed'::"text")) AS "promises_completed",
    "count"(DISTINCT "oq"."id") AS "questions_total",
    "count"(DISTINCT "oq"."id") FILTER (WHERE ("oq"."answer" IS NOT NULL)) AS "questions_answered",
    "count"(DISTINCT "proj"."id") AS "projects_total",
    "count"(DISTINCT "al"."id") FILTER (WHERE ("al"."created_at" > ("now"() - '30 days'::interval))) AS "activity_last_30d",
    "now"() AS "refreshed_at"
   FROM (((("public"."government_positions" "gp"
     LEFT JOIN "public"."development_promises" "dp" ON (("dp"."office_holder_id" IN ( SELECT "office_holders"."id"
           FROM "public"."office_holders"
          WHERE (("office_holders"."position_id" = "gp"."id") AND ("office_holders"."is_active" = true))))))
     LEFT JOIN "public"."office_questions" "oq" ON (("oq"."office_holder_id" IN ( SELECT "office_holders"."id"
           FROM "public"."office_holders"
          WHERE (("office_holders"."position_id" = "gp"."id") AND ("office_holders"."is_active" = true))))))
     LEFT JOIN "public"."government_projects" "proj" ON (((("proj"."county")::"text" = ("gp"."jurisdiction_name")::"text") OR (("proj"."constituency")::"text" = ("gp"."jurisdiction_name")::"text") OR (("proj"."ward")::"text" = ("gp"."jurisdiction_name")::"text"))))
     LEFT JOIN "public"."office_activity_log" "al" ON (("al"."office_holder_id" IN ( SELECT "office_holders"."id"
           FROM "public"."office_holders"
          WHERE (("office_holders"."position_id" = "gp"."id") AND ("office_holders"."is_active" = true))))))
  GROUP BY "gp"."id", "gp"."position_code", "gp"."jurisdiction_name", "gp"."governance_level"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."office_dashboard_snapshot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."office_manifestos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "office_id" "uuid",
    "uploaded_by" "uuid" NOT NULL,
    "office_holder_id" "uuid",
    "title" character varying(255) NOT NULL,
    "file_url" "text" NOT NULL,
    "file_type" character varying(50) DEFAULT 'pdf'::character varying,
    "year" integer,
    "is_pinned" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "position_id" "uuid"
);


ALTER TABLE "public"."office_manifestos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."office_promises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "office_holder_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "deadline" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "office_promises_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "office_promises_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."office_promises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."office_proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "office_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "category" character varying(100),
    "status" character varying(30) DEFAULT 'submitted'::character varying NOT NULL,
    "holder_response" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "upvotes" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "position_id" "uuid",
    CONSTRAINT "office_proposals_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['submitted'::character varying, 'under_review'::character varying, 'considered'::character varying, 'adopted'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."office_proposals" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."offices" AS
 SELECT "id",
    "id" AS "position_id",
    "position_code",
    "country_code",
    "governance_level",
    "jurisdiction_name",
    "budget_info",
    "resolutions",
    "created_at",
    "updated_at"
   FROM "public"."government_positions";


ALTER VIEW "public"."offices" OWNER TO "postgres";


COMMENT ON VIEW "public"."offices" IS 'Backward-compat view. Source of truth is government_positions.';



CREATE TABLE IF NOT EXISTS "public"."official_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "official_id" "uuid" NOT NULL,
    "contact_type" "text" NOT NULL,
    "contact_value" "text" NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "official_contacts_contact_type_check" CHECK (("contact_type" = ANY (ARRAY['email'::"text", 'phone'::"text", 'office_address'::"text", 'social_media'::"text"])))
);


ALTER TABLE "public"."official_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."official_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action_id" "uuid",
    "official_id" "uuid",
    "response_text" "text",
    "new_status" "text",
    "evidence_urls" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."official_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."official_scorecards" (
    "user_id" "uuid" NOT NULL,
    "promises_total" integer DEFAULT 0,
    "promises_kept" integer DEFAULT 0,
    "promises_broken" integer DEFAULT 0,
    "promises_in_progress" integer DEFAULT 0,
    "promise_kept_percent" integer DEFAULT 0,
    "projects_total" integer DEFAULT 0,
    "projects_stalled" integer DEFAULT 0,
    "projects_active" integer DEFAULT 0,
    "projects_completed" integer DEFAULT 0,
    "projects_cancelled" integer DEFAULT 0,
    "attendance_sessions_total" integer DEFAULT 0,
    "attendance_sessions_present" integer DEFAULT 0,
    "attendance_percent" integer DEFAULT 0,
    "total_citizen_queries" integer DEFAULT 0,
    "queries_responded" integer DEFAULT 0,
    "avg_response_hours" integer,
    "overall_grade" "text",
    "last_calculated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "official_scorecards_attendance_percent_check" CHECK ((("attendance_percent" >= 0) AND ("attendance_percent" <= 100))),
    CONSTRAINT "official_scorecards_overall_grade_check" CHECK (("overall_grade" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text", 'D'::"text", 'F'::"text", NULL::"text"]))),
    CONSTRAINT "official_scorecards_promise_kept_percent_check" CHECK ((("promise_kept_percent" >= 0) AND ("promise_kept_percent" <= 100)))
);


ALTER TABLE "public"."official_scorecards" OWNER TO "postgres";


COMMENT ON TABLE "public"."official_scorecards" IS 'Public service report cards for government officials';



CREATE TABLE IF NOT EXISTS "public"."officials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "position" "text" NOT NULL,
    "level" "public"."official_level" NOT NULL,
    "constituency" "text",
    "county" "text",
    "party" "text",
    "photo_url" "text",
    "manifesto_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector",
    "ward" "text",
    "ward_id" "uuid",
    "constituency_id" "uuid",
    "county_id" "uuid",
    "bio" "text",
    "committees" "jsonb" DEFAULT '[]'::"jsonb",
    "education" "jsonb" DEFAULT '[]'::"jsonb",
    "experience" "jsonb" DEFAULT '[]'::"jsonb",
    "deprecated_at" timestamp with time zone DEFAULT "now"(),
    "migration_note" "text" DEFAULT 'Use office_holders table instead. This table is kept for FK integrity only.'::"text"
);


ALTER TABLE "public"."officials" OWNER TO "postgres";


COMMENT ON TABLE "public"."officials" IS 'DEPRECATED: superseded by office_holders (2026-03-06). Kept for FK integrity. Do not insert new rows.';



COMMENT ON COLUMN "public"."officials"."search_vector" IS 'Full-text search vector for official name, position, and location (trigger-maintained)';



CREATE TABLE IF NOT EXISTS "public"."onboarding_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "step_completed" integer DEFAULT 0,
    "location_set" boolean DEFAULT false,
    "interests_set" boolean DEFAULT false,
    "persona_set" boolean DEFAULT false,
    "communities_joined" integer DEFAULT 0,
    "first_post" boolean DEFAULT false,
    "first_comment" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."onboarding_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "value" numeric NOT NULL,
    "rating" "text",
    "user_id" "uuid",
    "page_url" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."performance_metrics" OWNER TO "postgres";


COMMENT ON TABLE "public"."performance_metrics" IS 'Stores Web Vitals metrics (LCP, FID, CLS, etc.)';



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "community_id" "uuid",
    "official_id" "uuid",
    "upvotes" integer DEFAULT 0,
    "downvotes" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content_sensitivity" "text" DEFAULT 'public'::"text",
    "is_ngo_verified" boolean DEFAULT false,
    "search_vector" "tsvector",
    "content_type" "public"."content_type" DEFAULT 'text'::"public"."content_type",
    "video_data" "jsonb",
    "verification_id" "uuid",
    "sentiment_id" "uuid",
    "link_url" "text",
    "link_title" "text",
    "link_description" "text",
    "link_image" "text",
    "is_hidden" boolean DEFAULT false NOT NULL,
    "hidden_reason" "text",
    "hidden_by_agent" "text",
    "verification_status" "text" DEFAULT 'unverified'::"text",
    "verification_source" "text",
    "agent_flags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "posts_content_sensitivity_check" CHECK (("content_sensitivity" = ANY (ARRAY['public'::"text", 'sensitive'::"text", 'crisis'::"text"]))),
    CONSTRAINT "posts_verification_status_check" CHECK (("verification_status" = ANY (ARRAY['unverified'::"text", 'verified'::"text", 'disputed'::"text", 'insufficient_evidence'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."posts"."search_vector" IS 'Full-text search vector for post title, content, and tags (trigger-maintained)';



COMMENT ON COLUMN "public"."posts"."verification_id" IS 'Links to community verification data';



COMMENT ON COLUMN "public"."posts"."sentiment_id" IS 'Links to community sentiment tracking';



CREATE MATERIALIZED VIEW "public"."popular_communities" AS
 SELECT "c"."id",
    "c"."name",
    "c"."display_name",
    "c"."description",
    "c"."member_count",
    "c"."category",
    "c"."created_at",
    (COALESCE("recent_posts"."count", (0)::bigint) + ("c"."member_count" / 10)) AS "activity_score"
   FROM ("public"."communities" "c"
     LEFT JOIN ( SELECT "posts"."community_id",
            "count"(*) AS "count"
           FROM "public"."posts"
          WHERE ("posts"."created_at" > ("now"() - '7 days'::interval))
          GROUP BY "posts"."community_id") "recent_posts" ON (("c"."id" = "recent_posts"."community_id")))
  WHERE ("c"."member_count" > 0)
  ORDER BY (COALESCE("recent_posts"."count", (0)::bigint) + ("c"."member_count" / 10)) DESC
 LIMIT 100
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."popular_communities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."position_communities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_id" "uuid",
    "community_id" "uuid",
    "access_level" character varying(20) DEFAULT 'public'::character varying,
    "auto_moderation" boolean DEFAULT true
);


ALTER TABLE "public"."position_communities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_media" (
    "post_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "filename" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" bigint,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."post_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_customizations" (
    "user_id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'dark'::"text",
    "frame_animation" "text",
    "accent_color" "text" DEFAULT '#3B82F6'::"text",
    "banner_animation_url" "text",
    "walkout_sound_url" "text",
    "has_premium_features" boolean DEFAULT false,
    "premium_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profile_customizations_frame_animation_check" CHECK (("frame_animation" = ANY (ARRAY[NULL::"text", 'ballot_spin'::"text", 'flag_wave'::"text", 'stars_glow'::"text", 'civic_pulse'::"text", 'verified_shine'::"text"]))),
    CONSTRAINT "profile_customizations_theme_check" CHECK (("theme" = ANY (ARRAY['light'::"text", 'dark'::"text", 'county_nairobi'::"text", 'county_mombasa'::"text", 'county_kisumu'::"text", 'county_nakuru'::"text", 'constitution_gold'::"text", 'activist_red'::"text", 'eco_green'::"text", 'civic_blue'::"text"])))
);


ALTER TABLE "public"."profile_customizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."profile_customizations" IS 'Discord-style profile personalization options';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "display_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "role" "text" DEFAULT 'citizen'::"text",
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "privacy_settings" "jsonb" DEFAULT '{"allow_contact": true, "show_voting_activity": false, "show_community_membership": false}'::"jsonb",
    "karma" integer DEFAULT 0,
    "location" "text",
    "expertise" "text"[],
    "activity_stats" "jsonb" DEFAULT '{"join_date": null, "post_count": 0, "upvote_count": 0, "comment_count": 0}'::"jsonb",
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "is_private" boolean DEFAULT false,
    "badges" "text"[] DEFAULT '{}'::"text"[],
    "website" "text",
    "social_links" "jsonb" DEFAULT '{}'::"jsonb",
    "post_karma" integer DEFAULT 0,
    "comment_karma" integer DEFAULT 0,
    "county_id" "uuid",
    "constituency_id" "uuid",
    "ward_id" "uuid",
    "persona" "public"."user_persona",
    "onboarding_completed" boolean DEFAULT false,
    "search_vector" "tsvector",
    "user_flair" "text",
    "county" "text",
    "constituency" "text",
    "ward" "text",
    "banner_url" "text",
    "title" character varying(100),
    "join_date" timestamp with time zone DEFAULT "now"(),
    "is_platform_admin" boolean DEFAULT false,
    "official_position" "text",
    "official_position_id" "uuid",
    "notification_settings" "jsonb" DEFAULT '{"on_reply": true, "on_comment": true, "on_governance": false, "weekly_digest": true, "on_issue_update": true}'::"jsonb",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['citizen'::"text", 'official'::"text", 'expert'::"text", 'journalist'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."search_vector" IS 'Full-text search vector for username, display name, and bio (trigger-maintained)';



COMMENT ON COLUMN "public"."profiles"."user_flair" IS 'User location flair (county name, Visiting, or Diaspora)';



COMMENT ON COLUMN "public"."profiles"."banner_url" IS 'User profile banner image URL (recommended 1920x384px)';



COMMENT ON COLUMN "public"."profiles"."official_position" IS 'Title of the government position if user is a verified official';



COMMENT ON COLUMN "public"."profiles"."official_position_id" IS 'Reference to government_positions if user is a verified official';



CREATE TABLE IF NOT EXISTS "public"."project_collaborating_institutions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "institution_id" "uuid" NOT NULL,
    "role" character varying(50) DEFAULT 'collaborator'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_collaborating_institutions" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_collaborating_institutions" IS 'Junction table for projects with multiple collaborating institutions';



COMMENT ON COLUMN "public"."project_collaborating_institutions"."role" IS 'Role of institution in project: lead, support, oversight, collaborator';



CREATE TABLE IF NOT EXISTS "public"."project_collaborating_officials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "official_id" "uuid" NOT NULL,
    "role" character varying(50) DEFAULT 'collaborator'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_collaborating_officials" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_collaborating_officials" IS 'Junction table for projects with multiple responsible officials';



COMMENT ON COLUMN "public"."project_collaborating_officials"."role" IS 'Role of official in project: lead, support, oversight, collaborator';



CREATE TABLE IF NOT EXISTS "public"."project_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comment_text" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_comments" IS 'User comments and discussions on government projects';



CREATE TABLE IF NOT EXISTS "public"."project_contractors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "contractor_id" "uuid" NOT NULL,
    "role" character varying(100),
    "contract_value" numeric(15,2),
    "contract_start_date" "date",
    "contract_end_date" "date",
    "performance_rating" numeric(3,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_contractors_performance_rating_check" CHECK ((("performance_rating" >= (0)::numeric) AND ("performance_rating" <= (5)::numeric)))
);


ALTER TABLE "public"."project_contractors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "update_type" character varying(50) DEFAULT 'progress'::character varying NOT NULL,
    "media_urls" "text"[],
    "created_by" "uuid" NOT NULL,
    "community_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_update_type" CHECK ((("update_type")::"text" = ANY ((ARRAY['progress'::character varying, 'milestone'::character varying, 'issue'::character varying, 'delay'::character varying, 'completion'::character varying])::"text"[])))
);


ALTER TABLE "public"."project_updates" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_updates" IS 'Project progress updates, milestones, and issues';



CREATE TABLE IF NOT EXISTS "public"."project_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "is_verified" boolean DEFAULT true,
    "verification_notes" "text",
    "media_urls" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_verifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_verifications" IS 'Community verifications of project status and progress';



CREATE TABLE IF NOT EXISTS "public"."project_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "viewed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_views" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_views" IS 'Tracks individual user views of government projects for analytics';



CREATE TABLE IF NOT EXISTS "public"."promise_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promise_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "update_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "progress_percentage" integer,
    "amount_spent" numeric(15,2),
    "photos" "jsonb",
    "documents" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."promise_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promise_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promise_id" "uuid" NOT NULL,
    "verifier_id" "uuid",
    "verifier_name" character varying(255),
    "verification_type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "photos" "text"[],
    "videos" "text"[],
    "documents" "text"[],
    "claimed_progress" integer,
    "actual_progress" integer,
    "issues_identified" "text",
    "upvotes" integer DEFAULT 0,
    "downvotes" integer DEFAULT 0,
    "community_confidence" numeric(3,2) DEFAULT 0.0,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "promise_verifications_actual_progress_check" CHECK ((("actual_progress" >= 0) AND ("actual_progress" <= 100))),
    CONSTRAINT "promise_verifications_claimed_progress_check" CHECK ((("claimed_progress" >= 0) AND ("claimed_progress" <= 100))),
    CONSTRAINT "promise_verifications_community_confidence_check" CHECK ((("community_confidence" >= (0)::numeric) AND ("community_confidence" <= (1)::numeric)))
);


ALTER TABLE "public"."promise_verifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_community_moderators" WITH ("security_invoker"='true') AS
 SELECT "cm"."id",
    "cm"."community_id",
    "cm"."user_id",
    "cm"."role",
    "cm"."added_at",
    "p"."username",
    "p"."display_name",
    "p"."avatar_url"
   FROM ("public"."community_moderators" "cm"
     LEFT JOIN "public"."profiles" "p" ON (("cm"."user_id" = "p"."id")));


ALTER VIEW "public"."public_community_moderators" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_contractors" WITH ("security_invoker"='true') AS
 SELECT "id",
    "name",
    "company_type",
    "specialization",
    "years_experience",
    "total_projects_completed",
    "average_rating",
    "total_ratings",
    "is_verified",
    "verification_date",
    "blacklisted",
    "blacklist_reason",
    "created_at",
    "updated_at",
    NULL::character varying AS "email",
    NULL::character varying AS "phone",
    NULL::character varying AS "contact_person",
    NULL::character varying AS "website",
    NULL::character varying AS "registration_number"
   FROM "public"."contractors";


ALTER VIEW "public"."public_contractors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "points" integer DEFAULT 10 NOT NULL,
    "verification_type" "text" NOT NULL,
    "requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "difficulty" "text" DEFAULT 'easy'::"text",
    "is_active" boolean DEFAULT true,
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "quests_category_check" CHECK (("category" = ANY (ARRAY['reporting'::"text", 'attendance'::"text", 'engagement'::"text", 'content'::"text", 'learning'::"text"]))),
    CONSTRAINT "quests_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['easy'::"text", 'medium'::"text", 'hard'::"text"]))),
    CONSTRAINT "quests_verification_type_check" CHECK (("verification_type" = ANY (ARRAY['photo'::"text", 'social_proof'::"text", 'official'::"text", 'automatic'::"text"])))
);


ALTER TABLE "public"."quests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rag_chat_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "sources" "jsonb",
    "model_used" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "rag_chat_history_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."rag_chat_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "request_count" integer DEFAULT 1,
    "window_start" timestamp with time zone DEFAULT "now"()
)
WITH ("autovacuum_vacuum_scale_factor"='0.01', "autovacuum_analyze_scale_factor"='0.005', "autovacuum_vacuum_cost_delay"='10');


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


COMMENT ON TABLE "public"."rate_limits" IS 'Stores rate limit counters for user actions';



CREATE OR REPLACE VIEW "public"."rate_limit_stats" AS
 SELECT "action",
    "count"(DISTINCT "user_id") AS "unique_users",
    "sum"("request_count") AS "total_requests",
    "avg"("request_count") AS "avg_requests_per_user",
    "max"("request_count") AS "max_requests",
    "min"("window_start") AS "earliest_window",
    "max"("window_start") AS "latest_window"
   FROM "public"."rate_limits"
  WHERE ("window_start" > ("now"() - '01:00:00'::interval))
  GROUP BY "action"
  ORDER BY ("sum"("request_count")) DESC;


ALTER VIEW "public"."rate_limit_stats" OWNER TO "postgres";


COMMENT ON VIEW "public"."rate_limit_stats" IS 'Aggregated rate limit statistics for monitoring';



CREATE TABLE IF NOT EXISTS "public"."routing_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "issue_description" "text" NOT NULL,
    "location" "text",
    "issue_type" "text",
    "department_slug" "text",
    "department_name" "text",
    "severity" integer,
    "confidence" real,
    "recommended_actions" "jsonb",
    "model_used" "text",
    "processing_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "routing_logs_severity_check" CHECK ((("severity" >= 1) AND ("severity" <= 10)))
);


ALTER TABLE "public"."routing_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "saved_items_item_type_check" CHECK (("item_type" = ANY (ARRAY['post'::"text", 'comment'::"text"])))
);


ALTER TABLE "public"."saved_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scout_findings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_url" "text",
    "source_type" "text",
    "title" "text",
    "summary" "text",
    "raw_content" "text",
    "relevance_score" double precision,
    "category" "text",
    "related_to" "text",
    "related_id" "uuid",
    "related_name" "text",
    "county" "text",
    "embedded" boolean DEFAULT false NOT NULL,
    "processed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "scout_findings_category_check" CHECK (("category" = ANY (ARRAY['budget'::"text", 'tender'::"text", 'scandal'::"text", 'promise'::"text", 'policy'::"text", 'official_statement'::"text", 'infrastructure'::"text", 'other'::"text"]))),
    CONSTRAINT "scout_findings_related_to_check" CHECK (("related_to" = ANY (ARRAY['project'::"text", 'official'::"text", 'policy'::"text", 'county'::"text", 'promise'::"text"]))),
    CONSTRAINT "scout_findings_relevance_score_check" CHECK ((("relevance_score" >= (0)::double precision) AND ("relevance_score" <= (1)::double precision))),
    CONSTRAINT "scout_findings_source_type_check" CHECK (("source_type" = ANY (ARRAY['hansard'::"text", 'gazette'::"text", 'county_tender'::"text", 'news'::"text", 'budget_doc'::"text", 'official_statement'::"text", 'court_ruling'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."scout_findings" OWNER TO "postgres";


COMMENT ON TABLE "public"."scout_findings" IS 'External civic intelligence collected by Scout. Source of truth for Sage and Observer.';



CREATE TABLE IF NOT EXISTS "public"."sentiment_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "content_type" character varying(50) NOT NULL,
    "positive_count" integer DEFAULT 0,
    "neutral_count" integer DEFAULT 0,
    "negative_count" integer DEFAULT 0,
    "total_count" integer GENERATED ALWAYS AS ((("positive_count" + "neutral_count") + "negative_count")) STORED,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sentiment_scores_content_type_check" CHECK ((("content_type")::"text" = ANY ((ARRAY['post'::character varying, 'comment'::character varying, 'project'::character varying, 'promise'::character varying])::"text"[])))
);


ALTER TABLE "public"."sentiment_scores" OWNER TO "postgres";


COMMENT ON TABLE "public"."sentiment_scores" IS 'Aggregated sentiment scores for content';



CREATE TABLE IF NOT EXISTS "public"."sentiment_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sentiment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sentiment_type" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sentiment_votes_sentiment_type_check" CHECK ((("sentiment_type")::"text" = ANY ((ARRAY['positive'::character varying, 'neutral'::character varying, 'negative'::character varying])::"text"[])))
);


ALTER TABLE "public"."sentiment_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."skill_endorsements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_skill_id" "uuid" NOT NULL,
    "endorsed_by" "uuid" NOT NULL,
    "weight" numeric(3,1) DEFAULT 1.0,
    "endorsement_note" "text",
    "endorsed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."skill_endorsements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "description" "text",
    "icon" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "skills_category_check" CHECK (("category" = ANY (ARRAY['budget_analysis'::"text", 'community_organizing'::"text", 'legal_knowledge'::"text", 'policy_research'::"text", 'media_relations'::"text", 'project_management'::"text"])))
);


ALTER TABLE "public"."skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_audit_log" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."trending_posts" AS
 SELECT "id",
    "title",
    "author_id",
    "community_id",
    "created_at",
    "upvotes",
    "downvotes",
    "comment_count",
    ((("upvotes" + "comment_count"))::numeric - (EXTRACT(epoch FROM ("now"() - "created_at")) / (3600)::numeric)) AS "hot_score",
        CASE
            WHEN (EXTRACT(epoch FROM ("now"() - "created_at")) > (0)::numeric) THEN ((("upvotes" - "downvotes"))::double precision / (GREATEST((1)::numeric, (EXTRACT(epoch FROM ("now"() - "created_at")) / (3600)::numeric)))::double precision)
            ELSE (0)::double precision
        END AS "rising_score"
   FROM "public"."posts" "p"
  WHERE (("created_at" > ("now"() - '7 days'::interval)) AND ("upvotes" >= 0))
  ORDER BY ((("upvotes" + "comment_count"))::numeric - (EXTRACT(epoch FROM ("now"() - "created_at")) / (3600)::numeric)) DESC
 LIMIT 500
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."trending_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "achievement_type" "text" NOT NULL,
    "achievement_name" "text",
    "achievement_description" "text",
    "earned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "action_value" integer DEFAULT 0,
    "entity_type" "text",
    "entity_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "entity_title" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "entity_type" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_activity_log_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['post_created'::"text", 'comment_created'::"text", 'post_upvoted'::"text", 'comment_upvoted'::"text", 'community_joined'::"text", 'profile_updated'::"text"]))),
    CONSTRAINT "user_activity_log_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['post'::"text", 'comment'::"text", 'community'::"text"])))
);


ALTER TABLE "public"."user_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_id" "uuid" NOT NULL,
    "progress" integer DEFAULT 0,
    "awarded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_expertise" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "expertise_type" "text" NOT NULL,
    "endorsement_count" integer DEFAULT 0,
    "verified_actions_count" integer DEFAULT 0,
    "is_verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_expertise_expertise_type_check" CHECK (("expertise_type" = ANY (ARRAY['budget_analyst'::"text", 'pothole_reporter'::"text", 'legal_eagle'::"text", 'community_organizer'::"text", 'fact_checker'::"text", 'policy_analyst'::"text", 'election_monitor'::"text", 'environment_guardian'::"text", 'education_advocate'::"text", 'health_champion'::"text"])))
);


ALTER TABLE "public"."user_expertise" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_expertise" IS 'User skills with endorsement tracking, like LinkedIn for civic engagement';



CREATE TABLE IF NOT EXISTS "public"."user_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "interest_id" "uuid",
    "selected_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_privacy_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "profile_visibility" "text" DEFAULT 'public'::"text",
    "activity_visibility" "text" DEFAULT 'public'::"text",
    "contact_visibility" "text" DEFAULT 'private'::"text",
    "show_online_status" boolean DEFAULT true,
    "allow_messages" "text" DEFAULT 'everyone'::"text",
    "data_sharing" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_privacy_settings_activity_visibility_check" CHECK (("activity_visibility" = ANY (ARRAY['public'::"text", 'friends'::"text", 'private'::"text"]))),
    CONSTRAINT "user_privacy_settings_allow_messages_check" CHECK (("allow_messages" = ANY (ARRAY['everyone'::"text", 'friends'::"text", 'nobody'::"text"]))),
    CONSTRAINT "user_privacy_settings_contact_visibility_check" CHECK (("contact_visibility" = ANY (ARRAY['public'::"text", 'friends'::"text", 'private'::"text"]))),
    CONSTRAINT "user_privacy_settings_profile_visibility_check" CHECK (("profile_visibility" = ANY (ARRAY['public'::"text", 'friends'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."user_privacy_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_quests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "quest_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "progress" integer DEFAULT 0,
    "evidence" "jsonb" DEFAULT '{}'::"jsonb",
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "rejection_reason" "text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "user_quests_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'pending_verification'::"text", 'completed'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."user_quests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" DEFAULT 'citizen'::"public"."app_role" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "assigned_by" "uuid"
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "skill_id" "uuid" NOT NULL,
    "endorsement_count" integer DEFAULT 0,
    "credibility_score" numeric(5,2) DEFAULT 0.0,
    "claimed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_warnings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "issued_by" "text" DEFAULT 'civic-guardian'::"text" NOT NULL,
    "reason" "text" NOT NULL,
    "severity" "text" DEFAULT 'warning'::"text" NOT NULL,
    "content_ref" "uuid",
    "content_type" "text",
    "expires_at" timestamp with time zone,
    "acknowledged" boolean DEFAULT false NOT NULL,
    "acknowledged_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_warnings_content_type_check" CHECK (("content_type" = ANY (ARRAY['post'::"text", 'comment'::"text"]))),
    CONSTRAINT "user_warnings_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'strike'::"text", 'temp_ban'::"text", 'permanent_ban'::"text"])))
);


ALTER TABLE "public"."user_warnings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_warnings" IS 'Formal enforcement history per user. Drives escalation logic in Guardian/Minion.';



CREATE TABLE IF NOT EXISTS "public"."vectors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(1536),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "source_type" "text",
    "source_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text"
);


ALTER TABLE "public"."vectors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "verification_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vote_type" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "verification_votes_vote_type_check" CHECK ((("vote_type")::"text" = ANY ((ARRAY['true'::character varying, 'misleading'::character varying, 'outdated'::character varying])::"text"[])))
);


ALTER TABLE "public"."verification_votes" OWNER TO "postgres";


COMMENT ON TABLE "public"."verification_votes" IS 'Individual user votes on content accuracy';



CREATE TABLE IF NOT EXISTS "public"."verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "content_type" character varying(50) NOT NULL,
    "status" character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    "truth_score" integer DEFAULT 50,
    "total_votes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "verifications_content_type_check" CHECK ((("content_type")::"text" = ANY ((ARRAY['post'::character varying, 'comment'::character varying, 'project'::character varying, 'promise'::character varying])::"text"[]))),
    CONSTRAINT "verifications_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['VERIFIED'::character varying, 'DISPUTED'::character varying, 'DEBUNKED'::character varying, 'PENDING'::character varying])::"text"[]))),
    CONSTRAINT "verifications_truth_score_check" CHECK ((("truth_score" >= 0) AND ("truth_score" <= 100)))
);


ALTER TABLE "public"."verifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."verifications" IS 'Community-driven verification system for posts, comments, projects, and promises';



CREATE TABLE IF NOT EXISTS "public"."votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid",
    "comment_id" "uuid",
    "vote_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "votes_check" CHECK ((("post_id" IS NULL) <> ("comment_id" IS NULL))),
    CONSTRAINT "votes_vote_type_check" CHECK (("vote_type" = ANY (ARRAY['up'::"text", 'down'::"text"])))
);


ALTER TABLE "public"."votes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."wards" AS
 SELECT "ad"."id",
    "ad"."name",
    "ad"."parent_id" AS "constituency_id",
    "ad"."population",
    "ad"."created_at",
    "jsonb_build_object"('name', "parent"."name", 'counties', "jsonb_build_object"('name', "grandparent"."name")) AS "constituencies"
   FROM (("public"."administrative_divisions" "ad"
     LEFT JOIN "public"."administrative_divisions" "parent" ON (("ad"."parent_id" = "parent"."id")))
     LEFT JOIN "public"."administrative_divisions" "grandparent" ON (("parent"."parent_id" = "grandparent"."id")))
  WHERE (("ad"."governance_level")::"text" = 'ward'::"text");


ALTER VIEW "public"."wards" OWNER TO "postgres";


ALTER TABLE ONLY "public"."accountability_alerts"
    ADD CONSTRAINT "accountability_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_notifications"
    ADD CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."administrative_divisions"
    ADD CONSTRAINT "administrative_divisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_drafts"
    ADD CONSTRAINT "agent_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_events"
    ADD CONSTRAINT "agent_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_feedback"
    ADD CONSTRAINT "agent_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_proposals"
    ADD CONSTRAINT "agent_proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_runs"
    ADD CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_state"
    ADD CONSTRAINT "agent_state_agent_name_state_key_key" UNIQUE ("agent_name", "state_key");



ALTER TABLE ONLY "public"."agent_state"
    ADD CONSTRAINT "agent_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_configurations"
    ADD CONSTRAINT "ai_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_configurations"
    ADD CONSTRAINT "ai_configurations_provider_slug_key" UNIQUE ("provider_slug");



ALTER TABLE ONLY "public"."anonymous_reports"
    ADD CONSTRAINT "anonymous_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."anonymous_reports"
    ADD CONSTRAINT "anonymous_reports_report_id_key" UNIQUE ("report_id");



ALTER TABLE ONLY "public"."api_metrics"
    ADD CONSTRAINT "api_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."baraza_spaces"
    ADD CONSTRAINT "baraza_spaces_pkey" PRIMARY KEY ("space_id");



ALTER TABLE ONLY "public"."campaign_promises"
    ADD CONSTRAINT "campaign_promises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_submissions"
    ADD CONSTRAINT "challenge_submissions_challenge_id_user_id_key" UNIQUE ("challenge_id", "user_id");



ALTER TABLE ONLY "public"."challenge_submissions"
    ADD CONSTRAINT "challenge_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_votes"
    ADD CONSTRAINT "challenge_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_votes"
    ADD CONSTRAINT "challenge_votes_submission_id_user_id_key" UNIQUE ("submission_id", "user_id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."channel_analytics"
    ADD CONSTRAINT "channel_analytics_pkey" PRIMARY KEY ("channel_id", "date");



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_participants"
    ADD CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("room_id", "user_id");



ALTER TABLE ONLY "public"."chat_rooms"
    ADD CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."civic_action_supporters"
    ADD CONSTRAINT "civic_action_supporters_action_id_user_id_key" UNIQUE ("action_id", "user_id");



ALTER TABLE ONLY "public"."civic_action_supporters"
    ADD CONSTRAINT "civic_action_supporters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."civic_action_updates"
    ADD CONSTRAINT "civic_action_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."civic_actions"
    ADD CONSTRAINT "civic_actions_case_number_key" UNIQUE ("case_number");



ALTER TABLE ONLY "public"."civic_actions"
    ADD CONSTRAINT "civic_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."civic_clip_variants"
    ADD CONSTRAINT "civic_clip_variants_clip_id_quality_key" UNIQUE ("clip_id", "quality");



ALTER TABLE ONLY "public"."civic_clip_variants"
    ADD CONSTRAINT "civic_clip_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."civic_clip_views"
    ADD CONSTRAINT "civic_clip_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."civic_clips"
    ADD CONSTRAINT "civic_clips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."civic_clips"
    ADD CONSTRAINT "civic_clips_post_id_key" UNIQUE ("post_id");



ALTER TABLE ONLY "public"."civic_impact_scores"
    ADD CONSTRAINT "civic_impact_scores_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."civic_interests"
    ADD CONSTRAINT "civic_interests_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."civic_interests"
    ADD CONSTRAINT "civic_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."civic_issue_comments"
    ADD CONSTRAINT "civic_issue_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_award_assignments"
    ADD CONSTRAINT "comment_award_assignments_comment_id_award_id_awarded_by_key" UNIQUE ("comment_id", "award_id", "awarded_by");



ALTER TABLE ONLY "public"."comment_award_assignments"
    ADD CONSTRAINT "comment_award_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_awards"
    ADD CONSTRAINT "comment_awards_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."comment_awards"
    ADD CONSTRAINT "comment_awards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_flairs"
    ADD CONSTRAINT "comment_flairs_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."comment_flairs"
    ADD CONSTRAINT "comment_flairs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_media"
    ADD CONSTRAINT "comment_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_media_processing_log"
    ADD CONSTRAINT "comment_media_processing_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_moderation_log"
    ADD CONSTRAINT "comment_moderation_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_notifications"
    ADD CONSTRAINT "comment_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_references"
    ADD CONSTRAINT "comment_references_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_active_members"
    ADD CONSTRAINT "community_active_members_pkey" PRIMARY KEY ("community_id", "user_id");



ALTER TABLE ONLY "public"."community_bookmarks"
    ADD CONSTRAINT "community_bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_events"
    ADD CONSTRAINT "community_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_flairs"
    ADD CONSTRAINT "community_flairs_community_id_name_flair_type_key" UNIQUE ("community_id", "name", "flair_type");



ALTER TABLE ONLY "public"."community_flairs"
    ADD CONSTRAINT "community_flairs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_institutions"
    ADD CONSTRAINT "community_institutions_pkey" PRIMARY KEY ("community_id", "institution_id");



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_user_id_community_id_key" UNIQUE ("user_id", "community_id");



ALTER TABLE ONLY "public"."community_moderators"
    ADD CONSTRAINT "community_moderators_community_id_user_id_key" UNIQUE ("community_id", "user_id");



ALTER TABLE ONLY "public"."community_moderators"
    ADD CONSTRAINT "community_moderators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_poll_votes"
    ADD CONSTRAINT "community_poll_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_poll_votes"
    ADD CONSTRAINT "community_poll_votes_poll_id_user_id_key" UNIQUE ("poll_id", "user_id");



ALTER TABLE ONLY "public"."community_polls"
    ADD CONSTRAINT "community_polls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_rules"
    ADD CONSTRAINT "community_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_visits"
    ADD CONSTRAINT "community_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_flags"
    ADD CONSTRAINT "content_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractor_ratings"
    ADD CONSTRAINT "contractor_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractors"
    ADD CONSTRAINT "contractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractors"
    ADD CONSTRAINT "contractors_registration_number_key" UNIQUE ("registration_number");



ALTER TABLE ONLY "public"."country_governance_templates"
    ADD CONSTRAINT "country_governance_templates_country_code_key" UNIQUE ("country_code");



ALTER TABLE ONLY "public"."country_governance_templates"
    ADD CONSTRAINT "country_governance_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crisis_reports"
    ADD CONSTRAINT "crisis_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crisis_reports"
    ADD CONSTRAINT "crisis_reports_report_id_key" UNIQUE ("report_id");



ALTER TABLE ONLY "public"."development_promises"
    ADD CONSTRAINT "development_promises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."election_cycles"
    ADD CONSTRAINT "election_cycles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expertise_endorsements"
    ADD CONSTRAINT "expertise_endorsements_expertise_id_endorser_id_key" UNIQUE ("expertise_id", "endorser_id");



ALTER TABLE ONLY "public"."expertise_endorsements"
    ADD CONSTRAINT "expertise_endorsements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_feature_key_key" UNIQUE ("feature_key");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_activities"
    ADD CONSTRAINT "feed_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_replies"
    ADD CONSTRAINT "forum_replies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_reply_reactions"
    ADD CONSTRAINT "forum_reply_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_reply_reactions"
    ADD CONSTRAINT "forum_reply_reactions_reply_id_user_id_emoji_key" UNIQUE ("reply_id", "user_id", "emoji");



ALTER TABLE ONLY "public"."forum_thread_reactions"
    ADD CONSTRAINT "forum_thread_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_thread_reactions"
    ADD CONSTRAINT "forum_thread_reactions_thread_id_user_id_emoji_key" UNIQUE ("thread_id", "user_id", "emoji");



ALTER TABLE ONLY "public"."forum_threads"
    ADD CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goat_levels"
    ADD CONSTRAINT "goat_levels_pkey" PRIMARY KEY ("level");



ALTER TABLE ONLY "public"."governance_hierarchies"
    ADD CONSTRAINT "governance_hierarchies_country_key" UNIQUE ("country");



ALTER TABLE ONLY "public"."governance_hierarchies"
    ADD CONSTRAINT "governance_hierarchies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."government_institutions"
    ADD CONSTRAINT "government_institutions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."government_institutions"
    ADD CONSTRAINT "government_institutions_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."government_positions"
    ADD CONSTRAINT "government_positions_country_code_governance_level_jurisdic_key" UNIQUE ("country_code", "governance_level", "jurisdiction_code", "title");



ALTER TABLE ONLY "public"."government_positions"
    ADD CONSTRAINT "government_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."government_positions"
    ADD CONSTRAINT "government_positions_position_code_key" UNIQUE ("position_code");



ALTER TABLE ONLY "public"."government_projects"
    ADD CONSTRAINT "government_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hidden_items"
    ADD CONSTRAINT "hidden_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hidden_items"
    ADD CONSTRAINT "hidden_items_user_id_item_type_item_id_key" UNIQUE ("user_id", "item_type", "item_id");



ALTER TABLE ONLY "public"."institution_handlers"
    ADD CONSTRAINT "institution_handlers_institution_id_user_id_key" UNIQUE ("institution_id", "user_id");



ALTER TABLE ONLY "public"."institution_handlers"
    ADD CONSTRAINT "institution_handlers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."institution_updates"
    ADD CONSTRAINT "institution_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaderboard_scores"
    ADD CONSTRAINT "leaderboard_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaderboard_scores"
    ADD CONSTRAINT "leaderboard_scores_user_id_location_type_location_value_per_key" UNIQUE ("user_id", "location_type", "location_value", "period");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_message_id_user_id_emoji_key" UNIQUE ("message_id", "user_id", "emoji");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mod_mail_messages"
    ADD CONSTRAINT "mod_mail_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mod_mail_threads"
    ADD CONSTRAINT "mod_mail_threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderation_log"
    ADD CONSTRAINT "moderation_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderation_logs"
    ADD CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ngo_partners"
    ADD CONSTRAINT "ngo_partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."office_activity_log"
    ADD CONSTRAINT "office_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."office_holders"
    ADD CONSTRAINT "office_holders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."office_holders"
    ADD CONSTRAINT "office_holders_position_id_user_id_term_start_key" UNIQUE ("position_id", "user_id", "term_start");



ALTER TABLE ONLY "public"."office_manifestos"
    ADD CONSTRAINT "office_manifestos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."office_promises"
    ADD CONSTRAINT "office_promises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."office_proposals"
    ADD CONSTRAINT "office_proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."office_questions"
    ADD CONSTRAINT "office_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."official_contacts"
    ADD CONSTRAINT "official_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."official_responses"
    ADD CONSTRAINT "official_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."official_scorecards"
    ADD CONSTRAINT "official_scorecards_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."officials"
    ADD CONSTRAINT "officials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_communities"
    ADD CONSTRAINT "position_communities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_communities"
    ADD CONSTRAINT "position_communities_position_id_key" UNIQUE ("position_id");



ALTER TABLE ONLY "public"."post_media"
    ADD CONSTRAINT "post_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_customizations"
    ADD CONSTRAINT "profile_customizations_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."project_collaborating_institutions"
    ADD CONSTRAINT "project_collaborating_institution_project_id_institution_id_key" UNIQUE ("project_id", "institution_id");



ALTER TABLE ONLY "public"."project_collaborating_institutions"
    ADD CONSTRAINT "project_collaborating_institutions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_collaborating_officials"
    ADD CONSTRAINT "project_collaborating_officials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_collaborating_officials"
    ADD CONSTRAINT "project_collaborating_officials_project_id_official_id_key" UNIQUE ("project_id", "official_id");



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_contractors"
    ADD CONSTRAINT "project_contractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_contractors"
    ADD CONSTRAINT "project_contractors_project_id_contractor_id_role_key" UNIQUE ("project_id", "contractor_id", "role");



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_verifications"
    ADD CONSTRAINT "project_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_verifications"
    ADD CONSTRAINT "project_verifications_project_id_user_id_key" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promise_updates"
    ADD CONSTRAINT "promise_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promise_verifications"
    ADD CONSTRAINT "promise_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quests"
    ADD CONSTRAINT "quests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rag_chat_history"
    ADD CONSTRAINT "rag_chat_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("user_id", "action");



ALTER TABLE ONLY "public"."routing_logs"
    ADD CONSTRAINT "routing_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_items"
    ADD CONSTRAINT "saved_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_items"
    ADD CONSTRAINT "saved_items_user_id_item_type_item_id_key" UNIQUE ("user_id", "item_type", "item_id");



ALTER TABLE ONLY "public"."scout_findings"
    ADD CONSTRAINT "scout_findings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sentiment_scores"
    ADD CONSTRAINT "sentiment_scores_content_id_content_type_key" UNIQUE ("content_id", "content_type");



ALTER TABLE ONLY "public"."sentiment_scores"
    ADD CONSTRAINT "sentiment_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sentiment_votes"
    ADD CONSTRAINT "sentiment_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sentiment_votes"
    ADD CONSTRAINT "sentiment_votes_sentiment_id_user_id_key" UNIQUE ("sentiment_id", "user_id");



ALTER TABLE ONLY "public"."skill_endorsements"
    ADD CONSTRAINT "skill_endorsements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skill_endorsements"
    ADD CONSTRAINT "skill_endorsements_user_skill_id_endorsed_by_key" UNIQUE ("user_skill_id", "endorsed_by");



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_audit_log"
    ADD CONSTRAINT "system_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_visits"
    ADD CONSTRAINT "unique_daily_visit" UNIQUE ("community_id", "user_id", "visit_date");



ALTER TABLE ONLY "public"."administrative_divisions"
    ADD CONSTRAINT "unique_division_code" UNIQUE ("country_code", "division_code");



ALTER TABLE ONLY "public"."administrative_divisions"
    ADD CONSTRAINT "unique_division_name_per_parent" UNIQUE ("country_code", "parent_id", "name");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_achievement_type_key" UNIQUE ("user_id", "achievement_type");



ALTER TABLE ONLY "public"."user_actions"
    ADD CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_activities"
    ADD CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_badge_id_key" UNIQUE ("user_id", "badge_id");



ALTER TABLE ONLY "public"."user_expertise"
    ADD CONSTRAINT "user_expertise_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_expertise"
    ADD CONSTRAINT "user_expertise_user_id_expertise_type_key" UNIQUE ("user_id", "expertise_type");



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_user_id_interest_id_key" UNIQUE ("user_id", "interest_id");



ALTER TABLE ONLY "public"."user_privacy_settings"
    ADD CONSTRAINT "user_privacy_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_privacy_settings"
    ADD CONSTRAINT "user_privacy_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_quests"
    ADD CONSTRAINT "user_quests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_quests"
    ADD CONSTRAINT "user_quests_user_id_quest_id_key" UNIQUE ("user_id", "quest_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_user_id_skill_id_key" UNIQUE ("user_id", "skill_id");



ALTER TABLE ONLY "public"."user_warnings"
    ADD CONSTRAINT "user_warnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vectors"
    ADD CONSTRAINT "vectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_votes"
    ADD CONSTRAINT "verification_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_votes"
    ADD CONSTRAINT "verification_votes_verification_id_user_id_key" UNIQUE ("verification_id", "user_id");



ALTER TABLE ONLY "public"."verifications"
    ADD CONSTRAINT "verifications_content_id_content_type_key" UNIQUE ("content_id", "content_type");



ALTER TABLE ONLY "public"."verifications"
    ADD CONSTRAINT "verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_user_id_comment_id_key" UNIQUE ("user_id", "comment_id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_user_id_post_id_key" UNIQUE ("user_id", "post_id");



CREATE INDEX "accountability_alerts_county_idx" ON "public"."accountability_alerts" USING "btree" ("county", "created_at" DESC);



CREATE INDEX "accountability_alerts_public_idx" ON "public"."accountability_alerts" USING "btree" ("is_public", "severity" DESC, "created_at" DESC) WHERE ("is_public" = true);



CREATE INDEX "agent_drafts_pending_idx" ON "public"."agent_drafts" USING "btree" ("status", "created_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "agent_events_status_idx" ON "public"."agent_events" USING "btree" ("status", "created_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "agent_proposals_pending_idx" ON "public"."agent_proposals" USING "btree" ("status", "created_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "agent_runs_agent_created_idx" ON "public"."agent_runs" USING "btree" ("agent_name", "created_at" DESC);



CREATE INDEX "comments_guardian_scan_idx" ON "public"."comments" USING "btree" ("created_at" DESC) WHERE ("is_hidden" = false);



CREATE INDEX "idx_action_updates_action_id" ON "public"."civic_action_updates" USING "btree" ("action_id");



CREATE INDEX "idx_actions_category" ON "public"."civic_actions" USING "btree" ("category");



CREATE INDEX "idx_actions_created_at" ON "public"."civic_actions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_actions_status" ON "public"."civic_actions" USING "btree" ("status");



CREATE INDEX "idx_actions_support_count" ON "public"."civic_actions" USING "btree" ("support_count" DESC);



CREATE INDEX "idx_actions_user_id" ON "public"."civic_actions" USING "btree" ("user_id");



CREATE INDEX "idx_active_members_community_lastseen" ON "public"."community_active_members" USING "btree" ("community_id", "last_seen_at");



CREATE INDEX "idx_admin_div_country" ON "public"."administrative_divisions" USING "btree" ("country_code");



CREATE INDEX "idx_admin_div_country_level" ON "public"."administrative_divisions" USING "btree" ("country_code", "governance_level");



CREATE INDEX "idx_admin_div_level" ON "public"."administrative_divisions" USING "btree" ("governance_level");



CREATE INDEX "idx_admin_div_level_idx" ON "public"."administrative_divisions" USING "btree" ("level_index");



CREATE INDEX "idx_admin_div_parent" ON "public"."administrative_divisions" USING "btree" ("parent_id");



CREATE INDEX "idx_api_metrics_created" ON "public"."api_metrics" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_api_metrics_operation" ON "public"."api_metrics" USING "btree" ("operation");



CREATE INDEX "idx_baraza_spaces_created_at" ON "public"."baraza_spaces" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_baraza_spaces_host_user" ON "public"."baraza_spaces" USING "btree" ("host_user_id");



CREATE INDEX "idx_baraza_spaces_is_live" ON "public"."baraza_spaces" USING "btree" ("is_live");



CREATE INDEX "idx_campaign_promises_politician" ON "public"."campaign_promises" USING "btree" ("politician_id");



CREATE INDEX "idx_campaign_promises_status" ON "public"."campaign_promises" USING "btree" ("status");



CREATE INDEX "idx_campaign_promises_submitted_by" ON "public"."campaign_promises" USING "btree" ("submitted_by");



CREATE INDEX "idx_challenge_submissions_challenge" ON "public"."challenge_submissions" USING "btree" ("challenge_id");



CREATE INDEX "idx_challenge_submissions_votes" ON "public"."challenge_submissions" USING "btree" ("votes" DESC);



CREATE INDEX "idx_channel_analytics_date" ON "public"."channel_analytics" USING "btree" ("date" DESC);



CREATE INDEX "idx_channels_community" ON "public"."channels" USING "btree" ("community_id");



CREATE INDEX "idx_chat_messages_channel" ON "public"."chat_messages" USING "btree" ("channel_id");



CREATE INDEX "idx_chat_messages_created_at" ON "public"."chat_messages" USING "btree" ("created_at");



CREATE INDEX "idx_chat_messages_reply_to" ON "public"."chat_messages" USING "btree" ("reply_to_id");



CREATE INDEX "idx_chat_messages_room" ON "public"."chat_messages" USING "btree" ("room_id");



CREATE INDEX "idx_chat_participants_room" ON "public"."chat_participants" USING "btree" ("room_id");



CREATE INDEX "idx_chat_participants_user" ON "public"."chat_participants" USING "btree" ("user_id");



CREATE INDEX "idx_civic_actions_acknowledged_by" ON "public"."civic_actions" USING "btree" ("acknowledged_by") WHERE ("acknowledged_by" IS NOT NULL);



CREATE INDEX "idx_civic_actions_institution_id" ON "public"."civic_actions" USING "btree" ("institution_id") WHERE ("institution_id" IS NOT NULL);



CREATE INDEX "idx_civic_clips_category" ON "public"."civic_clips" USING "btree" ("category");



CREATE INDEX "idx_civic_clips_created" ON "public"."civic_clips" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_civic_clips_fact_check" ON "public"."civic_clips" USING "btree" ("fact_check_status");



CREATE INDEX "idx_civic_clips_featured" ON "public"."civic_clips" USING "btree" ("is_featured", "featured_at" DESC) WHERE ("is_featured" = true);



CREATE INDEX "idx_civic_clips_hashtags" ON "public"."civic_clips" USING "gin" ("hashtags");



CREATE INDEX "idx_civic_clips_post" ON "public"."civic_clips" USING "btree" ("post_id");



CREATE INDEX "idx_civic_clips_reference" ON "public"."civic_clips" USING "btree" ("civic_type", "civic_reference_id");



CREATE INDEX "idx_civic_clips_status" ON "public"."civic_clips" USING "btree" ("processing_status");



CREATE INDEX "idx_civic_goat_level" ON "public"."civic_impact_scores" USING "btree" ("goat_level" DESC);



CREATE INDEX "idx_civic_impact_rating" ON "public"."civic_impact_scores" USING "btree" ("impact_rating" DESC);



CREATE INDEX "idx_civic_issue_comments_action" ON "public"."civic_issue_comments" USING "btree" ("action_id");



CREATE INDEX "idx_civic_issue_comments_created" ON "public"."civic_issue_comments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_civic_issue_comments_user" ON "public"."civic_issue_comments" USING "btree" ("user_id");



CREATE INDEX "idx_clip_variants_clip" ON "public"."civic_clip_variants" USING "btree" ("clip_id");



CREATE INDEX "idx_clip_views_clip" ON "public"."civic_clip_views" USING "btree" ("clip_id");



CREATE INDEX "idx_clip_views_clip_user" ON "public"."civic_clip_views" USING "btree" ("clip_id", "user_id");



CREATE INDEX "idx_clip_views_date" ON "public"."civic_clip_views" USING "btree" ("viewed_at" DESC);



CREATE INDEX "idx_clip_views_user" ON "public"."civic_clip_views" USING "btree" ("user_id");



CREATE INDEX "idx_comment_award_assignments_award_id" ON "public"."comment_award_assignments" USING "btree" ("award_id");



CREATE INDEX "idx_comment_award_assignments_awarded_by" ON "public"."comment_award_assignments" USING "btree" ("awarded_by");



CREATE INDEX "idx_comment_award_assignments_comment_id" ON "public"."comment_award_assignments" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_media_comment_id" ON "public"."comment_media" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_media_created_at" ON "public"."comment_media" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_comment_media_file_type" ON "public"."comment_media" USING "btree" ("file_type");



CREATE INDEX "idx_comment_media_processing_log_created_at" ON "public"."comment_media_processing_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_comment_media_processing_log_media_id" ON "public"."comment_media_processing_log" USING "btree" ("media_id");



CREATE INDEX "idx_comment_media_processing_status" ON "public"."comment_media" USING "btree" ("processing_status");



CREATE INDEX "idx_comment_moderation_log_comment_id" ON "public"."comment_moderation_log" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_moderation_log_created_at" ON "public"."comment_moderation_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_comment_moderation_log_moderator_id" ON "public"."comment_moderation_log" USING "btree" ("moderator_id");



CREATE INDEX "idx_comment_notifications_comment" ON "public"."comment_notifications" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_notifications_recipient" ON "public"."comment_notifications" USING "btree" ("recipient_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_comment_references_comment_id" ON "public"."comment_references" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_references_type_id" ON "public"."comment_references" USING "btree" ("reference_type", "reference_id");



CREATE INDEX "idx_comments_created_at" ON "public"."comments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_comments_discussion_type" ON "public"."comments" USING "btree" ("discussion_type");



CREATE INDEX "idx_comments_fact_check_status" ON "public"."comments" USING "btree" ("fact_check_status");



CREATE INDEX "idx_comments_fact_checker_id" ON "public"."comments" USING "btree" ("fact_checker_id");



CREATE INDEX "idx_comments_flair_id" ON "public"."comments" USING "btree" ("flair_id");



CREATE INDEX "idx_comments_moderation_status" ON "public"."comments" USING "btree" ("moderation_status");



CREATE INDEX "idx_comments_moderator_id" ON "public"."comments" USING "btree" ("moderator_id");



CREATE INDEX "idx_comments_official_response" ON "public"."comments" USING "btree" ("is_official_response");



CREATE INDEX "idx_comments_parent_comment_id" ON "public"."comments" USING "btree" ("parent_comment_id");



CREATE INDEX "idx_comments_parent_id" ON "public"."comments" USING "btree" ("parent_id") WHERE ("parent_id" IS NOT NULL);



CREATE INDEX "idx_comments_post_created" ON "public"."comments" USING "btree" ("post_id", "created_at" DESC);



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_comments_post_parent" ON "public"."comments" USING "btree" ("post_id", "parent_comment_id");



CREATE INDEX "idx_comments_priority_level" ON "public"."comments" USING "btree" ("priority_level");



CREATE INDEX "idx_comments_referenced_project" ON "public"."comments" USING "btree" ("referenced_project_id");



CREATE INDEX "idx_comments_referenced_promise" ON "public"."comments" USING "btree" ("referenced_promise_id");



CREATE INDEX "idx_comments_search" ON "public"."comments" USING "gin" ("search_vector");



CREATE INDEX "idx_comments_toxicity_score" ON "public"."comments" USING "btree" ("toxicity_score");



CREATE INDEX "idx_communities_created_by" ON "public"."communities" USING "btree" ("created_by");



CREATE UNIQUE INDEX "idx_communities_location" ON "public"."communities" USING "btree" ("location_type", "location_value") WHERE ("type" = 'location'::"text");



CREATE INDEX "idx_communities_member_count" ON "public"."communities" USING "btree" ("member_count" DESC);



CREATE INDEX "idx_communities_name" ON "public"."communities" USING "btree" ("name");



CREATE INDEX "idx_communities_search" ON "public"."communities" USING "gin" ("search_vector");



CREATE INDEX "idx_communities_sensitivity_level" ON "public"."communities" USING "btree" ("sensitivity_level");



CREATE INDEX "idx_communities_type_location" ON "public"."communities" USING "btree" ("type", "location_type", "location_value");



CREATE INDEX "idx_community_active_members_community" ON "public"."community_active_members" USING "btree" ("community_id");



CREATE INDEX "idx_community_active_members_last_seen" ON "public"."community_active_members" USING "btree" ("last_seen_at");



CREATE INDEX "idx_community_bookmarks_community" ON "public"."community_bookmarks" USING "btree" ("community_id", "position");



CREATE INDEX "idx_community_flairs_community_id" ON "public"."community_flairs" USING "btree" ("community_id");



CREATE INDEX "idx_community_institutions_community" ON "public"."community_institutions" USING "btree" ("community_id");



CREATE INDEX "idx_community_institutions_institution" ON "public"."community_institutions" USING "btree" ("institution_id");



CREATE INDEX "idx_community_members_user_community" ON "public"."community_members" USING "btree" ("user_id", "community_id");



CREATE INDEX "idx_community_moderators_community_id" ON "public"."community_moderators" USING "btree" ("community_id");



CREATE INDEX "idx_community_rules_community_id" ON "public"."community_rules" USING "btree" ("community_id");



CREATE INDEX "idx_community_visits_community_date" ON "public"."community_visits" USING "btree" ("community_id", "visit_date" DESC);



CREATE INDEX "idx_community_visits_user" ON "public"."community_visits" USING "btree" ("user_id");



CREATE INDEX "idx_content_flags_created_at" ON "public"."content_flags" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_content_flags_post_id" ON "public"."content_flags" USING "btree" ("post_id");



CREATE INDEX "idx_content_flags_status" ON "public"."content_flags" USING "btree" ("status");



CREATE INDEX "idx_contractor_ratings_contractor_id" ON "public"."contractor_ratings" USING "btree" ("contractor_id");



CREATE INDEX "idx_contractors_name" ON "public"."contractors" USING "btree" ("name");



CREATE INDEX "idx_contractors_verified" ON "public"."contractors" USING "btree" ("is_verified");



CREATE INDEX "idx_development_promises_office_holder_id" ON "public"."development_promises" USING "btree" ("office_holder_id") WHERE ("office_holder_id" IS NOT NULL);



CREATE INDEX "idx_error_logs_component" ON "public"."error_logs" USING "btree" ("component_name");



CREATE INDEX "idx_error_logs_created" ON "public"."error_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_error_logs_created_at" ON "public"."error_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_error_logs_severity" ON "public"."error_logs" USING "btree" ("severity");



CREATE INDEX "idx_error_logs_user_id" ON "public"."error_logs" USING "btree" ("user_id");



CREATE INDEX "idx_feature_flags_category" ON "public"."feature_flags" USING "btree" ("category");



CREATE INDEX "idx_feature_flags_key" ON "public"."feature_flags" USING "btree" ("feature_key");



CREATE INDEX "idx_feed_activities_created" ON "public"."feed_activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_feed_activities_public" ON "public"."feed_activities" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_feed_activities_type" ON "public"."feed_activities" USING "btree" ("activity_type");



CREATE INDEX "idx_feed_activities_user" ON "public"."feed_activities" USING "btree" ("user_id");



CREATE INDEX "idx_feed_activities_user_created" ON "public"."feed_activities" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_forum_replies_author" ON "public"."forum_replies" USING "btree" ("author_id");



CREATE INDEX "idx_forum_replies_thread" ON "public"."forum_replies" USING "btree" ("thread_id");



CREATE INDEX "idx_forum_reply_reactions_reply_id" ON "public"."forum_reply_reactions" USING "btree" ("reply_id");



CREATE INDEX "idx_forum_thread_reactions_thread_id" ON "public"."forum_thread_reactions" USING "btree" ("thread_id");



CREATE INDEX "idx_forum_threads_author" ON "public"."forum_threads" USING "btree" ("author_id");



CREATE INDEX "idx_forum_threads_channel" ON "public"."forum_threads" USING "btree" ("channel_id");



CREATE INDEX "idx_forum_threads_community" ON "public"."forum_threads" USING "btree" ("community_id");



CREATE INDEX "idx_gov_projects_office_holder" ON "public"."government_projects" USING "btree" ("office_holder_id");



CREATE UNIQUE INDEX "idx_government_institutions_slug" ON "public"."government_institutions" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);



CREATE INDEX "idx_government_projects_county" ON "public"."government_projects" USING "btree" ("county");



CREATE INDEX "idx_government_projects_location" ON "public"."government_projects" USING "gist" ("point"(("longitude")::double precision, ("latitude")::double precision));



CREATE INDEX "idx_government_projects_official_id" ON "public"."government_projects" USING "btree" ("official_id");



CREATE INDEX "idx_government_projects_status" ON "public"."government_projects" USING "btree" ("status");



CREATE INDEX "idx_govt_inst_active" ON "public"."government_institutions" USING "btree" ("is_active");



CREATE INDEX "idx_govt_inst_country" ON "public"."government_institutions" USING "btree" ("country_code");



CREATE INDEX "idx_govt_inst_jurisdiction" ON "public"."government_institutions" USING "btree" ("jurisdiction_type", "jurisdiction_name");



CREATE INDEX "idx_govt_inst_parent" ON "public"."government_institutions" USING "btree" ("parent_institution_id");



CREATE INDEX "idx_govt_inst_type" ON "public"."government_institutions" USING "btree" ("institution_type");



CREATE INDEX "idx_govt_institutions_position_id" ON "public"."government_institutions" USING "btree" ("position_id");



CREATE INDEX "idx_hidden_items_item_type" ON "public"."hidden_items" USING "btree" ("item_type");



CREATE INDEX "idx_hidden_items_user_id" ON "public"."hidden_items" USING "btree" ("user_id");



CREATE INDEX "idx_institution_handlers_institution" ON "public"."institution_handlers" USING "btree" ("institution_id");



CREATE INDEX "idx_institution_handlers_institution_id" ON "public"."institution_handlers" USING "btree" ("institution_id");



CREATE INDEX "idx_institution_handlers_status" ON "public"."institution_handlers" USING "btree" ("status");



CREATE INDEX "idx_institution_handlers_user" ON "public"."institution_handlers" USING "btree" ("user_id");



CREATE INDEX "idx_institution_handlers_user_id" ON "public"."institution_handlers" USING "btree" ("user_id");



CREATE INDEX "idx_institution_updates_created_at" ON "public"."institution_updates" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_institution_updates_institution_id" ON "public"."institution_updates" USING "btree" ("institution_id");



CREATE INDEX "idx_leaderboard_location" ON "public"."leaderboard_scores" USING "btree" ("location_type", "location_value", "period");



CREATE INDEX "idx_leaderboard_rank" ON "public"."leaderboard_scores" USING "btree" ("period", "rank");



CREATE INDEX "idx_message_reactions_message_id" ON "public"."message_reactions" USING "btree" ("message_id");



CREATE INDEX "idx_message_reactions_user_id" ON "public"."message_reactions" USING "btree" ("user_id");



CREATE INDEX "idx_mod_mail_messages_thread" ON "public"."mod_mail_messages" USING "btree" ("thread_id");



CREATE INDEX "idx_mod_mail_threads_community" ON "public"."mod_mail_threads" USING "btree" ("community_id");



CREATE INDEX "idx_mod_mail_threads_status" ON "public"."mod_mail_threads" USING "btree" ("status");



CREATE INDEX "idx_mod_mail_threads_user" ON "public"."mod_mail_threads" USING "btree" ("user_id");



CREATE INDEX "idx_office_activity_created" ON "public"."office_activity_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_office_activity_holder" ON "public"."office_activity_log" USING "btree" ("office_holder_id");



CREATE INDEX "idx_office_activity_type" ON "public"."office_activity_log" USING "btree" ("activity_type");



CREATE UNIQUE INDEX "idx_office_dashboard_snapshot_position_id" ON "public"."office_dashboard_snapshot" USING "btree" ("position_id");



CREATE INDEX "idx_office_manifestos_holder" ON "public"."office_manifestos" USING "btree" ("office_holder_id");



CREATE INDEX "idx_office_manifestos_office" ON "public"."office_manifestos" USING "btree" ("office_id");



CREATE INDEX "idx_office_promises_created" ON "public"."office_promises" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_office_promises_holder" ON "public"."office_promises" USING "btree" ("office_holder_id");



CREATE INDEX "idx_office_promises_status" ON "public"."office_promises" USING "btree" ("status");



CREATE INDEX "idx_office_proposals_office" ON "public"."office_proposals" USING "btree" ("office_id", "status");



CREATE INDEX "idx_office_proposals_status" ON "public"."office_proposals" USING "btree" ("status");



CREATE INDEX "idx_office_proposals_user" ON "public"."office_proposals" USING "btree" ("user_id");



CREATE INDEX "idx_office_questions_answered" ON "public"."office_questions" USING "btree" ("answered_at" DESC NULLS LAST);



CREATE INDEX "idx_office_questions_asked_by" ON "public"."office_questions" USING "btree" ("asked_by");



CREATE INDEX "idx_office_questions_holder" ON "public"."office_questions" USING "btree" ("office_holder_id");



CREATE INDEX "idx_office_questions_upvotes" ON "public"."office_questions" USING "btree" ("upvotes" DESC);



CREATE INDEX "idx_officials_constituency_id" ON "public"."officials" USING "btree" ("constituency_id");



CREATE INDEX "idx_officials_county" ON "public"."officials" USING "btree" ("county");



CREATE INDEX "idx_officials_county_id" ON "public"."officials" USING "btree" ("county_id");



CREATE INDEX "idx_officials_level" ON "public"."officials" USING "btree" ("level");



CREATE INDEX "idx_officials_search" ON "public"."officials" USING "gin" ("search_vector");



CREATE INDEX "idx_officials_ward_id" ON "public"."officials" USING "btree" ("ward_id");



CREATE INDEX "idx_perf_metrics_created" ON "public"."performance_metrics" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_perf_metrics_name" ON "public"."performance_metrics" USING "btree" ("metric_name");



CREATE INDEX "idx_popular_communities_activity" ON "public"."popular_communities" USING "btree" ("activity_score" DESC);



CREATE UNIQUE INDEX "idx_popular_communities_id" ON "public"."popular_communities" USING "btree" ("id");



CREATE INDEX "idx_post_media_post_id" ON "public"."post_media" USING "btree" ("post_id");



CREATE INDEX "idx_post_media_uploaded_at" ON "public"."post_media" USING "btree" ("uploaded_at");



CREATE INDEX "idx_posts_author_created" ON "public"."posts" USING "btree" ("author_id", "created_at" DESC);



CREATE INDEX "idx_posts_author_id" ON "public"."posts" USING "btree" ("author_id");



CREATE INDEX "idx_posts_community_created" ON "public"."posts" USING "btree" ("community_id", "created_at" DESC);



CREATE INDEX "idx_posts_community_id" ON "public"."posts" USING "btree" ("community_id") WHERE ("community_id" IS NOT NULL);



CREATE INDEX "idx_posts_content_sensitivity" ON "public"."posts" USING "btree" ("content_sensitivity");



CREATE INDEX "idx_posts_content_trgm" ON "public"."posts" USING "gin" ("content" "public"."gin_trgm_ops");



CREATE INDEX "idx_posts_created_at_desc" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_hot_score" ON "public"."posts" USING "btree" ("created_at" DESC, "upvotes" DESC, "comment_count" DESC);



CREATE INDEX "idx_posts_is_ngo_verified" ON "public"."posts" USING "btree" ("is_ngo_verified");



CREATE INDEX "idx_posts_search" ON "public"."posts" USING "gin" ("search_vector");



CREATE INDEX "idx_posts_title_trgm" ON "public"."posts" USING "gin" ("title" "public"."gin_trgm_ops");



CREATE INDEX "idx_posts_upvotes_desc" ON "public"."posts" USING "btree" ("upvotes" DESC);



CREATE INDEX "idx_profiles_comment_karma" ON "public"."profiles" USING "btree" ("comment_karma");



CREATE INDEX "idx_profiles_constituency" ON "public"."profiles" USING "btree" ("constituency_id");



CREATE INDEX "idx_profiles_county" ON "public"."profiles" USING "btree" ("county_id");



CREATE INDEX "idx_profiles_display_name_trgm" ON "public"."profiles" USING "gin" ("display_name" "public"."gin_trgm_ops") WHERE ("display_name" IS NOT NULL);



CREATE INDEX "idx_profiles_karma" ON "public"."profiles" USING "btree" ("karma");



CREATE INDEX "idx_profiles_last_activity" ON "public"."profiles" USING "btree" ("last_activity");



CREATE INDEX "idx_profiles_location" ON "public"."profiles" USING "btree" ("location");



CREATE INDEX "idx_profiles_platform_admin" ON "public"."profiles" USING "btree" ("is_platform_admin") WHERE ("is_platform_admin" = true);



CREATE INDEX "idx_profiles_post_karma" ON "public"."profiles" USING "btree" ("post_karma");



CREATE INDEX "idx_profiles_search" ON "public"."profiles" USING "gin" ("search_vector");



CREATE INDEX "idx_profiles_user_flair" ON "public"."profiles" USING "btree" ("user_flair");



CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "idx_profiles_ward" ON "public"."profiles" USING "btree" ("ward_id");



CREATE INDEX "idx_proj_collab_institutions_institution" ON "public"."project_collaborating_institutions" USING "btree" ("institution_id");



CREATE INDEX "idx_proj_collab_institutions_project" ON "public"."project_collaborating_institutions" USING "btree" ("project_id");



CREATE INDEX "idx_proj_collab_officials_official" ON "public"."project_collaborating_officials" USING "btree" ("official_id");



CREATE INDEX "idx_proj_collab_officials_project" ON "public"."project_collaborating_officials" USING "btree" ("project_id");



CREATE INDEX "idx_project_comments_parent" ON "public"."project_comments" USING "btree" ("parent_comment_id");



CREATE INDEX "idx_project_comments_project" ON "public"."project_comments" USING "btree" ("project_id");



CREATE INDEX "idx_project_comments_user" ON "public"."project_comments" USING "btree" ("user_id");



CREATE INDEX "idx_project_contractors_contractor_id" ON "public"."project_contractors" USING "btree" ("contractor_id");



CREATE INDEX "idx_project_contractors_project_id" ON "public"."project_contractors" USING "btree" ("project_id");



CREATE INDEX "idx_project_updates_date" ON "public"."project_updates" USING "btree" ("created_at");



CREATE INDEX "idx_project_updates_project" ON "public"."project_updates" USING "btree" ("project_id");



CREATE INDEX "idx_project_updates_type" ON "public"."project_updates" USING "btree" ("update_type");



CREATE INDEX "idx_project_updates_user" ON "public"."project_updates" USING "btree" ("created_by");



CREATE INDEX "idx_project_verifications_project" ON "public"."project_verifications" USING "btree" ("project_id");



CREATE INDEX "idx_project_verifications_user" ON "public"."project_verifications" USING "btree" ("user_id");



CREATE INDEX "idx_project_views_date" ON "public"."project_views" USING "btree" ("viewed_at");



CREATE INDEX "idx_project_views_project" ON "public"."project_views" USING "btree" ("project_id");



CREATE INDEX "idx_project_views_user" ON "public"."project_views" USING "btree" ("user_id");



CREATE INDEX "idx_projects_county" ON "public"."government_projects" USING "btree" ("county");



CREATE INDEX "idx_projects_search" ON "public"."government_projects" USING "gin" ("search_vector");



CREATE INDEX "idx_projects_status" ON "public"."government_projects" USING "btree" ("status");



CREATE INDEX "idx_promise_updates_promise_id" ON "public"."promise_updates" USING "btree" ("promise_id");



CREATE INDEX "idx_promise_verifications_promise_id" ON "public"."promise_verifications" USING "btree" ("promise_id");



CREATE INDEX "idx_promise_verifications_status" ON "public"."promise_verifications" USING "btree" ("status");



CREATE INDEX "idx_promises_category" ON "public"."development_promises" USING "btree" ("category");



CREATE INDEX "idx_promises_official" ON "public"."development_promises" USING "btree" ("official_id");



CREATE INDEX "idx_promises_official_id" ON "public"."development_promises" USING "btree" ("official_id");



CREATE INDEX "idx_promises_search" ON "public"."development_promises" USING "gin" ("search_vector");



CREATE INDEX "idx_promises_status" ON "public"."development_promises" USING "btree" ("status");



CREATE INDEX "idx_saved_items_item_type" ON "public"."saved_items" USING "btree" ("item_type");



CREATE INDEX "idx_saved_items_user_id" ON "public"."saved_items" USING "btree" ("user_id");



CREATE INDEX "idx_sentiment_scores_content" ON "public"."sentiment_scores" USING "btree" ("content_id", "content_type");



CREATE INDEX "idx_sentiment_votes_sentiment" ON "public"."sentiment_votes" USING "btree" ("sentiment_id");



CREATE INDEX "idx_skill_endorsements_user" ON "public"."skill_endorsements" USING "btree" ("endorsed_by");



CREATE INDEX "idx_supporters_action" ON "public"."civic_action_supporters" USING "btree" ("action_id");



CREATE INDEX "idx_supporters_user" ON "public"."civic_action_supporters" USING "btree" ("user_id");



CREATE INDEX "idx_trending_posts_hot_score" ON "public"."trending_posts" USING "btree" ("hot_score" DESC);



CREATE UNIQUE INDEX "idx_trending_posts_id" ON "public"."trending_posts" USING "btree" ("id");



CREATE INDEX "idx_trending_posts_rising_score" ON "public"."trending_posts" USING "btree" ("rising_score" DESC);



CREATE INDEX "idx_user_actions_type" ON "public"."user_actions" USING "btree" ("action_type");



CREATE INDEX "idx_user_actions_user_id" ON "public"."user_actions" USING "btree" ("user_id");



CREATE INDEX "idx_user_activity_log_created_at" ON "public"."user_activity_log" USING "btree" ("created_at");



CREATE INDEX "idx_user_activity_log_user_id" ON "public"."user_activity_log" USING "btree" ("user_id");



CREATE INDEX "idx_user_badges_awarded" ON "public"."user_badges" USING "btree" ("awarded_at" DESC);



CREATE INDEX "idx_user_badges_user_id" ON "public"."user_badges" USING "btree" ("user_id");



CREATE INDEX "idx_user_expertise_user" ON "public"."user_expertise" USING "btree" ("user_id");



CREATE INDEX "idx_user_expertise_verified" ON "public"."user_expertise" USING "btree" ("is_verified") WHERE ("is_verified" = true);



CREATE INDEX "idx_user_interests_user" ON "public"."user_interests" USING "btree" ("user_id");



CREATE INDEX "idx_user_quests_status" ON "public"."user_quests" USING "btree" ("status");



CREATE INDEX "idx_user_quests_user_id" ON "public"."user_quests" USING "btree" ("user_id");



CREATE INDEX "idx_verification_votes_user" ON "public"."verification_votes" USING "btree" ("user_id");



CREATE INDEX "idx_verification_votes_verification" ON "public"."verification_votes" USING "btree" ("verification_id");



CREATE INDEX "idx_verifications_content" ON "public"."verifications" USING "btree" ("content_id", "content_type");



CREATE INDEX "idx_votes_post_id" ON "public"."votes" USING "btree" ("post_id");



CREATE INDEX "idx_votes_user_post" ON "public"."votes" USING "btree" ("user_id", "post_id");



CREATE INDEX "posts_guardian_scan_idx" ON "public"."posts" USING "btree" ("created_at" DESC) WHERE ("is_hidden" = false);



CREATE INDEX "scout_findings_unprocessed_idx" ON "public"."scout_findings" USING "btree" ("processed", "created_at") WHERE ("processed" = false);



CREATE INDEX "user_warnings_unacknowledged_idx" ON "public"."user_warnings" USING "btree" ("user_id") WHERE ("acknowledged" = false);



CREATE INDEX "user_warnings_user_idx" ON "public"."user_warnings" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "vectors_embedding_idx" ON "public"."vectors" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE OR REPLACE TRIGGER "award_achievements_on_action" AFTER INSERT ON "public"."civic_actions" FOR EACH ROW EXECUTE FUNCTION "public"."check_and_award_achievements"();



CREATE OR REPLACE TRIGGER "check_badges" AFTER INSERT ON "public"."user_actions" FOR EACH ROW EXECUTE FUNCTION "public"."check_badge_progress"();



CREATE OR REPLACE TRIGGER "civic_clip_views_update_counts" AFTER INSERT ON "public"."civic_clip_views" FOR EACH ROW EXECUTE FUNCTION "public"."update_clip_view_counts"();



CREATE OR REPLACE TRIGGER "civic_clips_updated_at" BEFORE UPDATE ON "public"."civic_clips" FOR EACH ROW EXECUTE FUNCTION "public"."update_civic_clips_updated_at"();



CREATE OR REPLACE TRIGGER "comments_search_vector_trigger" BEFORE INSERT OR UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."comments_search_vector_update"();



CREATE OR REPLACE TRIGGER "communities_search_vector_trigger" BEFORE INSERT OR UPDATE ON "public"."communities" FOR EACH ROW EXECUTE FUNCTION "public"."communities_search_vector_update"();



CREATE OR REPLACE TRIGGER "create_civic_notifications_trigger" AFTER INSERT ON "public"."comments" FOR EACH ROW WHEN ((("new"."referenced_promise_id" IS NOT NULL) OR ("new"."referenced_project_id" IS NOT NULL))) EXECUTE FUNCTION "public"."create_civic_notifications"();



CREATE OR REPLACE TRIGGER "create_comment_references_trigger" AFTER INSERT OR UPDATE ON "public"."comments" FOR EACH ROW WHEN ((("new"."referenced_promise_id" IS NOT NULL) OR ("new"."referenced_project_id" IS NOT NULL) OR ("new"."is_official_response" = true))) EXECUTE FUNCTION "public"."create_comment_references"();



CREATE OR REPLACE TRIGGER "development_promises_search_vector_trigger" BEFORE INSERT OR UPDATE ON "public"."development_promises" FOR EACH ROW EXECUTE FUNCTION "public"."development_promises_search_vector_update"();



CREATE OR REPLACE TRIGGER "government_projects_search_vector_trigger" BEFORE INSERT OR UPDATE ON "public"."government_projects" FOR EACH ROW EXECUTE FUNCTION "public"."government_projects_search_vector_update"();



CREATE OR REPLACE TRIGGER "handle_institution_handlers_updated_at" BEFORE UPDATE ON "public"."institution_handlers" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_institution_updates_updated_at" BEFORE UPDATE ON "public"."institution_updates" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "log_comment_activity" AFTER INSERT OR DELETE OR UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_activity"();



CREATE OR REPLACE TRIGGER "log_comment_moderation_trigger" AFTER UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."log_comment_moderation"();



CREATE OR REPLACE TRIGGER "log_post_activity" AFTER INSERT OR DELETE OR UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_activity"();



CREATE OR REPLACE TRIGGER "officials_search_vector_trigger" BEFORE INSERT OR UPDATE ON "public"."officials" FOR EACH ROW EXECUTE FUNCTION "public"."officials_search_vector_update"();



CREATE OR REPLACE TRIGGER "on_challenge_vote" AFTER INSERT OR DELETE ON "public"."challenge_votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_challenge_votes"();



CREATE OR REPLACE TRIGGER "on_channel_delete" BEFORE DELETE ON "public"."channels" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_locked_channel_deletion"();



CREATE OR REPLACE TRIGGER "on_community_created_seed_channels" AFTER INSERT ON "public"."communities" FOR EACH ROW EXECUTE FUNCTION "public"."seed_community_channels"();



CREATE OR REPLACE TRIGGER "on_forum_reply_change" AFTER INSERT OR DELETE ON "public"."forum_replies" FOR EACH ROW EXECUTE FUNCTION "public"."update_thread_reply_count"();



CREATE OR REPLACE TRIGGER "on_position_created" AFTER INSERT ON "public"."government_positions" FOR EACH ROW EXECUTE FUNCTION "public"."create_office_for_position"();



CREATE OR REPLACE TRIGGER "on_post_created" AFTER INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_log_post_created"();



CREATE OR REPLACE TRIGGER "on_profile_location_change" AFTER INSERT OR UPDATE OF "county", "constituency", "ward" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_location_community_creation"();



CREATE OR REPLACE TRIGGER "on_project_created" AFTER INSERT ON "public"."government_projects" FOR EACH ROW WHEN (("new"."created_by" IS NOT NULL)) EXECUTE FUNCTION "public"."notify_community_on_project"();



CREATE OR REPLACE TRIGGER "on_project_submitted" AFTER INSERT ON "public"."government_projects" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_log_project_submitted"();



CREATE OR REPLACE TRIGGER "on_quest_complete" AFTER UPDATE OF "status" ON "public"."user_quests" FOR EACH ROW EXECUTE FUNCTION "public"."complete_quest"();



CREATE OR REPLACE TRIGGER "on_skill_endorsement" AFTER INSERT ON "public"."skill_endorsements" FOR EACH ROW EXECUTE FUNCTION "public"."update_skill_credibility"();



CREATE OR REPLACE TRIGGER "posts_search_vector_trigger" BEFORE INSERT OR UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."posts_search_vector_update"();



CREATE OR REPLACE TRIGGER "profiles_search_vector_trigger" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."profiles_search_vector_update"();



CREATE OR REPLACE TRIGGER "set_administrative_division_timestamp" BEFORE UPDATE ON "public"."administrative_divisions" FOR EACH ROW EXECUTE FUNCTION "public"."update_administrative_division_timestamp"();



CREATE OR REPLACE TRIGGER "set_case_number" BEFORE INSERT ON "public"."civic_actions" FOR EACH ROW EXECUTE FUNCTION "public"."generate_case_number"();



CREATE OR REPLACE TRIGGER "set_govt_institution_timestamp" BEFORE UPDATE ON "public"."government_institutions" FOR EACH ROW EXECUTE FUNCTION "public"."update_government_institution_timestamp"();



CREATE OR REPLACE TRIGGER "sync_comment_count" AFTER INSERT OR DELETE ON "public"."civic_issue_comments" FOR EACH ROW EXECUTE FUNCTION "public"."sync_issue_comment_count"();



CREATE OR REPLACE TRIGGER "track_project_submission" AFTER INSERT ON "public"."government_projects" FOR EACH ROW WHEN (("new"."created_by" IS NOT NULL)) EXECUTE FUNCTION "public"."track_user_action"();



CREATE OR REPLACE TRIGGER "trg_auto_link_positions" AFTER INSERT ON "public"."communities" FOR EACH ROW EXECUTE FUNCTION "public"."auto_link_positions_to_community"();



CREATE OR REPLACE TRIGGER "trg_auto_office_on_position" AFTER INSERT ON "public"."government_positions" FOR EACH ROW EXECUTE FUNCTION "public"."auto_create_office_for_position"();



CREATE OR REPLACE TRIGGER "trg_escalate_civic_issue" AFTER INSERT ON "public"."civic_action_supporters" FOR EACH ROW EXECUTE FUNCTION "public"."maybe_escalate_civic_issue"();



CREATE OR REPLACE TRIGGER "trg_institution_handlers_updated_at" BEFORE UPDATE ON "public"."institution_handlers" FOR EACH ROW EXECUTE FUNCTION "public"."update_institution_handlers_updated_at"();



CREATE OR REPLACE TRIGGER "trg_notify_accountability_alert" AFTER INSERT ON "public"."accountability_alerts" FOR EACH ROW EXECUTE FUNCTION "public"."notify_accountability_alert"();



CREATE OR REPLACE TRIGGER "trg_notify_quill_draft_approved" AFTER UPDATE ON "public"."agent_drafts" FOR EACH ROW EXECUTE FUNCTION "public"."notify_quill_draft_approved"();



CREATE OR REPLACE TRIGGER "trg_notify_status_change" AFTER UPDATE OF "status" ON "public"."civic_actions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_on_status_change"();



CREATE OR REPLACE TRIGGER "trg_notify_user_warning" AFTER INSERT ON "public"."user_warnings" FOR EACH ROW EXECUTE FUNCTION "public"."notify_user_warning"();



CREATE OR REPLACE TRIGGER "trg_office_proposals_updated_at" BEFORE UPDATE ON "public"."office_proposals" FOR EACH ROW EXECUTE FUNCTION "public"."update_offices_updated_at"();



CREATE OR REPLACE TRIGGER "trg_promise_activity" AFTER INSERT ON "public"."office_promises" FOR EACH ROW EXECUTE FUNCTION "public"."log_promise_activity"();



CREATE OR REPLACE TRIGGER "trg_question_answered_activity" AFTER UPDATE ON "public"."office_questions" FOR EACH ROW EXECUTE FUNCTION "public"."log_question_answered_activity"();



CREATE OR REPLACE TRIGGER "trg_sync_support_count" AFTER INSERT OR DELETE ON "public"."civic_action_supporters" FOR EACH ROW EXECUTE FUNCTION "public"."sync_civic_action_support_count"();



CREATE OR REPLACE TRIGGER "trigger_log_promise_creation" AFTER INSERT ON "public"."campaign_promises" FOR EACH ROW EXECUTE FUNCTION "public"."log_promise_creation"();



CREATE OR REPLACE TRIGGER "trigger_log_verification_vote" AFTER INSERT ON "public"."verification_votes" FOR EACH ROW EXECUTE FUNCTION "public"."log_verification_vote"();



CREATE OR REPLACE TRIGGER "trigger_sync_official_verification" AFTER UPDATE ON "public"."office_holders" FOR EACH ROW EXECUTE FUNCTION "public"."sync_official_verification"();



CREATE OR REPLACE TRIGGER "trigger_update_comment_vote_counts" AFTER INSERT OR DELETE OR UPDATE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_vote_counts"();



CREATE OR REPLACE TRIGGER "trigger_update_endorsement_count" AFTER INSERT OR DELETE ON "public"."expertise_endorsements" FOR EACH ROW EXECUTE FUNCTION "public"."update_endorsement_count"();



CREATE OR REPLACE TRIGGER "trigger_update_manifestos_updated_at" BEFORE UPDATE ON "public"."office_manifestos" FOR EACH ROW EXECUTE FUNCTION "public"."update_office_tables_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_office_promises_updated_at" BEFORE UPDATE ON "public"."office_promises" FOR EACH ROW EXECUTE FUNCTION "public"."update_office_promises_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_post_vote_counts" AFTER INSERT OR DELETE OR UPDATE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_vote_counts"();



CREATE OR REPLACE TRIGGER "trigger_update_proposals_updated_at" BEFORE UPDATE ON "public"."office_proposals" FOR EACH ROW EXECUTE FUNCTION "public"."update_office_tables_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_sentiment_counts" AFTER INSERT OR DELETE OR UPDATE ON "public"."sentiment_votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_sentiment_counts"();



CREATE OR REPLACE TRIGGER "trigger_update_verification_score" AFTER INSERT OR DELETE OR UPDATE ON "public"."verification_votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_verification_truth_score"();



CREATE OR REPLACE TRIGGER "update_action_support_count" AFTER INSERT OR DELETE ON "public"."civic_action_supporters" FOR EACH ROW EXECUTE FUNCTION "public"."update_support_count"();



CREATE OR REPLACE TRIGGER "update_ai_configurations_updated_at" BEFORE UPDATE ON "public"."ai_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_baraza_spaces_updated_at" BEFORE UPDATE ON "public"."baraza_spaces" FOR EACH ROW EXECUTE FUNCTION "public"."update_baraza_spaces_updated_at"();



CREATE OR REPLACE TRIGGER "update_channels_updated_at" BEFORE UPDATE ON "public"."channels" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chat_room_timestamp" AFTER INSERT ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_chat_room_timestamp"();



CREATE OR REPLACE TRIGGER "update_civic_actions_updated_at" BEFORE UPDATE ON "public"."civic_actions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comment_flairs_updated_at" BEFORE UPDATE ON "public"."comment_flairs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comment_media_updated_at" BEFORE UPDATE ON "public"."comment_media" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comment_on_media_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."comment_media" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_media_count"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_communities_updated_at" BEFORE UPDATE ON "public"."communities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_community_rules_updated_at" BEFORE UPDATE ON "public"."community_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contractor_ratings_updated_at" BEFORE UPDATE ON "public"."contractor_ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contractors_updated_at" BEFORE UPDATE ON "public"."contractors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_government_projects_updated_at" BEFORE UPDATE ON "public"."government_projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mod_mail_thread_timestamp" AFTER INSERT ON "public"."mod_mail_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_mod_mail_thread_timestamp"();



CREATE OR REPLACE TRIGGER "update_official_contacts_updated_at" BEFORE UPDATE ON "public"."official_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_officials_updated_at" BEFORE UPDATE ON "public"."officials" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_onboarding_progress_updated_at" BEFORE UPDATE ON "public"."onboarding_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_onboarding_progress_updated_at"();



CREATE OR REPLACE TRIGGER "update_posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_comments_updated_at" BEFORE UPDATE ON "public"."project_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_updates_updated_at" BEFORE UPDATE ON "public"."project_updates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_verifications_updated_at" BEFORE UPDATE ON "public"."project_verifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_views_updated_at" BEFORE UPDATE ON "public"."project_views" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_promise_verifications_updated_at" BEFORE UPDATE ON "public"."promise_verifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_promises_updated_at" BEFORE UPDATE ON "public"."development_promises" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_privacy_settings_updated_at" BEFORE UPDATE ON "public"."user_privacy_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_comment_media_trigger" BEFORE INSERT ON "public"."comment_media" FOR EACH ROW EXECUTE FUNCTION "public"."validate_comment_media"();



CREATE OR REPLACE TRIGGER "validate_project_location_trigger" BEFORE INSERT ON "public"."government_projects" FOR EACH ROW WHEN (("new"."created_by" IS NOT NULL)) EXECUTE FUNCTION "public"."validate_project_location"();



CREATE OR REPLACE TRIGGER "waas_guardian_comments_trigger" AFTER INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."waas_notify_guardian"();



CREATE OR REPLACE TRIGGER "waas_guardian_posts_trigger" AFTER INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."waas_notify_guardian"();



ALTER TABLE ONLY "public"."accountability_alerts"
    ADD CONSTRAINT "accountability_alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."accountability_alerts"
    ADD CONSTRAINT "accountability_alerts_quill_draft_id_fkey" FOREIGN KEY ("quill_draft_id") REFERENCES "public"."agent_drafts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."administrative_divisions"
    ADD CONSTRAINT "administrative_divisions_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."country_governance_templates"("country_code");



ALTER TABLE ONLY "public"."administrative_divisions"
    ADD CONSTRAINT "administrative_divisions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."administrative_divisions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_drafts"
    ADD CONSTRAINT "agent_drafts_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."agent_events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_drafts"
    ADD CONSTRAINT "agent_drafts_source_event_fkey" FOREIGN KEY ("source_event") REFERENCES "public"."agent_events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_feedback"
    ADD CONSTRAINT "agent_feedback_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."agent_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_feedback"
    ADD CONSTRAINT "agent_feedback_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."agent_feedback"
    ADD CONSTRAINT "agent_feedback_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_proposals"
    ADD CONSTRAINT "agent_proposals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."anonymous_reports"
    ADD CONSTRAINT "anonymous_reports_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."api_metrics"
    ADD CONSTRAINT "api_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."baraza_spaces"
    ADD CONSTRAINT "baraza_spaces_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_promises"
    ADD CONSTRAINT "campaign_promises_politician_id_fkey" FOREIGN KEY ("politician_id") REFERENCES "public"."officials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_promises"
    ADD CONSTRAINT "campaign_promises_sentiment_id_fkey" FOREIGN KEY ("sentiment_id") REFERENCES "public"."sentiment_scores"("id");



ALTER TABLE ONLY "public"."campaign_promises"
    ADD CONSTRAINT "campaign_promises_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_promises"
    ADD CONSTRAINT "campaign_promises_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "public"."verifications"("id");



ALTER TABLE ONLY "public"."challenge_submissions"
    ADD CONSTRAINT "challenge_submissions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_submissions"
    ADD CONSTRAINT "challenge_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_votes"
    ADD CONSTRAINT "challenge_votes_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."challenge_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_votes"
    ADD CONSTRAINT "challenge_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."channel_analytics"
    ADD CONSTRAINT "channel_analytics_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "public"."chat_messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_participants"
    ADD CONSTRAINT "chat_participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_participants"
    ADD CONSTRAINT "chat_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_rooms"
    ADD CONSTRAINT "chat_rooms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."civic_action_supporters"
    ADD CONSTRAINT "civic_action_supporters_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "public"."civic_actions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."civic_action_supporters"
    ADD CONSTRAINT "civic_action_supporters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."civic_action_updates"
    ADD CONSTRAINT "civic_action_updates_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "public"."civic_actions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."civic_action_updates"
    ADD CONSTRAINT "civic_action_updates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."civic_actions"
    ADD CONSTRAINT "civic_actions_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."civic_actions"
    ADD CONSTRAINT "civic_actions_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."officials"("id");



ALTER TABLE ONLY "public"."civic_actions"
    ADD CONSTRAINT "civic_actions_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."government_institutions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."civic_actions"
    ADD CONSTRAINT "civic_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."civic_clip_variants"
    ADD CONSTRAINT "civic_clip_variants_clip_id_fkey" FOREIGN KEY ("clip_id") REFERENCES "public"."civic_clips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."civic_clip_views"
    ADD CONSTRAINT "civic_clip_views_clip_id_fkey" FOREIGN KEY ("clip_id") REFERENCES "public"."civic_clips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."civic_clip_views"
    ADD CONSTRAINT "civic_clip_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."civic_clips"
    ADD CONSTRAINT "civic_clips_featured_by_fkey" FOREIGN KEY ("featured_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."civic_clips"
    ADD CONSTRAINT "civic_clips_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."civic_impact_scores"
    ADD CONSTRAINT "civic_impact_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."civic_issue_comments"
    ADD CONSTRAINT "civic_issue_comments_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "public"."civic_actions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."civic_issue_comments"
    ADD CONSTRAINT "civic_issue_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_award_assignments"
    ADD CONSTRAINT "comment_award_assignments_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "public"."comment_awards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_award_assignments"
    ADD CONSTRAINT "comment_award_assignments_awarded_by_fkey" FOREIGN KEY ("awarded_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_award_assignments"
    ADD CONSTRAINT "comment_award_assignments_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_media"
    ADD CONSTRAINT "comment_media_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_media_processing_log"
    ADD CONSTRAINT "comment_media_processing_log_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."comment_media"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_moderation_log"
    ADD CONSTRAINT "comment_moderation_log_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_moderation_log"
    ADD CONSTRAINT "comment_moderation_log_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."comment_notifications"
    ADD CONSTRAINT "comment_notifications_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_notifications"
    ADD CONSTRAINT "comment_notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_references"
    ADD CONSTRAINT "comment_references_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_fact_checker_id_fkey" FOREIGN KEY ("fact_checker_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_flair_id_fkey" FOREIGN KEY ("flair_id") REFERENCES "public"."comment_flairs"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_official_verification_id_fkey" FOREIGN KEY ("official_verification_id") REFERENCES "public"."officials"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_referenced_project_id_fkey" FOREIGN KEY ("referenced_project_id") REFERENCES "public"."government_projects"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_referenced_promise_id_fkey" FOREIGN KEY ("referenced_promise_id") REFERENCES "public"."development_promises"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_sentiment_id_fkey" FOREIGN KEY ("sentiment_id") REFERENCES "public"."sentiment_scores"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "public"."verifications"("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."community_active_members"
    ADD CONSTRAINT "community_active_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_active_members"
    ADD CONSTRAINT "community_active_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_bookmarks"
    ADD CONSTRAINT "community_bookmarks_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_bookmarks"
    ADD CONSTRAINT "community_bookmarks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_events"
    ADD CONSTRAINT "community_events_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_events"
    ADD CONSTRAINT "community_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_flairs"
    ADD CONSTRAINT "community_flairs_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_flairs"
    ADD CONSTRAINT "community_flairs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_institutions"
    ADD CONSTRAINT "community_institutions_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_institutions"
    ADD CONSTRAINT "community_institutions_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."government_institutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_moderators"
    ADD CONSTRAINT "community_moderators_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_moderators"
    ADD CONSTRAINT "community_moderators_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_moderators"
    ADD CONSTRAINT "community_moderators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_poll_votes"
    ADD CONSTRAINT "community_poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."community_polls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_poll_votes"
    ADD CONSTRAINT "community_poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_polls"
    ADD CONSTRAINT "community_polls_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_polls"
    ADD CONSTRAINT "community_polls_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_rules"
    ADD CONSTRAINT "community_rules_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_rules"
    ADD CONSTRAINT "community_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_visits"
    ADD CONSTRAINT "community_visits_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_visits"
    ADD CONSTRAINT "community_visits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_flags"
    ADD CONSTRAINT "content_flags_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."project_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_flags"
    ADD CONSTRAINT "content_flags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_flags"
    ADD CONSTRAINT "content_flags_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contractor_ratings"
    ADD CONSTRAINT "contractor_ratings_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contractor_ratings"
    ADD CONSTRAINT "contractor_ratings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."government_projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contractor_ratings"
    ADD CONSTRAINT "contractor_ratings_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."country_governance_templates"
    ADD CONSTRAINT "country_governance_templates_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."crisis_reports"
    ADD CONSTRAINT "crisis_reports_anonymous_report_id_fkey" FOREIGN KEY ("anonymous_report_id") REFERENCES "public"."anonymous_reports"("id");



ALTER TABLE ONLY "public"."crisis_reports"
    ADD CONSTRAINT "crisis_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."development_promises"
    ADD CONSTRAINT "development_promises_office_holder_id_fkey" FOREIGN KEY ("office_holder_id") REFERENCES "public"."office_holders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."development_promises"
    ADD CONSTRAINT "development_promises_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."election_cycles"
    ADD CONSTRAINT "election_cycles_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."government_positions"("id");



ALTER TABLE ONLY "public"."election_cycles"
    ADD CONSTRAINT "election_cycles_winner_user_id_fkey" FOREIGN KEY ("winner_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expertise_endorsements"
    ADD CONSTRAINT "expertise_endorsements_endorser_id_fkey" FOREIGN KEY ("endorser_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expertise_endorsements"
    ADD CONSTRAINT "expertise_endorsements_expertise_id_fkey" FOREIGN KEY ("expertise_id") REFERENCES "public"."user_expertise"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."feed_activities"
    ADD CONSTRAINT "feed_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."government_projects"
    ADD CONSTRAINT "fk_lead_contractor" FOREIGN KEY ("lead_contractor_id") REFERENCES "public"."contractors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."forum_replies"
    ADD CONSTRAINT "forum_replies_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_replies"
    ADD CONSTRAINT "forum_replies_parent_reply_id_fkey" FOREIGN KEY ("parent_reply_id") REFERENCES "public"."forum_replies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_replies"
    ADD CONSTRAINT "forum_replies_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."forum_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_reply_reactions"
    ADD CONSTRAINT "forum_reply_reactions_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "public"."forum_replies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_reply_reactions"
    ADD CONSTRAINT "forum_reply_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_thread_reactions"
    ADD CONSTRAINT "forum_thread_reactions_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."forum_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_thread_reactions"
    ADD CONSTRAINT "forum_thread_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_threads"
    ADD CONSTRAINT "forum_threads_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_threads"
    ADD CONSTRAINT "forum_threads_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_threads"
    ADD CONSTRAINT "forum_threads_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."government_institutions"
    ADD CONSTRAINT "government_institutions_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."country_governance_templates"("country_code");



ALTER TABLE ONLY "public"."government_institutions"
    ADD CONSTRAINT "government_institutions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."government_institutions"
    ADD CONSTRAINT "government_institutions_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "public"."administrative_divisions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."government_institutions"
    ADD CONSTRAINT "government_institutions_parent_institution_id_fkey" FOREIGN KEY ("parent_institution_id") REFERENCES "public"."government_institutions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."government_institutions"
    ADD CONSTRAINT "government_institutions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."government_positions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."government_projects"
    ADD CONSTRAINT "government_projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."government_projects"
    ADD CONSTRAINT "government_projects_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."government_projects"
    ADD CONSTRAINT "government_projects_office_holder_id_fkey" FOREIGN KEY ("office_holder_id") REFERENCES "public"."office_holders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."government_projects"
    ADD CONSTRAINT "government_projects_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."government_projects"
    ADD CONSTRAINT "government_projects_primary_institution_id_fkey" FOREIGN KEY ("primary_institution_id") REFERENCES "public"."government_institutions"("id");



ALTER TABLE ONLY "public"."government_projects"
    ADD CONSTRAINT "government_projects_primary_official_id_fkey" FOREIGN KEY ("primary_official_id") REFERENCES "public"."government_positions"("id");



ALTER TABLE ONLY "public"."government_projects"
    ADD CONSTRAINT "government_projects_sentiment_id_fkey" FOREIGN KEY ("sentiment_id") REFERENCES "public"."sentiment_scores"("id");



ALTER TABLE ONLY "public"."government_projects"
    ADD CONSTRAINT "government_projects_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "public"."verifications"("id");



ALTER TABLE ONLY "public"."hidden_items"
    ADD CONSTRAINT "hidden_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."institution_handlers"
    ADD CONSTRAINT "institution_handlers_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."institution_handlers"
    ADD CONSTRAINT "institution_handlers_granted_by_holder_id_fkey" FOREIGN KEY ("granted_by_holder_id") REFERENCES "public"."office_holders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."institution_handlers"
    ADD CONSTRAINT "institution_handlers_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."government_institutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."institution_handlers"
    ADD CONSTRAINT "institution_handlers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."institution_updates"
    ADD CONSTRAINT "institution_updates_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."institution_updates"
    ADD CONSTRAINT "institution_updates_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."government_institutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leaderboard_scores"
    ADD CONSTRAINT "leaderboard_scores_profile_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."leaderboard_scores"
    ADD CONSTRAINT "leaderboard_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mod_mail_messages"
    ADD CONSTRAINT "mod_mail_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mod_mail_messages"
    ADD CONSTRAINT "mod_mail_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."mod_mail_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mod_mail_threads"
    ADD CONSTRAINT "mod_mail_threads_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mod_mail_threads"
    ADD CONSTRAINT "mod_mail_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderation_log"
    ADD CONSTRAINT "moderation_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."moderation_log"
    ADD CONSTRAINT "moderation_log_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "public"."content_flags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderation_logs"
    ADD CONSTRAINT "moderation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."office_activity_log"
    ADD CONSTRAINT "office_activity_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."office_activity_log"
    ADD CONSTRAINT "office_activity_log_office_holder_id_fkey" FOREIGN KEY ("office_holder_id") REFERENCES "public"."office_holders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."office_holders"
    ADD CONSTRAINT "office_holders_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."government_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."office_holders"
    ADD CONSTRAINT "office_holders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."office_holders"
    ADD CONSTRAINT "office_holders_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."office_manifestos"
    ADD CONSTRAINT "office_manifestos_office_holder_id_fkey" FOREIGN KEY ("office_holder_id") REFERENCES "public"."office_holders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."office_manifestos"
    ADD CONSTRAINT "office_manifestos_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."government_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."office_manifestos"
    ADD CONSTRAINT "office_manifestos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."office_promises"
    ADD CONSTRAINT "office_promises_office_holder_id_fkey" FOREIGN KEY ("office_holder_id") REFERENCES "public"."office_holders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."office_proposals"
    ADD CONSTRAINT "office_proposals_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."government_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."office_proposals"
    ADD CONSTRAINT "office_proposals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."office_holders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."office_proposals"
    ADD CONSTRAINT "office_proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."office_questions"
    ADD CONSTRAINT "office_questions_answered_by_fkey" FOREIGN KEY ("answered_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."office_questions"
    ADD CONSTRAINT "office_questions_asked_by_fkey" FOREIGN KEY ("asked_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."office_questions"
    ADD CONSTRAINT "office_questions_office_holder_id_fkey" FOREIGN KEY ("office_holder_id") REFERENCES "public"."office_holders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."official_contacts"
    ADD CONSTRAINT "official_contacts_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."official_responses"
    ADD CONSTRAINT "official_responses_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "public"."civic_actions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."official_responses"
    ADD CONSTRAINT "official_responses_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id");



ALTER TABLE ONLY "public"."official_scorecards"
    ADD CONSTRAINT "official_scorecards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."position_communities"
    ADD CONSTRAINT "position_communities_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_communities"
    ADD CONSTRAINT "position_communities_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."government_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_media"
    ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_sentiment_id_fkey" FOREIGN KEY ("sentiment_id") REFERENCES "public"."sentiment_scores"("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "public"."verifications"("id");



ALTER TABLE ONLY "public"."profile_customizations"
    ADD CONSTRAINT "profile_customizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_official_position_id_fkey" FOREIGN KEY ("official_position_id") REFERENCES "public"."government_positions"("id");



ALTER TABLE ONLY "public"."project_collaborating_institutions"
    ADD CONSTRAINT "project_collaborating_institutions_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."government_institutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_collaborating_institutions"
    ADD CONSTRAINT "project_collaborating_institutions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."government_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_collaborating_officials"
    ADD CONSTRAINT "project_collaborating_officials_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "public"."government_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_collaborating_officials"
    ADD CONSTRAINT "project_collaborating_officials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."government_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."project_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."government_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_contractors"
    ADD CONSTRAINT "project_contractors_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_contractors"
    ADD CONSTRAINT "project_contractors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."government_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."government_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_verifications"
    ADD CONSTRAINT "project_verifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."government_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_verifications"
    ADD CONSTRAINT "project_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."government_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promise_updates"
    ADD CONSTRAINT "promise_updates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."promise_updates"
    ADD CONSTRAINT "promise_updates_promise_id_fkey" FOREIGN KEY ("promise_id") REFERENCES "public"."development_promises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promise_verifications"
    ADD CONSTRAINT "promise_verifications_promise_id_fkey" FOREIGN KEY ("promise_id") REFERENCES "public"."development_promises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promise_verifications"
    ADD CONSTRAINT "promise_verifications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."promise_verifications"
    ADD CONSTRAINT "promise_verifications_verifier_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."rag_chat_history"
    ADD CONSTRAINT "rag_chat_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routing_logs"
    ADD CONSTRAINT "routing_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."saved_items"
    ADD CONSTRAINT "saved_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sentiment_votes"
    ADD CONSTRAINT "sentiment_votes_sentiment_id_fkey" FOREIGN KEY ("sentiment_id") REFERENCES "public"."sentiment_scores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sentiment_votes"
    ADD CONSTRAINT "sentiment_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skill_endorsements"
    ADD CONSTRAINT "skill_endorsements_endorsed_by_fkey" FOREIGN KEY ("endorsed_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skill_endorsements"
    ADD CONSTRAINT "skill_endorsements_user_skill_id_fkey" FOREIGN KEY ("user_skill_id") REFERENCES "public"."user_skills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_audit_log"
    ADD CONSTRAINT "system_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_actions"
    ADD CONSTRAINT "user_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activities"
    ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_expertise"
    ADD CONSTRAINT "user_expertise_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "public"."civic_interests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_privacy_settings"
    ADD CONSTRAINT "user_privacy_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_quests"
    ADD CONSTRAINT "user_quests_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_quests"
    ADD CONSTRAINT "user_quests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_quests"
    ADD CONSTRAINT "user_quests_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_warnings"
    ADD CONSTRAINT "user_warnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_votes"
    ADD CONSTRAINT "verification_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_votes"
    ADD CONSTRAINT "verification_votes_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "public"."verifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can create polls" ON "public"."community_polls" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."community_moderators" "cm"
  WHERE (("cm"."community_id" = "cm"."community_id") AND ("cm"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("cm"."role" = 'admin'::"text") OR ((("cm"."permissions" ->> 'can_manage_polls'::"text"))::boolean = true))))));



CREATE POLICY "Admins can delete divisions" ON "public"."administrative_divisions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can delete institutions" ON "public"."government_institutions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can delete position communities" ON "public"."position_communities" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can delete vectors" ON "public"."vectors" FOR DELETE TO "authenticated" USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR "public"."has_role"("auth"."uid"(), 'super_admin'::"public"."app_role")));



CREATE POLICY "Admins can insert vectors" ON "public"."vectors" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR "public"."has_role"("auth"."uid"(), 'super_admin'::"public"."app_role")));



CREATE POLICY "Admins can manage bookmarks" ON "public"."community_bookmarks" USING ((EXISTS ( SELECT 1
   FROM "public"."community_moderators"
  WHERE (("community_moderators"."community_id" = "community_bookmarks"."community_id") AND ("community_moderators"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("community_moderators"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."community_moderators"
  WHERE (("community_moderators"."community_id" = "community_bookmarks"."community_id") AND ("community_moderators"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("community_moderators"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage channels" ON "public"."channels" USING (("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role") OR "public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role") OR "public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Admins can manage civic interests" ON "public"."civic_interests" USING ("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage events" ON "public"."community_events" USING ((EXISTS ( SELECT 1
   FROM "public"."community_moderators" "cm"
  WHERE (("cm"."community_id" = "community_events"."community_id") AND ("cm"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (("cm"."role" = 'admin'::"text") OR ((("cm"."permissions" ->> 'can_manage_events'::"text"))::boolean = true))))));



CREATE POLICY "Admins can manage institution handlers" ON "public"."institution_handlers" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Admins can manage institution updates" ON "public"."institution_updates" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Admins can manage non-super roles" ON "public"."user_roles" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AND ("role" <> 'super_admin'::"public"."app_role"))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AND ("role" <> 'super_admin'::"public"."app_role")));



CREATE POLICY "Admins can manage position communities" ON "public"."position_communities" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can update divisions" ON "public"."administrative_divisions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can update institutions" ON "public"."government_institutions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can update office_holders" ON "public"."office_holders" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can update position communities" ON "public"."position_communities" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can update vectors" ON "public"."vectors" FOR UPDATE TO "authenticated" USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR "public"."has_role"("auth"."uid"(), 'super_admin'::"public"."app_role"))) WITH CHECK (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR "public"."has_role"("auth"."uid"(), 'super_admin'::"public"."app_role")));



CREATE POLICY "Admins can view all election cycles" ON "public"."election_cycles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can view all error logs" ON "public"."error_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can view all templates" ON "public"."country_governance_templates" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'moderator'::"text"]))))));



CREATE POLICY "Admins can view notifications" ON "public"."admin_notifications" FOR SELECT USING (("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role") OR "public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Anyone can create error logs" ON "public"."error_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert API metrics" ON "public"."api_metrics" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert error logs" ON "public"."error_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert performance metrics" ON "public"."performance_metrics" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can upvote proposals" ON "public"."office_proposals" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can view active NGO partners" ON "public"."ngo_partners" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active members of public communities" ON "public"."community_active_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."communities"
  WHERE (("communities"."id" = "community_active_members"."community_id") AND ("communities"."visibility_type" = 'public'::"text")))));



CREATE POLICY "Anyone can view chat messages" ON "public"."chat_messages" FOR SELECT USING (true);



CREATE POLICY "Anyone can view comments" ON "public"."project_comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view feature flags" ON "public"."feature_flags" FOR SELECT USING (true);



CREATE POLICY "Anyone can view forum replies" ON "public"."forum_replies" FOR SELECT USING (true);



CREATE POLICY "Anyone can view institution handlers" ON "public"."institution_handlers" FOR SELECT USING (true);



CREATE POLICY "Anyone can view institution updates" ON "public"."institution_updates" FOR SELECT USING (true);



CREATE POLICY "Anyone can view manifestos" ON "public"."office_manifestos" FOR SELECT USING (true);



CREATE POLICY "Anyone can view office activity" ON "public"."office_activity_log" FOR SELECT USING (true);



CREATE POLICY "Anyone can view project views" ON "public"."project_views" FOR SELECT USING (true);



CREATE POLICY "Anyone can view promises" ON "public"."office_promises" FOR SELECT USING (true);



CREATE POLICY "Anyone can view proposals" ON "public"."office_proposals" FOR SELECT USING (true);



CREATE POLICY "Anyone can view questions" ON "public"."office_questions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view reply reactions" ON "public"."forum_reply_reactions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view responses" ON "public"."official_responses" FOR SELECT USING (true);



CREATE POLICY "Anyone can view supporters" ON "public"."civic_action_supporters" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view thread reactions" ON "public"."forum_thread_reactions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view updates" ON "public"."civic_action_updates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view updates" ON "public"."project_updates" FOR SELECT USING (true);



CREATE POLICY "Anyone can view verifications" ON "public"."project_verifications" FOR SELECT USING (true);



CREATE POLICY "Assigned handlers can create updates" ON "public"."institution_updates" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."institution_handlers" "ih"
  WHERE (("ih"."user_id" = "auth"."uid"()) AND ("ih"."institution_id" = "ih"."institution_id") AND (("ih"."status")::"text" = 'active'::"text")))));



CREATE POLICY "Assigned handlers can manage updates" ON "public"."institution_updates" USING ((EXISTS ( SELECT 1
   FROM "public"."institution_handlers" "ih"
  WHERE (("ih"."user_id" = "auth"."uid"()) AND ("ih"."institution_id" = "institution_updates"."institution_id")))));



CREATE POLICY "Auth users can create communities" ON "public"."communities" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can add comments" ON "public"."civic_issue_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can add comments" ON "public"."project_comments" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can add forum reply reactions" ON "public"."forum_reply_reactions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can add forum thread reactions" ON "public"."forum_thread_reactions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can add promise updates" ON "public"."promise_updates" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "Authenticated users can add reactions" ON "public"."message_reactions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can add reply reactions" ON "public"."forum_reply_reactions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can add thread reactions" ON "public"."forum_thread_reactions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can add updates" ON "public"."project_updates" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "Authenticated users can add verifications" ON "public"."project_verifications" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can add views" ON "public"."project_views" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can ask questions" ON "public"."office_questions" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("asked_by" = "auth"."uid"())));



CREATE POLICY "Authenticated users can create campaign promises" ON "public"."campaign_promises" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "submitted_by"));



CREATE POLICY "Authenticated users can create comments" ON "public"."comments" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "author_id") AND (( SELECT "auth"."role"() AS "role") = 'authenticated'::"text")));



CREATE POLICY "Authenticated users can create posts" ON "public"."posts" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Authenticated users can create proposals" ON "public"."office_proposals" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Authenticated users can create replies" ON "public"."forum_replies" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."forum_threads" "t"
     JOIN "public"."community_members" "m" ON (("m"."community_id" = "t"."community_id")))
  WHERE (("t"."id" = "forum_replies"."thread_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Authenticated users can create verifications" ON "public"."verifications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can endorse" ON "public"."expertise_endorsements" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "endorser_id"));



CREATE POLICY "Authenticated users can manage contractors" ON "public"."contractors" USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can post replies" ON "public"."forum_replies" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Authenticated users can read vectors" ON "public"."vectors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can request handler access" ON "public"."institution_handlers" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (("status")::"text" = 'pending'::"text")));



CREATE POLICY "Authenticated users can send messages" ON "public"."chat_messages" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "sender_id"));



CREATE POLICY "Authenticated users can suggest divisions" ON "public"."administrative_divisions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can suggest institutions" ON "public"."government_institutions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can update communities" ON "public"."communities" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can upload manifestos" ON "public"."office_manifestos" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("uploaded_by" = "auth"."uid"())));



CREATE POLICY "Authenticated users can upload media to their posts" ON "public"."post_media" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = ( SELECT "posts"."author_id"
   FROM "public"."posts"
  WHERE ("posts"."id" = "post_media"."post_id"))));



CREATE POLICY "Authenticated users submit proposals" ON "public"."office_proposals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users upload manifestos" ON "public"."office_manifestos" FOR INSERT WITH CHECK (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Authors and mods can update threads" ON "public"."forum_threads" FOR UPDATE USING ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."community_moderators"
  WHERE (("community_moderators"."community_id" = "forum_threads"."community_id") AND ("community_moderators"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Authors can delete their own posts" ON "public"."institution_updates" FOR DELETE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Authors can update their own posts" ON "public"."institution_updates" FOR UPDATE USING (("author_id" = "auth"."uid"())) WITH CHECK ((("author_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."institution_handlers" "ih"
  WHERE (("ih"."user_id" = "auth"."uid"()) AND ("ih"."institution_id" = "ih"."institution_id") AND (("ih"."status")::"text" = 'active'::"text"))))));



CREATE POLICY "Award assignments are viewable by everyone" ON "public"."comment_award_assignments" FOR SELECT USING (true);



CREATE POLICY "Badges are viewable by everyone" ON "public"."badges" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Baraza spaces are viewable by everyone" ON "public"."baraza_spaces" FOR SELECT USING (true);



CREATE POLICY "Campaign promises are viewable by everyone" ON "public"."campaign_promises" FOR SELECT USING (true);



CREATE POLICY "Challenges are viewable by everyone" ON "public"."challenges" FOR SELECT USING (true);



CREATE POLICY "Channels viewable by everyone" ON "public"."channels" FOR SELECT USING (true);



CREATE POLICY "Civic actions are viewable by everyone if public" ON "public"."civic_actions" FOR SELECT USING ((("is_public" = true) OR (( SELECT "auth"."uid"() AS "uid") = "user_id")));



CREATE POLICY "Civic clips are viewable by everyone" ON "public"."civic_clips" FOR SELECT USING (true);



CREATE POLICY "Civic interests are viewable by everyone" ON "public"."civic_interests" FOR SELECT USING (true);



CREATE POLICY "Clip variants are viewable by everyone" ON "public"."civic_clip_variants" FOR SELECT USING (true);



CREATE POLICY "Comment awards are viewable by everyone" ON "public"."comment_awards" FOR SELECT USING (true);



CREATE POLICY "Comment flairs are viewable by everyone" ON "public"."comment_flairs" FOR SELECT USING (true);



CREATE POLICY "Comment media is viewable by everyone" ON "public"."comment_media" FOR SELECT USING (true);



CREATE POLICY "Comment references are viewable by everyone" ON "public"."comment_references" FOR SELECT USING (true);



CREATE POLICY "Comments are viewable by everyone" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Communities publicly readable" ON "public"."communities" FOR SELECT USING (true);



CREATE POLICY "Community flairs are viewable by everyone" ON "public"."community_flairs" FOR SELECT USING (true);



CREATE POLICY "Community membership privacy" ON "public"."community_members" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "community_members"."user_id") AND (("profiles"."bio" IS NOT NULL) OR ("profiles"."role" = ANY (ARRAY['official'::"text", 'expert'::"text", 'journalist'::"text"]))))))));



CREATE POLICY "Community moderators can manage flairs" ON "public"."community_flairs" USING (((EXISTS ( SELECT 1
   FROM "public"."community_moderators" "cm"
  WHERE (("cm"."community_id" = "community_flairs"."community_id") AND ("cm"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR "public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role")));



CREATE POLICY "Community moderators can manage rules" ON "public"."community_rules" USING (((EXISTS ( SELECT 1
   FROM "public"."community_moderators" "cm"
  WHERE (("cm"."community_id" = "community_rules"."community_id") AND ("cm"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR "public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role")));



CREATE POLICY "Community rules are viewable by everyone" ON "public"."community_rules" FOR SELECT USING (true);



CREATE POLICY "Contractor ratings are viewable by everyone" ON "public"."contractor_ratings" FOR SELECT USING (true);



CREATE POLICY "Contractor ratings can be created by authenticated users" ON "public"."contractor_ratings" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



CREATE POLICY "Creators can update communities" ON "public"."communities" FOR UPDATE USING (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Development promises are viewable by everyone" ON "public"."development_promises" FOR SELECT USING (true);



CREATE POLICY "Endorsements are viewable by everyone" ON "public"."skill_endorsements" FOR SELECT USING (true);



CREATE POLICY "Events viewable by everyone" ON "public"."community_events" FOR SELECT USING (true);



CREATE POLICY "Forum reply reactions are viewable by everyone" ON "public"."forum_reply_reactions" FOR SELECT USING (true);



CREATE POLICY "Forum thread reactions are viewable by everyone" ON "public"."forum_thread_reactions" FOR SELECT USING (true);



CREATE POLICY "Government projects are viewable by everyone" ON "public"."government_projects" FOR SELECT USING (true);



CREATE POLICY "Government projects can be inserted by authenticated users" ON "public"."government_projects" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



CREATE POLICY "Government projects can be updated by officials and admins" ON "public"."government_projects" FOR UPDATE USING (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Hierarchies are viewable by everyone" ON "public"."governance_hierarchies" FOR SELECT USING (true);



CREATE POLICY "Issue comments are publicly viewable" ON "public"."civic_issue_comments" FOR SELECT USING (true);



CREATE POLICY "Leaderboards are viewable by everyone" ON "public"."leaderboard_scores" FOR SELECT USING (true);



CREATE POLICY "Manage community channels" ON "public"."channels" USING ((EXISTS ( SELECT 1
   FROM "public"."community_moderators"
  WHERE (("community_moderators"."community_id" = "channels"."community_id") AND ("community_moderators"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("community_moderators"."role" = ANY (ARRAY['admin'::"text", 'moderator'::"text"]))))));



CREATE POLICY "Members can create forum threads" ON "public"."forum_threads" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."community_members"
  WHERE (("community_members"."community_id" = "forum_threads"."community_id") AND ("community_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Members can view active members" ON "public"."community_active_members" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "community_members"."user_id"
   FROM "public"."community_members"
  WHERE ("community_members"."community_id" = "community_active_members"."community_id"))));



CREATE POLICY "Members publicly viewable" ON "public"."community_members" FOR SELECT USING (true);



CREATE POLICY "Moderators can manage comment awards" ON "public"."comment_awards" USING (("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role") OR "public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'moderator'::"public"."app_role")));



CREATE POLICY "Moderators can manage comment flairs" ON "public"."comment_flairs" USING (("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role") OR "public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'moderator'::"public"."app_role")));



CREATE POLICY "Moderators can send messages" ON "public"."mod_mail_messages" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."mod_mail_threads" "t"
     JOIN "public"."community_moderators" "m" ON (("t"."community_id" = "m"."community_id")))
  WHERE (("t"."id" = "mod_mail_messages"."thread_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND (( SELECT "auth"."uid"() AS "uid") = "sender_id")));



CREATE POLICY "Moderators can update mod mail threads" ON "public"."mod_mail_threads" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."community_moderators"
  WHERE (("community_moderators"."community_id" = "mod_mail_threads"."community_id") AND ("community_moderators"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Moderators can view all messages" ON "public"."mod_mail_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."mod_mail_threads" "t"
     JOIN "public"."community_moderators" "m" ON (("t"."community_id" = "m"."community_id")))
  WHERE (("t"."id" = "mod_mail_messages"."thread_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Moderators can view community mod mail threads" ON "public"."mod_mail_threads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."community_moderators"
  WHERE (("community_moderators"."community_id" = "mod_mail_threads"."community_id") AND ("community_moderators"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Moderators can view moderation logs" ON "public"."comment_moderation_log" FOR SELECT USING (("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role") OR "public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'moderator'::"public"."app_role")));



CREATE POLICY "Mods can insert moderation log" ON "public"."moderation_log" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Mods can update content flag status" ON "public"."content_flags" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'moderator'::"text"]))))));



CREATE POLICY "Mods can view all content flags" ON "public"."content_flags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'moderator'::"text"]))))));



CREATE POLICY "Mods can view moderation log" ON "public"."moderation_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'moderator'::"text"]))))));



CREATE POLICY "Office holders and admins can update handler status" ON "public"."institution_handlers" FOR UPDATE USING ((("auth"."uid"() = "approved_by") OR ("auth"."uid"() IN ( SELECT "oh"."user_id"
   FROM "public"."office_holders" "oh"
  WHERE ("oh"."id" = "institution_handlers"."granted_by_holder_id")))));



CREATE POLICY "Office holders can answer questions directed at them" ON "public"."office_questions" FOR UPDATE USING (("office_holder_id" IN ( SELECT "office_holders"."id"
   FROM "public"."office_holders"
  WHERE ("office_holders"."user_id" = "auth"."uid"()))));



CREATE POLICY "Office holders can create their own promises" ON "public"."office_promises" FOR INSERT WITH CHECK (("office_holder_id" IN ( SELECT "office_holders"."id"
   FROM "public"."office_holders"
  WHERE ("office_holders"."user_id" = "auth"."uid"()))));



CREATE POLICY "Office holders can delete their own promises" ON "public"."office_promises" FOR DELETE USING (("office_holder_id" IN ( SELECT "office_holders"."id"
   FROM "public"."office_holders"
  WHERE ("office_holders"."user_id" = "auth"."uid"()))));



CREATE POLICY "Office holders can insert own activity" ON "public"."office_activity_log" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) AND ("office_holder_id" IN ( SELECT "oh"."id"
   FROM "public"."office_holders" "oh"
  WHERE ("oh"."user_id" = "auth"."uid"())))));



CREATE POLICY "Office holders can update their own promises" ON "public"."office_promises" FOR UPDATE USING (("office_holder_id" IN ( SELECT "office_holders"."id"
   FROM "public"."office_holders"
  WHERE ("office_holders"."user_id" = "auth"."uid"()))));



CREATE POLICY "Officials basic info viewable by everyone" ON "public"."officials" FOR SELECT USING (true);



CREATE POLICY "Only admins can delete election cycles" ON "public"."election_cycles" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Only admins can insert election cycles" ON "public"."election_cycles" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Only admins can update election cycles" ON "public"."election_cycles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Only platform admins can update admin status" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR "public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "id") OR "public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Only super admins can access AI configurations" ON "public"."ai_configurations" TO "authenticated" USING ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Only super admins can modify feature flags" ON "public"."feature_flags" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Only system can manage variants" ON "public"."civic_clip_variants" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'moderator'::"text"]))))));



CREATE POLICY "Polls viewable by everyone" ON "public"."community_polls" FOR SELECT USING (true);



CREATE POLICY "Post media is viewable by everyone" ON "public"."post_media" FOR SELECT USING (true);



CREATE POLICY "Posts are viewable by everyone" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "Project contractors are viewable by everyone" ON "public"."project_contractors" FOR SELECT USING (true);



CREATE POLICY "Promise updates are viewable by everyone" ON "public"."promise_updates" FOR SELECT USING (true);



CREATE POLICY "Promise verifications are viewable by everyone" ON "public"."promise_verifications" FOR SELECT USING (true);



CREATE POLICY "Promise verifications can be created by authenticated users" ON "public"."promise_verifications" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



CREATE POLICY "Public activities are viewable by everyone" ON "public"."feed_activities" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public can view active handlers" ON "public"."institution_handlers" FOR SELECT USING ((("status")::"text" = 'active'::"text"));



CREATE POLICY "Public can view active holders" ON "public"."office_holders" FOR SELECT USING (true);



CREATE POLICY "Public can view administrative divisions" ON "public"."administrative_divisions" FOR SELECT USING (true);



CREATE POLICY "Public can view certified election results" ON "public"."election_cycles" FOR SELECT USING (("results_certified" = true));



CREATE POLICY "Public can view customizations" ON "public"."profile_customizations" FOR SELECT USING (true);



CREATE POLICY "Public can view endorsements" ON "public"."expertise_endorsements" FOR SELECT USING (true);



CREATE POLICY "Public can view expertise" ON "public"."user_expertise" FOR SELECT USING (true);



CREATE POLICY "Public can view goat levels" ON "public"."goat_levels" FOR SELECT USING (true);



CREATE POLICY "Public can view impact scores" ON "public"."civic_impact_scores" FOR SELECT USING (true);



CREATE POLICY "Public can view institutions" ON "public"."government_institutions" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view position communities" ON "public"."position_communities" FOR SELECT USING (true);



CREATE POLICY "Public can view positions" ON "public"."government_positions" FOR SELECT USING (true);



CREATE POLICY "Public can view project collaborating institutions" ON "public"."project_collaborating_institutions" FOR SELECT USING (true);



CREATE POLICY "Public can view project collaborating officials" ON "public"."project_collaborating_officials" FOR SELECT USING (true);



CREATE POLICY "Public can view scorecards" ON "public"."official_scorecards" FOR SELECT USING (true);



CREATE POLICY "Public can view verified templates" ON "public"."country_governance_templates" FOR SELECT USING (("is_verified" = true));



CREATE POLICY "Public contractor information viewable by everyone" ON "public"."contractors" FOR SELECT USING (true);



CREATE POLICY "Public official contacts are viewable by everyone" ON "public"."official_contacts" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public read community_institutions" ON "public"."community_institutions" FOR SELECT USING (true);



CREATE POLICY "Public read manifestos" ON "public"."office_manifestos" FOR SELECT USING (true);



CREATE POLICY "Public read proposals" ON "public"."office_proposals" FOR SELECT USING (true);



CREATE POLICY "Question askers can delete their own unanswered questions" ON "public"."office_questions" FOR DELETE USING ((("asked_by" = "auth"."uid"()) AND ("answer" IS NULL)));



CREATE POLICY "Question askers can update their own questions (within 15 minut" ON "public"."office_questions" FOR UPDATE USING ((("asked_by" = "auth"."uid"()) AND ("asked_at" > ("now"() - '00:15:00'::interval)) AND ("answer" IS NULL)));



CREATE POLICY "Quests are viewable by everyone" ON "public"."quests" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Reactions visible to chat participants" ON "public"."message_reactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."chat_messages" "cm"
  WHERE (("cm"."id" = "message_reactions"."message_id") AND ((("cm"."room_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."chat_participants" "cp"
          WHERE (("cp"."room_id" = "cm"."room_id") AND ("cp"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) OR (("cm"."channel_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM ("public"."channels" "ch"
             JOIN "public"."community_members" "cmem" ON (("cmem"."community_id" = "ch"."community_id")))
          WHERE (("ch"."id" = "cm"."channel_id") AND ("cmem"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))))))));



CREATE POLICY "Send channel messages" ON "public"."chat_messages" FOR INSERT WITH CHECK ((("channel_id" IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM ("public"."channels" "c"
     JOIN "public"."community_members" "cm" ON (("c"."community_id" = "cm"."community_id")))
  WHERE (("c"."id" = "chat_messages"."channel_id") AND ("cm"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."channels" "c"
  WHERE (("c"."id" = "chat_messages"."channel_id") AND ("c"."type" = 'announcement'::"text") AND (NOT (EXISTS ( SELECT 1
           FROM "public"."community_moderators" "mod"
          WHERE (("mod"."community_id" = "c"."community_id") AND ("mod"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))))))))));



CREATE POLICY "Sentiment scores are viewable by everyone" ON "public"."sentiment_scores" FOR SELECT USING (true);



CREATE POLICY "Sentiment votes are viewable by everyone" ON "public"."sentiment_votes" FOR SELECT USING (true);



CREATE POLICY "Service role full access community_institutions" ON "public"."community_institutions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Skills are viewable by everyone" ON "public"."skills" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Submissions are viewable by everyone" ON "public"."challenge_submissions" FOR SELECT USING (true);



CREATE POLICY "Super admins can delete error logs" ON "public"."error_logs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins can manage NGO partners" ON "public"."ngo_partners" USING (("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role")));



CREATE POLICY "Super admins can manage all roles" ON "public"."user_roles" USING ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Super admins can manage anonymous reports" ON "public"."anonymous_reports" USING (("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role")));



CREATE POLICY "Super admins can manage crisis reports" ON "public"."crisis_reports" USING (("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role")));



CREATE POLICY "Super admins can manage notifications" ON "public"."admin_notifications" USING ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Super admins can view audit logs" ON "public"."system_audit_log" FOR SELECT USING ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "SuperAdmins can view API metrics" ON "public"."api_metrics" FOR SELECT USING ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "SuperAdmins can view error logs" ON "public"."error_logs" FOR SELECT USING ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "SuperAdmins can view performance metrics" ON "public"."performance_metrics" FOR SELECT USING ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "System can create notifications" ON "public"."comment_notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert achievements" ON "public"."user_achievements" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert audit logs" ON "public"."system_audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert content flags" ON "public"."content_flags" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "System can insert moderation logs" ON "public"."comment_moderation_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert updates" ON "public"."civic_action_updates" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can manage processing logs" ON "public"."comment_media_processing_log" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "System can manage rate limits" ON "public"."rate_limits" USING (true);



CREATE POLICY "System can manage scorecards" ON "public"."official_scorecards" USING (true);



CREATE POLICY "System can update impact scores" ON "public"."civic_impact_scores" FOR UPDATE USING (true);



CREATE POLICY "Updates are viewable by everyone" ON "public"."civic_action_updates" FOR SELECT USING (true);



CREATE POLICY "Uploaders can delete their manifestos" ON "public"."office_manifestos" FOR DELETE USING (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "User badges are viewable by everyone" ON "public"."user_badges" FOR SELECT USING (true);



CREATE POLICY "User skills are viewable by everyone" ON "public"."user_skills" FOR SELECT USING (true);



CREATE POLICY "Users can add collaborators to their projects (institutions)" ON "public"."project_collaborating_institutions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."government_projects"
  WHERE (("government_projects"."id" = "project_collaborating_institutions"."project_id") AND ("government_projects"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can add collaborators to their projects (officials)" ON "public"."project_collaborating_officials" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."government_projects"
  WHERE (("government_projects"."id" = "project_collaborating_officials"."project_id") AND ("government_projects"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can add participants" ON "public"."chat_participants" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can add their own interests" ON "public"."user_interests" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can award comments" ON "public"."comment_award_assignments" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "awarded_by") AND (EXISTS ( SELECT 1
   FROM "public"."comments"
  WHERE (("comments"."id" = "comment_award_assignments"."comment_id") AND ("comments"."author_id" <> ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can cast sentiment votes" ON "public"."sentiment_votes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can cast verification votes" ON "public"."verification_votes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can claim office" ON "public"."office_holders" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can claim skills" ON "public"."user_skills" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create civic actions" ON "public"."civic_actions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create civic clips" ON "public"."civic_clips" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Users can create clip views" ON "public"."civic_clip_views" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create mod mail threads" ON "public"."mod_mail_threads" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create references for their comments" ON "public"."comment_references" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."comments"
  WHERE (("comments"."id" = "comment_references"."comment_id") AND ("comments"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can create their own actions" ON "public"."user_actions" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can create their own activities" ON "public"."feed_activities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own baraza spaces" ON "public"."baraza_spaces" FOR INSERT WITH CHECK (("auth"."uid"() = "host_user_id"));



CREATE POLICY "Users can create their own votes" ON "public"."votes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create updates" ON "public"."civic_action_updates" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



CREATE POLICY "Users can delete own endorsements" ON "public"."expertise_endorsements" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "endorser_id"));



CREATE POLICY "Users can delete own messages" ON "public"."chat_messages" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "sender_id"));



CREATE POLICY "Users can delete own replies" ON "public"."forum_replies" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Users can delete their own baraza spaces" ON "public"."baraza_spaces" FOR DELETE USING (("auth"."uid"() = "host_user_id"));



CREATE POLICY "Users can delete their own civic clips" ON "public"."civic_clips" FOR DELETE USING (("post_id" IN ( SELECT "posts"."id"
   FROM "public"."posts"
  WHERE ("posts"."author_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete their own comment media" ON "public"."comment_media" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."comments"
  WHERE (("comments"."id" = "comment_media"."comment_id") AND ("comments"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can delete their own comments" ON "public"."civic_issue_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."comments" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."project_comments" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own hidden items" ON "public"."hidden_items" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own interests" ON "public"."user_interests" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own posts" ON "public"."posts" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Users can delete their own saved items" ON "public"."saved_items" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own updates" ON "public"."project_updates" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "Users can delete their own votes" ON "public"."votes" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can endorse skills" ON "public"."skill_endorsements" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "endorsed_by"));



CREATE POLICY "Users can insert comments" ON "public"."comments" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Users can insert own impact score" ON "public"."civic_impact_scores" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert posts" ON "public"."posts" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Users can insert their own activities" ON "public"."user_activities" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own activity" ON "public"."user_activity_log" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own chat messages" ON "public"."rag_chat_history" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own civic actions" ON "public"."civic_actions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own hidden items" ON "public"."hidden_items" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own quests" ON "public"."user_quests" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own saved items" ON "public"."saved_items" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own support" ON "public"."civic_action_supporters" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert votes" ON "public"."votes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can join communities" ON "public"."community_members" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can leave communities" ON "public"."community_members" FOR DELETE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can log their visits" ON "public"."community_visits" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own customizations" ON "public"."profile_customizations" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own expertise" ON "public"."user_expertise" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own privacy settings" ON "public"."user_privacy_settings" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can only view their own votes" ON "public"."votes" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own chat history" ON "public"."rag_chat_history" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can remove collaborators from their projects (institution" ON "public"."project_collaborating_institutions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."government_projects"
  WHERE (("government_projects"."id" = "project_collaborating_institutions"."project_id") AND ("government_projects"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can remove collaborators from their projects (officials)" ON "public"."project_collaborating_officials" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."government_projects"
  WHERE (("government_projects"."id" = "project_collaborating_officials"."project_id") AND ("government_projects"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can remove their own awards" ON "public"."comment_award_assignments" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "awarded_by"));



CREATE POLICY "Users can remove their own forum reply reactions" ON "public"."forum_reply_reactions" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can remove their own forum thread reactions" ON "public"."forum_thread_reactions" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can remove their own reactions" ON "public"."message_reactions" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can remove their own reply reactions" ON "public"."forum_reply_reactions" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can remove their own support" ON "public"."civic_action_supporters" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can remove their own thread reactions" ON "public"."forum_thread_reactions" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can see their own handler records" ON "public"."institution_handlers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can send messages" ON "public"."chat_messages" FOR INSERT WITH CHECK (("public"."user_is_room_participant"("room_id", ( SELECT "auth"."uid"() AS "uid")) AND ("sender_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can send messages to own threads" ON "public"."mod_mail_messages" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."mod_mail_threads"
  WHERE (("mod_mail_threads"."id" = "mod_mail_messages"."thread_id") AND ("mod_mail_threads"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND (( SELECT "auth"."uid"() AS "uid") = "sender_id") AND ("is_internal" = false)));



CREATE POLICY "Users can submit templates" ON "public"."country_governance_templates" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "submitted_by"));



CREATE POLICY "Users can submit to challenges" ON "public"."challenge_submissions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can support actions" ON "public"."civic_action_supporters" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can unsupport actions" ON "public"."civic_action_supporters" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own active status" ON "public"."community_active_members" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own active status timestamp" ON "public"."community_active_members" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own claims" ON "public"."office_holders" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own messages" ON "public"."chat_messages" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "sender_id"));



CREATE POLICY "Users can update own participant records" ON "public"."chat_participants" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own replies" ON "public"."forum_replies" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Users can update their own actions" ON "public"."civic_actions" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own activities" ON "public"."feed_activities" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own baraza spaces" ON "public"."baraza_spaces" FOR UPDATE USING (("auth"."uid"() = "host_user_id"));



CREATE POLICY "Users can update their own campaign promises" ON "public"."campaign_promises" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "submitted_by"));



CREATE POLICY "Users can update their own civic actions" ON "public"."civic_actions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own civic clips" ON "public"."civic_clips" FOR UPDATE USING (("post_id" IN ( SELECT "posts"."id"
   FROM "public"."posts"
  WHERE ("posts"."author_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update their own comment media" ON "public"."comment_media" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."comments"
  WHERE (("comments"."id" = "comment_media"."comment_id") AND ("comments"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update their own comments" ON "public"."comments" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Users can update their own comments" ON "public"."project_comments" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."comment_notifications" FOR UPDATE USING (("recipient_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update their own onboarding progress" ON "public"."onboarding_progress" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own posts" ON "public"."posts" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Users can update their own quests" ON "public"."user_quests" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own unverified projects" ON "public"."government_projects" FOR UPDATE USING ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("is_verified" = false)));



CREATE POLICY "Users can update their own updates" ON "public"."project_updates" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "Users can update their own verification votes" ON "public"."verification_votes" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own verifications" ON "public"."project_verifications" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own votes" ON "public"."votes" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can upload media to their comments" ON "public"."comment_media" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."comments"
  WHERE (("comments"."id" = "comment_media"."comment_id") AND ("comments"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view all clip views" ON "public"."civic_clip_views" FOR SELECT USING (true);



CREATE POLICY "Users can view all comments" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Users can view all posts" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "Users can view all votes" ON "public"."votes" FOR SELECT USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



CREATE POLICY "Users can view community memberships" ON "public"."community_members" FOR SELECT USING (true);



CREATE POLICY "Users can view messages in own threads" ON "public"."mod_mail_messages" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."mod_mail_threads"
  WHERE (("mod_mail_threads"."id" = "mod_mail_messages"."thread_id") AND ("mod_mail_threads"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND ("is_internal" = false)));



CREATE POLICY "Users can view messages in their rooms" ON "public"."chat_messages" FOR SELECT USING ("public"."user_is_room_participant"("room_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own mod mail threads" ON "public"."mod_mail_threads" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own participant records" ON "public"."chat_participants" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own rate limits" ON "public"."rate_limits" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view public civic actions" ON "public"."civic_actions" FOR SELECT TO "authenticated" USING ((("is_public" = true) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Users can view their achievements" ON "public"."user_achievements" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own actions" ON "public"."user_actions" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view their own activities" ON "public"."feed_activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own activities" ON "public"."user_activities" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own activity" ON "public"."user_activity_log" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own hidden items" ON "public"."hidden_items" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own interests" ON "public"."user_interests" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own moderation logs" ON "public"."moderation_logs" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."comment_notifications" FOR SELECT USING (("recipient_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view their own onboarding progress" ON "public"."onboarding_progress" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own quests" ON "public"."user_quests" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view their own routing logs" ON "public"."routing_logs" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own saved items" ON "public"."saved_items" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view verification votes" ON "public"."verification_votes" FOR SELECT USING (true);



CREATE POLICY "Users can view votes" ON "public"."challenge_votes" FOR SELECT USING (true);



CREATE POLICY "Users can view votes" ON "public"."community_poll_votes" FOR SELECT USING (true);



CREATE POLICY "Users can vote on submissions" ON "public"."challenge_votes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can vote once" ON "public"."community_poll_votes" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."community_polls" "p"
  WHERE (("p"."id" = "community_poll_votes"."poll_id") AND (("p"."expires_at" IS NULL) OR ("p"."expires_at" > "now"())) AND ("p"."is_active" = true))))));



CREATE POLICY "Users update own proposals" ON "public"."office_proposals" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Verifications are viewable by everyone" ON "public"."verifications" FOR SELECT USING (true);



CREATE POLICY "Verifications can be updated by system" ON "public"."verifications" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Verified users can view private official contacts" ON "public"."official_contacts" FOR SELECT USING ((("is_public" = false) AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND ("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'official'::"public"."app_role") OR "public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'journalist'::"public"."app_role") OR "public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'expert'::"public"."app_role") OR "public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role")) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."is_verified" = true))))));



CREATE POLICY "View channel analytics" ON "public"."channel_analytics" FOR SELECT USING (true);



CREATE POLICY "View channel messages" ON "public"."chat_messages" FOR SELECT USING ((("channel_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ("public"."channels" "c"
     JOIN "public"."communities" "comm" ON (("c"."community_id" = "comm"."id")))
  WHERE ("c"."id" = "chat_messages"."channel_id")))));



CREATE POLICY "View community bookmarks" ON "public"."community_bookmarks" FOR SELECT USING (true);



CREATE POLICY "View community channels" ON "public"."channels" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."communities"
  WHERE ("communities"."id" = "channels"."community_id"))));



CREATE POLICY "View community visits" ON "public"."community_visits" FOR SELECT USING (true);



CREATE POLICY "View forum replies" ON "public"."forum_replies" FOR SELECT USING (true);



CREATE POLICY "View forum threads" ON "public"."forum_threads" FOR SELECT USING (true);



ALTER TABLE "public"."accountability_alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accountability_alerts_admin_read" ON "public"."accountability_alerts" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "accountability_alerts_public_read" ON "public"."accountability_alerts" FOR SELECT USING ((("is_public" = true) AND ("auth"."uid"() IS NOT NULL)));



ALTER TABLE "public"."admin_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."administrative_divisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_drafts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_drafts_admin_read" ON "public"."agent_drafts" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "agent_drafts_admin_update" ON "public"."agent_drafts" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."agent_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_events_admin_read" ON "public"."agent_events" FOR SELECT USING ("public"."is_admin"());



ALTER TABLE "public"."agent_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_feedback_admin_all" ON "public"."agent_feedback" USING ("public"."is_admin"());



ALTER TABLE "public"."agent_proposals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_proposals_admin_read" ON "public"."agent_proposals" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "agent_proposals_admin_update" ON "public"."agent_proposals" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."agent_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_runs_admin_read" ON "public"."agent_runs" FOR SELECT USING ("public"."is_admin"());



ALTER TABLE "public"."agent_state" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_state_admin_read" ON "public"."agent_state" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "agent_state_admin_update" ON "public"."agent_state" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."ai_configurations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "allow_authenticated_insert" ON "public"."chat_rooms" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "allow_authenticated_select" ON "public"."chat_rooms" FOR SELECT USING ("public"."user_is_room_participant"("id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "allow_delete_own_moderator" ON "public"."community_moderators" FOR DELETE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "allow_insert_moderators" ON "public"."community_moderators" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "allow_update_own_moderator" ON "public"."community_moderators" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."anonymous_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."baraza_spaces" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_promises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenge_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenge_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."channel_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."civic_action_supporters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."civic_action_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."civic_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."civic_clip_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."civic_clip_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."civic_clips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."civic_impact_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."civic_interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."civic_issue_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_award_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_awards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_flairs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_media_processing_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_moderation_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_references" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_active_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_flairs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_institutions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_moderators" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "community_moderators_public_read" ON "public"."community_moderators" FOR SELECT USING (true);



ALTER TABLE "public"."community_poll_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_polls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_visits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contractor_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."country_governance_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crisis_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."development_promises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."election_cycles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expertise_endorsements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forum_replies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forum_reply_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forum_thread_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forum_threads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goat_levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."governance_hierarchies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."government_institutions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."government_positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."government_projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hidden_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."institution_handlers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."institution_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leaderboard_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mod_mail_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mod_mail_threads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moderation_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moderation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ngo_partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."office_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."office_holders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."office_manifestos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."office_promises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."office_proposals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."office_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."official_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."official_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."official_scorecards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."officials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."position_communities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "privacy_community_membership" ON "public"."community_members" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."profile_allows_community_visibility"("user_id")));



ALTER TABLE "public"."profile_customizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_delete_policy" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_insert_policy" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select_policy" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR (NOT (EXISTS ( SELECT 1
   FROM "public"."user_privacy_settings" "ups"
  WHERE (("ups"."user_id" = "profiles"."id") AND ("ups"."profile_visibility" = 'private'::"text")))))));



CREATE POLICY "profiles_update_policy" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."project_collaborating_institutions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_collaborating_officials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_contractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promise_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promise_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rag_chat_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routing_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scout_findings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scout_findings_admin_read" ON "public"."scout_findings" FOR SELECT USING ("public"."is_admin"());



ALTER TABLE "public"."sentiment_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sentiment_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skill_endorsements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_expertise" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_privacy_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_quests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_warnings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_warnings_admin_read" ON "public"."user_warnings" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "user_warnings_own_read" ON "public"."user_warnings" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."vectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";












GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";





































































GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";












GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";






GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";
























































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."acknowledge_warning"("p_warning_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."acknowledge_warning"("p_warning_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."acknowledge_warning"("p_warning_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."agent_hide_comment"("p_comment_id" "uuid", "p_agent" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."agent_hide_comment"("p_comment_id" "uuid", "p_agent" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."agent_hide_comment"("p_comment_id" "uuid", "p_agent" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."agent_hide_post"("p_post_id" "uuid", "p_agent" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."agent_hide_post"("p_post_id" "uuid", "p_agent" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."agent_hide_post"("p_post_id" "uuid", "p_agent" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_create_office_for_position"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_create_office_for_position"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_create_office_for_position"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_link_positions_to_community"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_link_positions_to_community"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_link_positions_to_community"() TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_comment_karma"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_comment_karma"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_comment_karma"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_goat_level"("p_xp" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_goat_level"("p_xp" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_goat_level"("p_xp" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_impact_rating"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_impact_rating"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_impact_rating"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_post_karma"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_post_karma"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_post_karma"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_user_karma"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_user_karma"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_user_karma"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_award_achievements"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_award_achievements"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_award_achievements"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_badge_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_badge_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_badge_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_action" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_action" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_action" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_stale_active_members"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_stale_active_members"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_stale_active_members"() TO "service_role";



GRANT ALL ON FUNCTION "public"."comments_search_vector_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."comments_search_vector_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."comments_search_vector_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."communities_search_vector_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."communities_search_vector_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."communities_search_vector_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_quest"() TO "anon";
GRANT ALL ON FUNCTION "public"."complete_quest"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_quest"() TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_leaderboard_scores"() TO "anon";
GRANT ALL ON FUNCTION "public"."compute_leaderboard_scores"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_leaderboard_scores"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_civic_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_civic_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_civic_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_comment_ratelimited"("p_content" "text", "p_post_id" "uuid", "p_parent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_comment_ratelimited"("p_content" "text", "p_post_id" "uuid", "p_parent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_comment_ratelimited"("p_content" "text", "p_post_id" "uuid", "p_parent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_comment_references"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_comment_references"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_comment_references"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_community_ratelimited"("p_name" "text", "p_display_name" "text", "p_description" "text", "p_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_community_ratelimited"("p_name" "text", "p_display_name" "text", "p_description" "text", "p_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_community_ratelimited"("p_name" "text", "p_display_name" "text", "p_description" "text", "p_category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_community_with_channels"("p_name" "text", "p_display_name" "text", "p_description" "text", "p_category" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_community_with_channels"("p_name" "text", "p_display_name" "text", "p_description" "text", "p_category" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_community_with_channels"("p_name" "text", "p_display_name" "text", "p_description" "text", "p_category" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_office_for_position"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_office_for_position"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_office_for_position"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_post_ratelimited"("p_title" "text", "p_content" "text", "p_community_id" "uuid", "p_tags" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_post_ratelimited"("p_title" "text", "p_content" "text", "p_community_id" "uuid", "p_tags" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_post_ratelimited"("p_title" "text", "p_content" "text", "p_community_id" "uuid", "p_tags" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."development_promises_search_vector_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."development_promises_search_vector_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."development_promises_search_vector_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_case_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_case_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_case_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_agent_threshold"("p_agent" "text", "p_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_agent_threshold"("p_agent" "text", "p_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_agent_threshold"("p_agent" "text", "p_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_channel_analytics"("p_channel_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_channel_analytics"("p_channel_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_channel_analytics"("p_channel_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_online_member_count"("community_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_online_member_count"("community_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_online_member_count"("community_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_personalized_feed"("p_user_id" "uuid", "p_limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_personalized_feed"("p_user_id" "uuid", "p_limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_personalized_feed"("p_user_id" "uuid", "p_limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_posts_with_votes"("user_id_param" "uuid", "limit_param" integer, "offset_param" integer, "sort_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_posts_with_votes"("user_id_param" "uuid", "limit_param" integer, "offset_param" integer, "sort_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_posts_with_votes"("user_id_param" "uuid", "limit_param" integer, "offset_param" integer, "sort_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_with_privacy"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_with_privacy"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_with_privacy"("profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_rate_limit_status"("p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_rate_limit_status"("p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_rate_limit_status"("p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unified_feed"("p_user_id" "uuid", "p_limit_count" integer, "p_offset_count" integer, "p_sort_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unified_feed"("p_user_id" "uuid", "p_limit_count" integer, "p_offset_count" integer, "p_sort_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_feed"("p_user_id" "uuid", "p_limit_count" integer, "p_offset_count" integer, "p_sort_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_warning_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_warning_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_warning_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_weekly_contributions"("community_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_weekly_contributions"("community_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weekly_contributions"("community_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_weekly_visitors"("community_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_weekly_visitors"("community_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weekly_visitors"("community_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."government_projects_search_vector_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."government_projects_search_vector_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."government_projects_search_vector_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_location_community_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_location_community_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_location_community_creation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_channel_metric"("p_channel_id" "uuid", "p_metric" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_channel_metric"("p_channel_id" "uuid", "p_metric" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_channel_metric"("p_channel_id" "uuid", "p_metric" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_user_karma"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_user_karma"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_user_karma"() TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_comment_moderation"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_comment_moderation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_comment_moderation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_community_visit"("p_community_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."log_community_visit"("p_community_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_community_visit"("p_community_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_feed_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_target_id" "text", "p_target_type" "text", "p_metadata" "jsonb", "p_is_public" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."log_feed_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_target_id" "text", "p_target_type" "text", "p_metadata" "jsonb", "p_is_public" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_feed_activity"("p_user_id" "uuid", "p_activity_type" "text", "p_target_id" "text", "p_target_type" "text", "p_metadata" "jsonb", "p_is_public" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_promise_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_promise_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_promise_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_promise_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_promise_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_promise_creation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_question_answered_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_question_answered_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_question_answered_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_verification_vote"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_verification_vote"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_verification_vote"() TO "service_role";



GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."maybe_escalate_civic_issue"() TO "anon";
GRANT ALL ON FUNCTION "public"."maybe_escalate_civic_issue"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."maybe_escalate_civic_issue"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_accountability_alert"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_accountability_alert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_accountability_alert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_community_on_project"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_community_on_project"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_community_on_project"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_on_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_quill_draft_approved"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_quill_draft_approved"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_quill_draft_approved"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_user_warning"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_user_warning"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_user_warning"() TO "service_role";



GRANT ALL ON FUNCTION "public"."officials_search_vector_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."officials_search_vector_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."officials_search_vector_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."posts_search_vector_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."posts_search_vector_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."posts_search_vector_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_locked_channel_deletion"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_locked_channel_deletion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_locked_channel_deletion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."profile_allows_community_visibility"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."profile_allows_community_visibility"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."profile_allows_community_visibility"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."profiles_search_vector_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."profiles_search_vector_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."profiles_search_vector_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recommend_communities"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."recommend_communities"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recommend_communities"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_office_dashboard_snapshot"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_office_dashboard_snapshot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_office_dashboard_snapshot"() TO "service_role";



GRANT ALL ON FUNCTION "public"."route_issue_to_institution"("p_action_id" "uuid", "p_institution_id" "uuid", "p_formal_letter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."route_issue_to_institution"("p_action_id" "uuid", "p_institution_id" "uuid", "p_formal_letter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."route_issue_to_institution"("p_action_id" "uuid", "p_institution_id" "uuid", "p_formal_letter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_community_channels"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_community_channels"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_community_channels"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_civic_action_support_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_civic_action_support_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_civic_action_support_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_issue_comment_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_issue_comment_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_issue_comment_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_official_verification"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_official_verification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_official_verification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_user_action"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_user_action"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_user_action"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_log_post_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_log_post_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_log_post_created"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_log_project_submitted"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_log_project_submitted"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_log_project_submitted"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_administrative_division_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_administrative_division_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_administrative_division_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_all_karma"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_all_karma"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_all_karma"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_baraza_spaces_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_baraza_spaces_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_baraza_spaces_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_challenge_votes"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_challenge_votes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_challenge_votes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_chat_room_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_chat_room_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_chat_room_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_civic_clips_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_civic_clips_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_civic_clips_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_clip_view_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_clip_view_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_clip_view_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_karma_from_awards"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_karma_from_awards"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_karma_from_awards"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_media_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_media_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_media_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_vote_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_vote_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_vote_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_community_active_status"("p_community_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_community_active_status"("p_community_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_community_active_status"("p_community_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_endorsement_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_endorsement_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_endorsement_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_government_institution_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_government_institution_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_government_institution_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_institution_handlers_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_institution_handlers_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_institution_handlers_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_karma_on_vote"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_karma_on_vote"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_karma_on_vote"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_mod_mail_thread_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_mod_mail_thread_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_mod_mail_thread_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_office_promises_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_office_promises_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_office_promises_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_office_tables_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_office_tables_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_office_tables_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_offices_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_offices_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_offices_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_onboarding_progress_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_onboarding_progress_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_onboarding_progress_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_vote_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_vote_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_vote_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_ratelimited"("p_display_name" "text", "p_bio" "text", "p_avatar_url" "text", "p_banner_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_ratelimited"("p_display_name" "text", "p_bio" "text", "p_avatar_url" "text", "p_banner_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_ratelimited"("p_display_name" "text", "p_bio" "text", "p_avatar_url" "text", "p_banner_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_verification_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_verification_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_verification_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sentiment_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sentiment_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sentiment_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_skill_credibility"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_skill_credibility"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_skill_credibility"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_support_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_support_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_support_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_thread_reply_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_thread_reply_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_thread_reply_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_activity_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_activity_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_activity_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_karma"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_karma"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_karma"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_verification_truth_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_verification_truth_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_verification_truth_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_is_room_participant"("room_uuid" "uuid", "user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_room_participant"("room_uuid" "uuid", "user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_room_participant"("room_uuid" "uuid", "user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_comment_media"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_comment_media"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_comment_media"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_project_location"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_project_location"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_project_location"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vote_ratelimited"("p_target_type" "text", "p_target_id" "uuid", "p_vote_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."vote_ratelimited"("p_target_type" "text", "p_target_id" "uuid", "p_vote_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vote_ratelimited"("p_target_type" "text", "p_target_id" "uuid", "p_vote_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."waas_notify_guardian"() TO "anon";
GRANT ALL ON FUNCTION "public"."waas_notify_guardian"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."waas_notify_guardian"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";











































































GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";





















GRANT ALL ON TABLE "public"."accountability_alerts" TO "anon";
GRANT ALL ON TABLE "public"."accountability_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."accountability_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."admin_notifications" TO "anon";
GRANT ALL ON TABLE "public"."admin_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."administrative_divisions" TO "anon";
GRANT ALL ON TABLE "public"."administrative_divisions" TO "authenticated";
GRANT ALL ON TABLE "public"."administrative_divisions" TO "service_role";



GRANT ALL ON TABLE "public"."agent_drafts" TO "anon";
GRANT ALL ON TABLE "public"."agent_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."agent_events" TO "anon";
GRANT ALL ON TABLE "public"."agent_events" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_events" TO "service_role";



GRANT ALL ON TABLE "public"."agent_feedback" TO "anon";
GRANT ALL ON TABLE "public"."agent_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."agent_proposals" TO "anon";
GRANT ALL ON TABLE "public"."agent_proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_proposals" TO "service_role";



GRANT ALL ON TABLE "public"."agent_runs" TO "anon";
GRANT ALL ON TABLE "public"."agent_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_runs" TO "service_role";



GRANT ALL ON TABLE "public"."agent_state" TO "anon";
GRANT ALL ON TABLE "public"."agent_state" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_state" TO "service_role";



GRANT ALL ON TABLE "public"."ai_configurations" TO "anon";
GRANT ALL ON TABLE "public"."ai_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."anonymous_reports" TO "anon";
GRANT ALL ON TABLE "public"."anonymous_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."anonymous_reports" TO "service_role";



GRANT ALL ON TABLE "public"."api_metrics" TO "anon";
GRANT ALL ON TABLE "public"."api_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."api_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."baraza_spaces" TO "anon";
GRANT ALL ON TABLE "public"."baraza_spaces" TO "authenticated";
GRANT ALL ON TABLE "public"."baraza_spaces" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_promises" TO "anon";
GRANT ALL ON TABLE "public"."campaign_promises" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_promises" TO "service_role";



GRANT ALL ON TABLE "public"."challenge_submissions" TO "anon";
GRANT ALL ON TABLE "public"."challenge_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."challenge_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."challenge_votes" TO "anon";
GRANT ALL ON TABLE "public"."challenge_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."challenge_votes" TO "service_role";



GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";



GRANT ALL ON TABLE "public"."channel_analytics" TO "anon";
GRANT ALL ON TABLE "public"."channel_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."channel_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."channels" TO "anon";
GRANT ALL ON TABLE "public"."channels" TO "authenticated";
GRANT ALL ON TABLE "public"."channels" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_participants" TO "anon";
GRANT ALL ON TABLE "public"."chat_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_participants" TO "service_role";



GRANT ALL ON TABLE "public"."chat_rooms" TO "anon";
GRANT ALL ON TABLE "public"."chat_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."civic_actions" TO "anon";
GRANT ALL ON TABLE "public"."civic_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."civic_actions" TO "service_role";



GRANT ALL ON TABLE "public"."civic_action_analytics" TO "anon";
GRANT ALL ON TABLE "public"."civic_action_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."civic_action_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."civic_action_supporters" TO "anon";
GRANT ALL ON TABLE "public"."civic_action_supporters" TO "authenticated";
GRANT ALL ON TABLE "public"."civic_action_supporters" TO "service_role";



GRANT ALL ON TABLE "public"."civic_action_updates" TO "anon";
GRANT ALL ON TABLE "public"."civic_action_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."civic_action_updates" TO "service_role";



GRANT ALL ON TABLE "public"."civic_clip_variants" TO "anon";
GRANT ALL ON TABLE "public"."civic_clip_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."civic_clip_variants" TO "service_role";



GRANT ALL ON TABLE "public"."civic_clip_views" TO "anon";
GRANT ALL ON TABLE "public"."civic_clip_views" TO "authenticated";
GRANT ALL ON TABLE "public"."civic_clip_views" TO "service_role";



GRANT ALL ON TABLE "public"."civic_clips" TO "anon";
GRANT ALL ON TABLE "public"."civic_clips" TO "authenticated";
GRANT ALL ON TABLE "public"."civic_clips" TO "service_role";



GRANT ALL ON TABLE "public"."civic_impact_scores" TO "anon";
GRANT ALL ON TABLE "public"."civic_impact_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."civic_impact_scores" TO "service_role";



GRANT ALL ON TABLE "public"."civic_interests" TO "anon";
GRANT ALL ON TABLE "public"."civic_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."civic_interests" TO "service_role";



GRANT ALL ON TABLE "public"."civic_issue_comments" TO "anon";
GRANT ALL ON TABLE "public"."civic_issue_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."civic_issue_comments" TO "service_role";



GRANT ALL ON TABLE "public"."comment_award_assignments" TO "anon";
GRANT ALL ON TABLE "public"."comment_award_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_award_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."comment_awards" TO "anon";
GRANT ALL ON TABLE "public"."comment_awards" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_awards" TO "service_role";



GRANT ALL ON TABLE "public"."comment_flairs" TO "anon";
GRANT ALL ON TABLE "public"."comment_flairs" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_flairs" TO "service_role";



GRANT ALL ON TABLE "public"."comment_media" TO "anon";
GRANT ALL ON TABLE "public"."comment_media" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_media" TO "service_role";



GRANT ALL ON TABLE "public"."comment_media_processing_log" TO "anon";
GRANT ALL ON TABLE "public"."comment_media_processing_log" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_media_processing_log" TO "service_role";



GRANT ALL ON TABLE "public"."comment_moderation_log" TO "anon";
GRANT ALL ON TABLE "public"."comment_moderation_log" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_moderation_log" TO "service_role";



GRANT ALL ON TABLE "public"."comment_notifications" TO "anon";
GRANT ALL ON TABLE "public"."comment_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."comment_references" TO "anon";
GRANT ALL ON TABLE "public"."comment_references" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_references" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."communities" TO "anon";
GRANT ALL ON TABLE "public"."communities" TO "authenticated";
GRANT ALL ON TABLE "public"."communities" TO "service_role";



GRANT ALL ON TABLE "public"."community_members" TO "anon";
GRANT ALL ON TABLE "public"."community_members" TO "authenticated";
GRANT ALL ON TABLE "public"."community_members" TO "service_role";



GRANT ALL ON TABLE "public"."communities_with_stats" TO "anon";
GRANT ALL ON TABLE "public"."communities_with_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."communities_with_stats" TO "service_role";



GRANT ALL ON TABLE "public"."community_active_members" TO "anon";
GRANT ALL ON TABLE "public"."community_active_members" TO "authenticated";
GRANT ALL ON TABLE "public"."community_active_members" TO "service_role";



GRANT ALL ON TABLE "public"."community_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."community_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."community_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."community_events" TO "anon";
GRANT ALL ON TABLE "public"."community_events" TO "authenticated";
GRANT ALL ON TABLE "public"."community_events" TO "service_role";



GRANT ALL ON TABLE "public"."community_flairs" TO "anon";
GRANT ALL ON TABLE "public"."community_flairs" TO "authenticated";
GRANT ALL ON TABLE "public"."community_flairs" TO "service_role";



GRANT ALL ON TABLE "public"."community_institutions" TO "anon";
GRANT ALL ON TABLE "public"."community_institutions" TO "authenticated";
GRANT ALL ON TABLE "public"."community_institutions" TO "service_role";



GRANT ALL ON TABLE "public"."community_moderators" TO "anon";
GRANT ALL ON TABLE "public"."community_moderators" TO "authenticated";
GRANT ALL ON TABLE "public"."community_moderators" TO "service_role";



GRANT ALL ON TABLE "public"."community_poll_votes" TO "anon";
GRANT ALL ON TABLE "public"."community_poll_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."community_poll_votes" TO "service_role";



GRANT ALL ON TABLE "public"."community_polls" TO "anon";
GRANT ALL ON TABLE "public"."community_polls" TO "authenticated";
GRANT ALL ON TABLE "public"."community_polls" TO "service_role";



GRANT ALL ON TABLE "public"."community_rules" TO "anon";
GRANT ALL ON TABLE "public"."community_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."community_rules" TO "service_role";



GRANT ALL ON TABLE "public"."community_visits" TO "anon";
GRANT ALL ON TABLE "public"."community_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."community_visits" TO "service_role";



GRANT ALL ON TABLE "public"."constituencies" TO "anon";
GRANT ALL ON TABLE "public"."constituencies" TO "authenticated";
GRANT ALL ON TABLE "public"."constituencies" TO "service_role";



GRANT ALL ON TABLE "public"."content_flags" TO "anon";
GRANT ALL ON TABLE "public"."content_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."content_flags" TO "service_role";



GRANT ALL ON TABLE "public"."contractors" TO "anon";
GRANT ALL ON TABLE "public"."contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."contractors" TO "service_role";



GRANT ALL ON TABLE "public"."contractor_contacts" TO "anon";
GRANT ALL ON TABLE "public"."contractor_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."contractor_ratings" TO "anon";
GRANT ALL ON TABLE "public"."contractor_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."counties" TO "anon";
GRANT ALL ON TABLE "public"."counties" TO "authenticated";
GRANT ALL ON TABLE "public"."counties" TO "service_role";



GRANT ALL ON TABLE "public"."country_governance_templates" TO "anon";
GRANT ALL ON TABLE "public"."country_governance_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."country_governance_templates" TO "service_role";



GRANT ALL ON TABLE "public"."crisis_reports" TO "anon";
GRANT ALL ON TABLE "public"."crisis_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."crisis_reports" TO "service_role";



GRANT ALL ON TABLE "public"."development_promises" TO "anon";
GRANT ALL ON TABLE "public"."development_promises" TO "authenticated";
GRANT ALL ON TABLE "public"."development_promises" TO "service_role";



GRANT ALL ON TABLE "public"."election_cycles" TO "anon";
GRANT ALL ON TABLE "public"."election_cycles" TO "authenticated";
GRANT ALL ON TABLE "public"."election_cycles" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."expertise_endorsements" TO "anon";
GRANT ALL ON TABLE "public"."expertise_endorsements" TO "authenticated";
GRANT ALL ON TABLE "public"."expertise_endorsements" TO "service_role";



GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";



GRANT ALL ON TABLE "public"."feed_activities" TO "anon";
GRANT ALL ON TABLE "public"."feed_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_activities" TO "service_role";



GRANT ALL ON TABLE "public"."forum_replies" TO "anon";
GRANT ALL ON TABLE "public"."forum_replies" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_replies" TO "service_role";



GRANT ALL ON TABLE "public"."forum_reply_reactions" TO "anon";
GRANT ALL ON TABLE "public"."forum_reply_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_reply_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."forum_thread_reactions" TO "anon";
GRANT ALL ON TABLE "public"."forum_thread_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_thread_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."forum_threads" TO "anon";
GRANT ALL ON TABLE "public"."forum_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_threads" TO "service_role";



GRANT ALL ON TABLE "public"."goat_levels" TO "anon";
GRANT ALL ON TABLE "public"."goat_levels" TO "authenticated";
GRANT ALL ON TABLE "public"."goat_levels" TO "service_role";



GRANT ALL ON TABLE "public"."governance_hierarchies" TO "anon";
GRANT ALL ON TABLE "public"."governance_hierarchies" TO "authenticated";
GRANT ALL ON TABLE "public"."governance_hierarchies" TO "service_role";



GRANT ALL ON TABLE "public"."government_institutions" TO "anon";
GRANT ALL ON TABLE "public"."government_institutions" TO "authenticated";
GRANT ALL ON TABLE "public"."government_institutions" TO "service_role";



GRANT ALL ON TABLE "public"."government_positions" TO "anon";
GRANT ALL ON TABLE "public"."government_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."government_positions" TO "service_role";



GRANT ALL ON TABLE "public"."government_projects" TO "anon";
GRANT ALL ON TABLE "public"."government_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."government_projects" TO "service_role";



GRANT ALL ON TABLE "public"."hidden_items" TO "anon";
GRANT ALL ON TABLE "public"."hidden_items" TO "authenticated";
GRANT ALL ON TABLE "public"."hidden_items" TO "service_role";



GRANT ALL ON TABLE "public"."institution_handlers" TO "anon";
GRANT ALL ON TABLE "public"."institution_handlers" TO "authenticated";
GRANT ALL ON TABLE "public"."institution_handlers" TO "service_role";



GRANT ALL ON TABLE "public"."institution_updates" TO "anon";
GRANT ALL ON TABLE "public"."institution_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."institution_updates" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard_scores" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard_scores" TO "service_role";



GRANT ALL ON TABLE "public"."message_reactions" TO "anon";
GRANT ALL ON TABLE "public"."message_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."message_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."mod_mail_messages" TO "anon";
GRANT ALL ON TABLE "public"."mod_mail_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."mod_mail_messages" TO "service_role";



GRANT ALL ON TABLE "public"."mod_mail_threads" TO "anon";
GRANT ALL ON TABLE "public"."mod_mail_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."mod_mail_threads" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_log" TO "anon";
GRANT ALL ON TABLE "public"."moderation_log" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_log" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ngo_partners" TO "anon";
GRANT ALL ON TABLE "public"."ngo_partners" TO "authenticated";
GRANT ALL ON TABLE "public"."ngo_partners" TO "service_role";



GRANT ALL ON TABLE "public"."office_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."office_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."office_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."office_holders" TO "anon";
GRANT ALL ON TABLE "public"."office_holders" TO "authenticated";
GRANT ALL ON TABLE "public"."office_holders" TO "service_role";



GRANT ALL ON TABLE "public"."office_questions" TO "anon";
GRANT ALL ON TABLE "public"."office_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."office_questions" TO "service_role";



GRANT ALL ON TABLE "public"."office_dashboard_snapshot" TO "anon";
GRANT ALL ON TABLE "public"."office_dashboard_snapshot" TO "authenticated";
GRANT ALL ON TABLE "public"."office_dashboard_snapshot" TO "service_role";



GRANT ALL ON TABLE "public"."office_manifestos" TO "anon";
GRANT ALL ON TABLE "public"."office_manifestos" TO "authenticated";
GRANT ALL ON TABLE "public"."office_manifestos" TO "service_role";



GRANT ALL ON TABLE "public"."office_promises" TO "anon";
GRANT ALL ON TABLE "public"."office_promises" TO "authenticated";
GRANT ALL ON TABLE "public"."office_promises" TO "service_role";



GRANT ALL ON TABLE "public"."office_proposals" TO "anon";
GRANT ALL ON TABLE "public"."office_proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."office_proposals" TO "service_role";



GRANT ALL ON TABLE "public"."offices" TO "anon";
GRANT ALL ON TABLE "public"."offices" TO "authenticated";
GRANT ALL ON TABLE "public"."offices" TO "service_role";



GRANT ALL ON TABLE "public"."official_contacts" TO "anon";
GRANT ALL ON TABLE "public"."official_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."official_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."official_responses" TO "anon";
GRANT ALL ON TABLE "public"."official_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."official_responses" TO "service_role";



GRANT ALL ON TABLE "public"."official_scorecards" TO "anon";
GRANT ALL ON TABLE "public"."official_scorecards" TO "authenticated";
GRANT ALL ON TABLE "public"."official_scorecards" TO "service_role";



GRANT ALL ON TABLE "public"."officials" TO "anon";
GRANT ALL ON TABLE "public"."officials" TO "authenticated";
GRANT ALL ON TABLE "public"."officials" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_progress" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_progress" TO "service_role";



GRANT ALL ON TABLE "public"."performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."popular_communities" TO "anon";
GRANT ALL ON TABLE "public"."popular_communities" TO "authenticated";
GRANT ALL ON TABLE "public"."popular_communities" TO "service_role";



GRANT ALL ON TABLE "public"."position_communities" TO "anon";
GRANT ALL ON TABLE "public"."position_communities" TO "authenticated";
GRANT ALL ON TABLE "public"."position_communities" TO "service_role";



GRANT ALL ON TABLE "public"."post_media" TO "anon";
GRANT ALL ON TABLE "public"."post_media" TO "authenticated";
GRANT ALL ON TABLE "public"."post_media" TO "service_role";



GRANT ALL ON TABLE "public"."profile_customizations" TO "anon";
GRANT ALL ON TABLE "public"."profile_customizations" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_customizations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_collaborating_institutions" TO "anon";
GRANT ALL ON TABLE "public"."project_collaborating_institutions" TO "authenticated";
GRANT ALL ON TABLE "public"."project_collaborating_institutions" TO "service_role";



GRANT ALL ON TABLE "public"."project_collaborating_officials" TO "anon";
GRANT ALL ON TABLE "public"."project_collaborating_officials" TO "authenticated";
GRANT ALL ON TABLE "public"."project_collaborating_officials" TO "service_role";



GRANT ALL ON TABLE "public"."project_comments" TO "anon";
GRANT ALL ON TABLE "public"."project_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."project_comments" TO "service_role";



GRANT ALL ON TABLE "public"."project_contractors" TO "anon";
GRANT ALL ON TABLE "public"."project_contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."project_contractors" TO "service_role";



GRANT ALL ON TABLE "public"."project_updates" TO "anon";
GRANT ALL ON TABLE "public"."project_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."project_updates" TO "service_role";



GRANT ALL ON TABLE "public"."project_verifications" TO "anon";
GRANT ALL ON TABLE "public"."project_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."project_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."project_views" TO "anon";
GRANT ALL ON TABLE "public"."project_views" TO "authenticated";
GRANT ALL ON TABLE "public"."project_views" TO "service_role";



GRANT ALL ON TABLE "public"."promise_updates" TO "anon";
GRANT ALL ON TABLE "public"."promise_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."promise_updates" TO "service_role";



GRANT ALL ON TABLE "public"."promise_verifications" TO "anon";
GRANT ALL ON TABLE "public"."promise_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."promise_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."public_community_moderators" TO "anon";
GRANT ALL ON TABLE "public"."public_community_moderators" TO "authenticated";
GRANT ALL ON TABLE "public"."public_community_moderators" TO "service_role";



GRANT ALL ON TABLE "public"."public_contractors" TO "anon";
GRANT ALL ON TABLE "public"."public_contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."public_contractors" TO "service_role";



GRANT ALL ON TABLE "public"."quests" TO "anon";
GRANT ALL ON TABLE "public"."quests" TO "authenticated";
GRANT ALL ON TABLE "public"."quests" TO "service_role";



GRANT ALL ON TABLE "public"."rag_chat_history" TO "anon";
GRANT ALL ON TABLE "public"."rag_chat_history" TO "authenticated";
GRANT ALL ON TABLE "public"."rag_chat_history" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limit_stats" TO "anon";
GRANT ALL ON TABLE "public"."rate_limit_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_stats" TO "service_role";



GRANT ALL ON TABLE "public"."routing_logs" TO "anon";
GRANT ALL ON TABLE "public"."routing_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."routing_logs" TO "service_role";



GRANT ALL ON TABLE "public"."saved_items" TO "anon";
GRANT ALL ON TABLE "public"."saved_items" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_items" TO "service_role";



GRANT ALL ON TABLE "public"."scout_findings" TO "anon";
GRANT ALL ON TABLE "public"."scout_findings" TO "authenticated";
GRANT ALL ON TABLE "public"."scout_findings" TO "service_role";



GRANT ALL ON TABLE "public"."sentiment_scores" TO "anon";
GRANT ALL ON TABLE "public"."sentiment_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."sentiment_scores" TO "service_role";



GRANT ALL ON TABLE "public"."sentiment_votes" TO "anon";
GRANT ALL ON TABLE "public"."sentiment_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."sentiment_votes" TO "service_role";



GRANT ALL ON TABLE "public"."skill_endorsements" TO "anon";
GRANT ALL ON TABLE "public"."skill_endorsements" TO "authenticated";
GRANT ALL ON TABLE "public"."skill_endorsements" TO "service_role";



GRANT ALL ON TABLE "public"."skills" TO "anon";
GRANT ALL ON TABLE "public"."skills" TO "authenticated";
GRANT ALL ON TABLE "public"."skills" TO "service_role";



GRANT ALL ON TABLE "public"."system_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."system_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."system_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."trending_posts" TO "anon";
GRANT ALL ON TABLE "public"."trending_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."trending_posts" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_actions" TO "anon";
GRANT ALL ON TABLE "public"."user_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_actions" TO "service_role";



GRANT ALL ON TABLE "public"."user_activities" TO "anon";
GRANT ALL ON TABLE "public"."user_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activities" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."user_expertise" TO "anon";
GRANT ALL ON TABLE "public"."user_expertise" TO "authenticated";
GRANT ALL ON TABLE "public"."user_expertise" TO "service_role";



GRANT ALL ON TABLE "public"."user_interests" TO "anon";
GRANT ALL ON TABLE "public"."user_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."user_interests" TO "service_role";



GRANT ALL ON TABLE "public"."user_privacy_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_privacy_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_privacy_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_quests" TO "anon";
GRANT ALL ON TABLE "public"."user_quests" TO "authenticated";
GRANT ALL ON TABLE "public"."user_quests" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_skills" TO "anon";
GRANT ALL ON TABLE "public"."user_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."user_skills" TO "service_role";



GRANT ALL ON TABLE "public"."user_warnings" TO "anon";
GRANT ALL ON TABLE "public"."user_warnings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_warnings" TO "service_role";



GRANT ALL ON TABLE "public"."vectors" TO "anon";
GRANT ALL ON TABLE "public"."vectors" TO "authenticated";
GRANT ALL ON TABLE "public"."vectors" TO "service_role";



GRANT ALL ON TABLE "public"."verification_votes" TO "anon";
GRANT ALL ON TABLE "public"."verification_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."verification_votes" TO "service_role";



GRANT ALL ON TABLE "public"."verifications" TO "anon";
GRANT ALL ON TABLE "public"."verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."verifications" TO "service_role";



GRANT ALL ON TABLE "public"."votes" TO "anon";
GRANT ALL ON TABLE "public"."votes" TO "authenticated";
GRANT ALL ON TABLE "public"."votes" TO "service_role";



GRANT ALL ON TABLE "public"."wards" TO "anon";
GRANT ALL ON TABLE "public"."wards" TO "authenticated";
GRANT ALL ON TABLE "public"."wards" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































