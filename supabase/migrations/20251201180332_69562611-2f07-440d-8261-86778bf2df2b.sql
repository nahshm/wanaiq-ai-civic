-- =====================================================
-- FIX WARN-LEVEL SECURITY ISSUES
-- 1. Moderator list exposure (restrict visibility)
-- 2. Function search path mutable (set search_path on all functions)
-- =====================================================

-- =====================================================
-- PART 1: Fix moderator list exposure
-- =====================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "allow_select_moderators" ON community_moderators;
DROP POLICY IF EXISTS "moderators_see_full_details" ON community_moderators;

-- Create restrictive policy: only moderators/admins can see full details
CREATE POLICY "moderators_restricted_view"
ON community_moderators FOR SELECT
USING (
  -- Moderators and admins of the same community can see full details
  EXISTS (
    SELECT 1 FROM community_moderators cm
    WHERE cm.community_id = community_moderators.community_id
    AND cm.user_id = auth.uid()
  )
  -- Or viewing own record
  OR user_id = auth.uid()
);

-- Create a public view with limited info for regular members
DROP VIEW IF EXISTS public_community_moderators;
CREATE VIEW public_community_moderators 
WITH (security_invoker = true) AS
SELECT 
  cm.id,
  cm.community_id,
  cm.user_id,
  cm.role,
  cm.added_at,
  -- Only expose minimal profile info
  p.username,
  p.display_name,
  p.avatar_url
FROM community_moderators cm
LEFT JOIN profiles p ON cm.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON public_community_moderators TO authenticated;

-- =====================================================
-- PART 2: Fix all function search paths
-- =====================================================

-- calculate_comment_karma
CREATE OR REPLACE FUNCTION public.calculate_comment_karma(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  comment_karma INTEGER := 0;
BEGIN
  SELECT COALESCE(FLOOR((SUM(upvotes) - SUM(downvotes)) / 10.0), 0)::INTEGER INTO comment_karma
  FROM public.comments
  WHERE author_id = user_uuid;
  RETURN comment_karma;
END;
$function$;

-- calculate_post_karma
CREATE OR REPLACE FUNCTION public.calculate_post_karma(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  post_karma INTEGER := 0;
BEGIN
  SELECT COALESCE(FLOOR((SUM(upvotes) - SUM(downvotes)) / 10.0), 0)::INTEGER INTO post_karma
  FROM public.posts
  WHERE author_id = user_uuid;
  RETURN post_karma;
END;
$function$;

-- calculate_user_karma
CREATE OR REPLACE FUNCTION public.calculate_user_karma(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN calculate_post_karma(user_uuid) + calculate_comment_karma(user_uuid);
END;
$function$;

-- check_and_award_achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- check_badge_progress
CREATE OR REPLACE FUNCTION public.check_badge_progress()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- cleanup_stale_active_members
CREATE OR REPLACE FUNCTION public.cleanup_stale_active_members()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM community_active_members
  WHERE last_seen_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- comments_search_vector_update
CREATE OR REPLACE FUNCTION public.comments_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$function$;

-- communities_search_vector_update
CREATE OR REPLACE FUNCTION public.communities_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$function$;

-- complete_quest
CREATE OR REPLACE FUNCTION public.complete_quest()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO public.user_actions (user_id, action_type, action_value, entity_type, entity_id)
        SELECT NEW.user_id, 'quest_completed', q.points, 'quest', NEW.quest_id
        FROM public.quests q
        WHERE q.id = NEW.quest_id;
    END IF;
    RETURN NEW;
END;
$function$;

-- compute_leaderboard_scores
CREATE OR REPLACE FUNCTION public.compute_leaderboard_scores()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- create_civic_notifications
CREATE OR REPLACE FUNCTION public.create_civic_notifications()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- create_comment_references
CREATE OR REPLACE FUNCTION public.create_comment_references()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- development_promises_search_vector_update
CREATE OR REPLACE FUNCTION public.development_promises_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C');
  RETURN NEW;
END;
$function$;

-- generate_case_number
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.case_number := UPPER(SUBSTRING(NEW.category, 1, 3)) || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(MD5(NEW.id::text), 1, 4));
    RETURN NEW;
END;
$function$;

-- get_online_member_count
CREATE OR REPLACE FUNCTION public.get_online_member_count(community_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM community_active_members
    WHERE community_id = community_uuid
      AND last_seen_at > NOW() - INTERVAL '15 minutes'
  );
END;
$function$;

-- government_projects_search_vector_update
CREATE OR REPLACE FUNCTION public.government_projects_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.county, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.constituency, '')), 'C');
  RETURN NEW;
END;
$function$;

-- handle_location_community_creation
CREATE OR REPLACE FUNCTION public.handle_location_community_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    community_id UUID;
    v_county TEXT;
    v_constituency TEXT;
    v_ward TEXT;
BEGIN
    v_county := NEW.county;
    v_constituency := NEW.constituency;
    v_ward := NEW.ward;
    IF v_county IS NOT NULL THEN
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value)
        VALUES ('county-' || lower(regexp_replace(v_county, '\s+', '-', 'g')), v_county || ' County', 
                'Official community for residents of ' || v_county || ' County', 'governance', 'location', 'county', v_county)
        ON CONFLICT (location_type, location_value) WHERE type = 'location' DO NOTHING;
    END IF;
    IF v_constituency IS NOT NULL THEN
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value)
        VALUES ('constituency-' || lower(regexp_replace(v_constituency, '\s+', '-', 'g')), v_constituency || ' Constituency',
                'Official community for residents of ' || v_constituency || ' Constituency', 'governance', 'location', 'constituency', v_constituency)
        ON CONFLICT (location_type, location_value) WHERE type = 'location' DO NOTHING;
    END IF;
    IF v_ward IS NOT NULL THEN
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value)
        VALUES ('ward-' || lower(regexp_replace(v_ward, '\s+', '-', 'g')), v_ward || ' Ward',
                'Official community for residents of ' || v_ward || ' Ward', 'governance', 'location', 'ward', v_ward)
        ON CONFLICT (location_type, location_value) WHERE type = 'location'
        DO UPDATE SET updated_at = NOW()
        RETURNING id INTO community_id;
        IF community_id IS NULL THEN
            SELECT id INTO community_id FROM public.communities WHERE location_type = 'ward' AND location_value = v_ward AND type = 'location';
        ELSE
            INSERT INTO public.community_members (user_id, community_id, role) VALUES (NEW.id, community_id, 'admin')
            ON CONFLICT (user_id, community_id) DO UPDATE SET role = 'admin';
            BEGIN
                INSERT INTO public.community_moderators (user_id, community_id, role) VALUES (NEW.id, community_id, 'admin');
            EXCEPTION WHEN undefined_table THEN NULL;
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
          COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- initialize_user_karma
CREATE OR REPLACE FUNCTION public.initialize_user_karma()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET karma = calculate_user_karma(NEW.author_id), last_activity = now()
  WHERE id = NEW.author_id;
  RETURN NEW;
END;
$function$;

-- log_comment_moderation
CREATE OR REPLACE FUNCTION public.log_comment_moderation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- notify_community_on_project
CREATE OR REPLACE FUNCTION public.notify_community_on_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- officials_search_vector_update
CREATE OR REPLACE FUNCTION public.officials_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.position, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.constituency, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.county, '')), 'B');
  RETURN NEW;
END;
$function$;

-- posts_search_vector_update
CREATE OR REPLACE FUNCTION public.posts_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$function$;

-- profiles_search_vector_update
CREATE OR REPLACE FUNCTION public.profiles_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'B');
  RETURN NEW;
END;
$function$;

-- track_user_action
CREATE OR REPLACE FUNCTION public.track_user_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- update_all_karma
CREATE OR REPLACE FUNCTION public.update_all_karma()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET post_karma = calculate_post_karma(id), comment_karma = calculate_comment_karma(id),
      karma = calculate_user_karma(id), last_activity = COALESCE(last_activity, NOW())
  WHERE id IN (SELECT id FROM public.profiles);
END;
$function$;

-- update_challenge_votes
CREATE OR REPLACE FUNCTION public.update_challenge_votes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    UPDATE public.challenge_submissions
    SET votes = (SELECT COUNT(*) FROM public.challenge_votes WHERE submission_id = NEW.submission_id)
    WHERE id = NEW.submission_id;
    RETURN NEW;
END;
$function$;

-- update_chat_room_timestamp
CREATE OR REPLACE FUNCTION public.update_chat_room_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE chat_rooms SET updated_at = NOW() WHERE id = NEW.room_id;
  RETURN NEW;
END;
$function$;

-- update_civic_clips_updated_at
CREATE OR REPLACE FUNCTION public.update_civic_clips_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- update_clip_view_counts
CREATE OR REPLACE FUNCTION public.update_clip_view_counts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE civic_clips
  SET views_count = views_count + 1, watch_time_total = watch_time_total + NEW.watch_duration,
      average_watch_percentage = (SELECT AVG(watch_percentage) FROM civic_clip_views WHERE clip_id = NEW.clip_id),
      updated_at = now()
  WHERE id = NEW.clip_id;
  RETURN NEW;
END;
$function$;

-- update_comment_karma_from_awards
CREATE OR REPLACE FUNCTION public.update_comment_karma_from_awards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- update_comment_media_count
CREATE OR REPLACE FUNCTION public.update_comment_media_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE public.comments SET updated_at = now() WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- update_comment_vote_counts
CREATE OR REPLACE FUNCTION public.update_comment_vote_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- update_community_active_status
CREATE OR REPLACE FUNCTION public.update_community_active_status(p_community_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  INSERT INTO community_active_members (community_id, user_id, last_seen_at)
  VALUES (p_community_id, p_user_id, NOW())
  ON CONFLICT (community_id, user_id) DO UPDATE SET last_seen_at = NOW();
END;
$function$;

-- update_karma_on_vote
CREATE OR REPLACE FUNCTION public.update_karma_on_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- update_mod_mail_thread_timestamp
CREATE OR REPLACE FUNCTION public.update_mod_mail_thread_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE mod_mail_threads SET updated_at = NOW() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$function$;

-- update_onboarding_progress_updated_at
CREATE OR REPLACE FUNCTION public.update_onboarding_progress_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- update_post_vote_counts
CREATE OR REPLACE FUNCTION public.update_post_vote_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- update_skill_credibility
CREATE OR REPLACE FUNCTION public.update_skill_credibility()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    UPDATE public.user_skills
    SET endorsement_count = (SELECT COUNT(*) FROM public.skill_endorsements WHERE user_skill_id = NEW.user_skill_id),
        credibility_score = (SELECT COALESCE(SUM(weight), 0) FROM public.skill_endorsements WHERE user_skill_id = NEW.user_skill_id)
    WHERE id = NEW.user_skill_id;
    RETURN NEW;
END;
$function$;

-- update_support_count
CREATE OR REPLACE FUNCTION public.update_support_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE civic_actions SET support_count = support_count + 1 WHERE id = NEW.action_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE civic_actions SET support_count = GREATEST(support_count - 1, 0) WHERE id = OLD.action_id; END IF;
  RETURN NULL;
END;
$function$;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- update_user_activity_stats
CREATE OR REPLACE FUNCTION public.update_user_activity_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- update_user_karma
CREATE OR REPLACE FUNCTION public.update_user_karma()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET karma = calculate_user_karma(NEW.author_id), last_activity = now() WHERE id = NEW.author_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- validate_comment_media
CREATE OR REPLACE FUNCTION public.validate_comment_media()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- validate_project_location
CREATE OR REPLACE FUNCTION public.validate_project_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_user_county TEXT;
    v_user_constituency TEXT;
    v_user_ward TEXT;
    v_is_member BOOLEAN;
BEGIN
    IF NEW.ward IS NULL AND NEW.constituency IS NULL AND NEW.county IS NULL THEN RETURN NEW; END IF;
    SELECT county, constituency, ward INTO v_user_county, v_user_constituency, v_user_ward FROM public.profiles WHERE id = NEW.created_by;
    IF (NEW.ward IS NOT NULL AND NEW.ward = v_user_ward) OR
       (NEW.constituency IS NOT NULL AND NEW.constituency = v_user_constituency AND NEW.ward IS NULL) OR
       (NEW.county IS NOT NULL AND NEW.county = v_user_county AND NEW.constituency IS NULL AND NEW.ward IS NULL) THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'You can only post projects for your registered location (%, %, %) or national-level projects. Project location: County=%, Constituency=%, Ward=%',
        v_user_county, v_user_constituency, v_user_ward, NEW.county, NEW.constituency, NEW.ward;
END;
$function$;