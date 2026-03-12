-- Migration: User Generated Content & Auto-Communities
-- Description: Updates profiles, communities, and government_projects tables. Adds triggers for auto-community creation and project notifications.

-- 1. Update Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS constituency TEXT,
ADD COLUMN IF NOT EXISTS ward TEXT;

-- 2. Update Communities Table
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'interest' CHECK (type IN ('location', 'interest')),
ADD COLUMN IF NOT EXISTS location_type TEXT CHECK (location_type IN ('ward', 'constituency', 'county', 'national')),
ADD COLUMN IF NOT EXISTS location_value TEXT;

-- Add unique constraint to prevent duplicate location communities
ALTER TABLE public.communities 
DROP CONSTRAINT IF EXISTS communities_location_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_communities_location 
ON public.communities (location_type, location_value) 
WHERE type = 'location';

-- 3. Update Government Projects Table
ALTER TABLE public.government_projects 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ward TEXT,
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}', -- Photos, Videos
ADD COLUMN IF NOT EXISTS documents_urls TEXT[] DEFAULT '{}', -- Plans, Gazetted Notices
ADD COLUMN IF NOT EXISTS community_confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (community_confidence >= 0 AND community_confidence <= 1);

-- 3.5 Create User Actions Table (for Gamification Tracking)
CREATE TABLE IF NOT EXISTS public.user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'project_submitted', 'project_verified', 'update_posted', 'fact_check_submitted', etc.
    action_value INTEGER DEFAULT 0, -- Points earned or relevance score
    entity_type TEXT, -- 'project', 'update', 'comment', etc.
    entity_id UUID, -- Reference to the entity
    metadata JSONB DEFAULT '{}', -- Additional context
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON public.user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_type ON public.user_actions(action_type);

-- 3.6 Enhance Project Updates for Fact-Checking
ALTER TABLE public.project_updates 
ADD COLUMN IF NOT EXISTS is_fact_check BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fact_check_status TEXT CHECK (fact_check_status IN ('pending', 'confirmed', 'disputed', 'debunked')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS fact_checker_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS fact_check_notes TEXT;

-- 4. Function to Auto-Create Communities on Profile Update
CREATE OR REPLACE FUNCTION public.handle_location_community_creation()
RETURNS TRIGGER AS $$
DECLARE
    community_id UUID;
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
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value)
        VALUES (
            'county-' || lower(regexp_replace(v_county, '\s+', '-', 'g')), 
            v_county || ' County', 
            'Official community for residents of ' || v_county || ' County', 
            'governance', 
            'location', 
            'county', 
            v_county
        )
        ON CONFLICT (location_type, location_value) WHERE type = 'location'
        DO NOTHING;
        
        -- If we want to add the user as member/admin, we'd need to fetch the ID. 
        -- For now, let's just ensure the community exists.
    END IF;

    -- 2. Check/Create Constituency Community
    IF v_constituency IS NOT NULL THEN
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value)
        VALUES (
            'constituency-' || lower(regexp_replace(v_constituency, '\s+', '-', 'g')), 
            v_constituency || ' Constituency', 
            'Official community for residents of ' || v_constituency || ' Constituency', 
            'governance', 
            'location', 
            'constituency', 
            v_constituency
        )
        ON CONFLICT (location_type, location_value) WHERE type = 'location'
        DO NOTHING;
    END IF;

    -- 3. Check/Create Ward Community
    IF v_ward IS NOT NULL THEN
        -- Try to insert and capture ID if new
        INSERT INTO public.communities (name, display_name, description, category, type, location_type, location_value)
        VALUES (
            'ward-' || lower(regexp_replace(v_ward, '\s+', '-', 'g')), 
            v_ward || ' Ward', 
            'Official community for residents of ' || v_ward || ' Ward', 
            'governance', 
            'location', 
            'ward', 
            v_ward
        )
        ON CONFLICT (location_type, location_value) WHERE type = 'location'
        DO UPDATE SET updated_at = NOW() -- Dummy update to lock row if needed, or just DO NOTHING
        RETURNING id INTO community_id;

        -- If community_id is NULL, it means it already existed. We need to fetch it.
        IF community_id IS NULL THEN
            SELECT id INTO community_id FROM public.communities 
            WHERE location_type = 'ward' AND location_value = v_ward AND type = 'location';
        ELSE
            -- If it was just created (community_id is NOT NULL), make this user the Admin
            INSERT INTO public.community_members (user_id, community_id, role)
            VALUES (NEW.id, community_id, 'admin')
            ON CONFLICT (user_id, community_id) DO UPDATE SET role = 'admin';
            
            -- Also add to community_moderators if that table is being used for permissions
            -- Assuming community_moderators exists based on previous context
            BEGIN
                INSERT INTO public.community_moderators (user_id, community_id, role)
                VALUES (NEW.id, community_id, 'admin');
            EXCEPTION WHEN undefined_table THEN
                -- Ignore if table doesn't exist
                NULL;
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Profile Updates
DROP TRIGGER IF EXISTS on_profile_location_change ON public.profiles;
CREATE TRIGGER on_profile_location_change
    AFTER INSERT OR UPDATE OF county, constituency, ward ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_location_community_creation();


-- 5. Function to Notify Community on New Project
CREATE OR REPLACE FUNCTION public.notify_community_on_project()
RETURNS TRIGGER AS $$
DECLARE
    v_community_id UUID;
    v_location_type TEXT;
    v_location_value TEXT;
BEGIN
    -- Determine location type and value
    IF NEW.ward IS NOT NULL THEN
        v_location_type := 'ward';
        v_location_value := NEW.ward;
    ELSIF NEW.constituency IS NOT NULL THEN
        v_location_type := 'constituency';
        v_location_value := NEW.constituency;
    ELSIF NEW.county IS NOT NULL THEN
        v_location_type := 'county';
        v_location_value := NEW.county;
    ELSE
        RETURN NEW; -- No location, no notification
    END IF;

    -- Find the community
    SELECT id INTO v_community_id 
    FROM public.communities 
    WHERE location_type = v_location_type 
    AND location_value = v_location_value 
    AND type = 'location';

    -- If community exists, create a post
    IF v_community_id IS NOT NULL THEN
        INSERT INTO public.posts (title, content, author_id, community_id, tags)
        VALUES (
            'New Project Reported: ' || NEW.title,
            'A new project has been reported in our ' || v_location_type || '. \n\n' || 
            '**Description:** ' || left(NEW.description, 200) || '...\n\n' ||
            '[View Project Details](/projects/' || NEW.id || ')',
            NEW.created_by, -- Assuming created_by exists and is a valid user
            v_community_id,
            ARRAY['project-alert', 'civic-watch']
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for New Projects
DROP TRIGGER IF EXISTS on_project_created ON public.government_projects;
CREATE TRIGGER on_project_created
    AFTER INSERT ON public.government_projects
    FOR EACH ROW
    WHEN (NEW.created_by IS NOT NULL) -- Only for user-generated projects
    EXECUTE FUNCTION public.notify_community_on_project();

-- 6. Update RLS for Government Projects (Allow User Creation)
ALTER TABLE public.government_projects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert
DROP POLICY IF EXISTS "Government projects can be inserted by authenticated users" ON public.government_projects;
CREATE POLICY "Government projects can be inserted by authenticated users"
ON public.government_projects FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own unverified projects
CREATE POLICY "Users can update their own unverified projects"
ON public.government_projects FOR UPDATE
USING (created_by = auth.uid() AND is_verified = FALSE);

-- 7. Function to Validate Location-Based Posting
CREATE OR REPLACE FUNCTION public.validate_project_location()
RETURNS TRIGGER AS $$
DECLARE
    v_user_county TEXT;
    v_user_constituency TEXT;
    v_user_ward TEXT;
    v_is_member BOOLEAN;
BEGIN
    -- Allow national-level projects for everyone
    IF NEW.ward IS NULL AND NEW.constituency IS NULL AND NEW.county IS NULL THEN
        RETURN NEW; -- National project, no restriction
    END IF;

    -- Get user's location from profile
    SELECT county, constituency, ward INTO v_user_county, v_user_constituency, v_user_ward
    FROM public.profiles
    WHERE id = NEW.created_by;

    -- Check if user's location matches project location
    IF (NEW.ward IS NOT NULL AND NEW.ward = v_user_ward) OR
       (NEW.constituency IS NOT NULL AND NEW.constituency = v_user_constituency AND NEW.ward IS NULL) OR
       (NEW.county IS NOT NULL AND NEW.county = v_user_county AND NEW.constituency IS NULL AND NEW.ward IS NULL) THEN
        RETURN NEW; -- Location matches, allow
    END IF;

    -- If location doesn't match, reject
    RAISE EXCEPTION 'You can only post projects for your registered location (%, %, %) or national-level projects. Project location: County=%, Constituency=%, Ward=%',
        v_user_county, v_user_constituency, v_user_ward, NEW.county, NEW.constituency, NEW.ward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Location Validation
DROP TRIGGER IF EXISTS validate_project_location_trigger ON public.government_projects;
CREATE TRIGGER validate_project_location_trigger
    BEFORE INSERT ON public.government_projects
    FOR EACH ROW
    WHEN (NEW.created_by IS NOT NULL)
    EXECUTE FUNCTION public.validate_project_location();

-- 8. Function to Track User Actions (Gamification Hook)
CREATE OR REPLACE FUNCTION public.track_user_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Track different actions
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for Action Tracking
DROP TRIGGER IF EXISTS track_project_submission ON public.government_projects;
CREATE TRIGGER track_project_submission
    AFTER INSERT ON public.government_projects
    FOR EACH ROW
    WHEN (NEW.created_by IS NOT NULL)
    EXECUTE FUNCTION public.track_user_action();

DROP TRIGGER IF EXISTS track_project_update ON public.project_updates;
CREATE TRIGGER track_project_update
    AFTER INSERT ON public.project_updates
    FOR EACH ROW
    WHEN (NEW.reporter_id IS NOT NULL)
    EXECUTE FUNCTION public.track_user_action();
