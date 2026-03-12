-- Migration: Governance, Scalability, and Transitional Leadership
-- Description: Adds support for multi-country hierarchies, advanced community features (channels, events, polls), and temporary admin restrictions.

-- 1. SCALABILITY: Multi-Country Support
-- ==========================================================

-- Add country and region_type to communities
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'kenya',
ADD COLUMN IF NOT EXISTS region_type TEXT; -- e.g., 'county', 'state', 'province'

-- Update location_type check constraint to be flexible for global support
ALTER TABLE public.communities DROP CONSTRAINT IF EXISTS communities_location_type_check;
ALTER TABLE public.communities ADD CONSTRAINT communities_location_type_check 
CHECK (location_type IN (
    'county', 'constituency', 'ward',      -- Kenya
    'province', 'district', 'sector',       -- Rwanda
    'state', 'lga',                         -- Nigeria
    'region',                               -- Tanzania/General
    'national'                              -- Universal
));

-- Governance Hierarchies Configuration Table
CREATE TABLE IF NOT EXISTS public.governance_hierarchies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL UNIQUE,
  level_1_name TEXT,  -- e.g., 'County'
  level_2_name TEXT,  -- e.g., 'Constituency'
  level_3_name TEXT,  -- e.g., 'Ward'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial hierarchy data
INSERT INTO public.governance_hierarchies (country, level_1_name, level_2_name, level_3_name)
VALUES 
('kenya', 'County', 'Constituency', 'Ward'),
('rwanda', 'Province', 'District', 'Sector'),
('nigeria', 'State', 'LGA', 'Ward'),
('tanzania', 'Region', 'District', 'Ward')
ON CONFLICT (country) DO NOTHING;

-- Enable RLS for hierarchies
ALTER TABLE public.governance_hierarchies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hierarchies are viewable by everyone" ON public.governance_hierarchies FOR SELECT USING (true);


-- 2. TRANSITIONAL LEADERSHIP: Temporary Admins
-- ==========================================================

-- Update community_moderators for transitional leadership
ALTER TABLE public.community_moderators 
ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS term_expires_at TIMESTAMPTZ;

-- Fix the handle_location_community_creation function
-- Includes:
-- 1. Removing erroneous 'role' insert to community_members
-- 2. Adding logic to make the creator a Temporary Admin
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
        RETURNING id INTO community_id;

        -- If community_id is NULL, it means it already existed
        IF community_id IS NULL THEN
            SELECT id INTO community_id FROM public.communities 
            WHERE location_type = 'ward' AND location_value = v_ward AND type = 'location';
        ELSE
            -- BRAND NEW COMMUNITY -> Assign Temporary Admin
            -- 1. Join the community (clean join, no role)
            INSERT INTO public.community_members (user_id, community_id)
            VALUES (NEW.id, community_id)
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
                community_id, 
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


-- 3. ADVANCED GOVERNANCE: Channels, Events, Polls
-- ==========================================================

-- A. CHANNELS TABLE
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice', 'announcement')),
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for Channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Channels viewable by everyone" ON public.channels FOR SELECT USING (true);
CREATE POLICY "Admins can manage channels" ON public.channels FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.community_moderators cm
    WHERE cm.community_id = channels.community_id 
    AND cm.user_id = auth.uid()
    AND (cm.role = 'admin' OR (cm.permissions->>'can_manage_channels')::boolean = true)
  )
);

-- B. COMMUNITY EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location_type TEXT DEFAULT 'online' CHECK (location_type IN ('online', 'physical')),
  location_data JSONB, -- { "url": "...", "address": "..." }
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for Events
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by everyone" ON public.community_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.community_events FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.community_moderators cm
    WHERE cm.community_id = community_events.community_id 
    AND cm.user_id = auth.uid()
    AND (cm.role = 'admin' OR (cm.permissions->>'can_manage_events')::boolean = true)
  )
);

-- C. COMMUNITY POLLS & VOTES
CREATE TABLE IF NOT EXISTS public.community_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- ["Option A", "Option B"]
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- RLS for Polls
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls viewable by everyone" ON public.community_polls FOR SELECT USING (true);
CREATE POLICY "Admins can create polls" ON public.community_polls FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_moderators cm
    WHERE cm.community_id = community_id 
    AND cm.user_id = auth.uid()
    AND (cm.role = 'admin' OR (cm.permissions->>'can_manage_polls')::boolean = true)
  )
);

-- RLS for Poll Votes
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view votes" ON public.community_poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote once" ON public.community_poll_votes FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.community_polls p
    WHERE p.id = poll_id AND (p.expires_at IS NULL OR p.expires_at > now()) AND p.is_active = true
  )
);

-- Updated_at triggers
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
