-- Week 1-4 MVP Onboarding: Geographic Hierarchy and User Interests System

-- Create geographic hierarchy tables
CREATE TABLE IF NOT EXISTS public.counties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  country text DEFAULT 'Kenya',
  population integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.constituencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  county_id uuid REFERENCES public.counties(id) ON DELETE CASCADE,
  mp_id uuid REFERENCES public.officials(id),
  population integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  constituency_id uuid REFERENCES public.constituencies(id) ON DELETE CASCADE,
  mca_id uuid REFERENCES public.officials(id),
  population integer,
  created_at timestamptz DEFAULT now()
);

-- Create civic interests system
CREATE TABLE IF NOT EXISTS public.civic_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  icon text,
  category text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_id uuid REFERENCES public.civic_interests(id) ON DELETE CASCADE,
  selected_at timestamptz DEFAULT now(),
  UNIQUE(user_id, interest_id)
);

-- Create user persona enum
DO $$ BEGIN
  CREATE TYPE public.user_persona AS ENUM (
    'active_citizen',
    'community_organizer',
    'civic_learner',
    'government_watcher',
    'professional'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create onboarding progress tracking
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  step_completed integer DEFAULT 0,
  location_set boolean DEFAULT false,
  interests_set boolean DEFAULT false,
  persona_set boolean DEFAULT false,
  communities_joined integer DEFAULT 0,
  first_post boolean DEFAULT false,
  first_comment boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS county_id uuid REFERENCES public.counties(id),
  ADD COLUMN IF NOT EXISTS constituency_id uuid REFERENCES public.constituencies(id),
  ADD COLUMN IF NOT EXISTS ward_id uuid REFERENCES public.wards(id),
  ADD COLUMN IF NOT EXISTS persona public.user_persona,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for geographic tables (public read access)
CREATE POLICY "Counties are viewable by everyone" ON public.counties
  FOR SELECT USING (true);

CREATE POLICY "Constituencies are viewable by everyone" ON public.constituencies
  FOR SELECT USING (true);

CREATE POLICY "Wards are viewable by everyone" ON public.wards
  FOR SELECT USING (true);

-- RLS Policies for civic interests (public read access)
CREATE POLICY "Civic interests are viewable by everyone" ON public.civic_interests
  FOR SELECT USING (true);

-- RLS Policies for user interests (users manage their own)
CREATE POLICY "Users can view their own interests" ON public.user_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own interests" ON public.user_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests" ON public.user_interests
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for onboarding progress
CREATE POLICY "Users can view their own onboarding progress" ON public.onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress" ON public.onboarding_progress
  FOR ALL USING (auth.uid() = user_id);

-- Insert default civic interests
INSERT INTO public.civic_interests (name, display_name, icon, category, sort_order) VALUES
  ('education', 'Education & Schools', '🎓', 'social', 1),
  ('healthcare', 'Healthcare & Hospitals', '🏥', 'social', 2),
  ('infrastructure', 'Roads & Infrastructure', '🛣️', 'infrastructure', 3),
  ('security', 'Security & Safety', '🛡️', 'governance', 4),
  ('jobs', 'Jobs & Business', '💼', 'economic', 5),
  ('environment', 'Water & Environment', '💧', 'environment', 6),
  ('youth', 'Youth Affairs', '👥', 'social', 7),
  ('women', 'Women''s Rights', '👩', 'social', 8),
  ('budget', 'Budget & Transparency', '💰', 'governance', 9),
  ('housing', 'Housing & Planning', '🏘️', 'infrastructure', 10)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_constituencies_county ON public.constituencies(county_id);
CREATE INDEX IF NOT EXISTS idx_wards_constituency ON public.wards(constituency_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_county ON public.profiles(county_id);
CREATE INDEX IF NOT EXISTS idx_profiles_constituency ON public.profiles(constituency_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ward ON public.profiles(ward_id);

-- Create trigger for onboarding_progress updated_at
CREATE OR REPLACE FUNCTION public.update_onboarding_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_onboarding_progress_updated_at();