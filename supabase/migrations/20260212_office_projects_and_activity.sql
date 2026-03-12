-- Migration: Add office_holder_id to government_projects & create office_activity_log
-- Purpose: Enable project linking from OfficePage and activity feed tracking

-- ============================================
-- 1. Add office_holder_id FK to government_projects
-- ============================================
ALTER TABLE public.government_projects
  ADD COLUMN IF NOT EXISTS office_holder_id UUID
    REFERENCES public.office_holders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gov_projects_office_holder
  ON public.government_projects(office_holder_id);

-- ============================================
-- 2. Create office_activity_log table
-- ============================================
CREATE TABLE IF NOT EXISTS public.office_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_holder_id UUID NOT NULL
    REFERENCES public.office_holders(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
    -- Values: 'promise_added', 'promise_updated', 'question_answered',
    --         'project_linked', 'project_created', 'project_updated'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  reference_id UUID,        -- FK to the related entity (promise, question, project)
  reference_type TEXT,       -- 'promise', 'question', 'project'
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_office_activity_holder
  ON public.office_activity_log(office_holder_id);
CREATE INDEX IF NOT EXISTS idx_office_activity_created
  ON public.office_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_office_activity_type
  ON public.office_activity_log(activity_type);

-- ============================================
-- 3. RLS Policies for office_activity_log
-- ============================================
ALTER TABLE public.office_activity_log ENABLE ROW LEVEL SECURITY;

-- Anyone can view activity (public transparency)
CREATE POLICY "Anyone can view office activity"
  ON public.office_activity_log
  FOR SELECT
  USING (true);

-- Only the office holder can insert their own activity
CREATE POLICY "Office holders can insert own activity"
  ON public.office_activity_log
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND office_holder_id IN (
      SELECT oh.id FROM public.office_holders oh WHERE oh.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. Grant permissions
-- ============================================
GRANT SELECT ON public.office_activity_log TO anon, authenticated;
GRANT INSERT ON public.office_activity_log TO authenticated;
