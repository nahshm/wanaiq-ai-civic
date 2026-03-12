-- Migration: Replace auth.users references with public.profiles references for PostgREST joins
-- This allows directly querying "profiles(...)" in Supabase JS

BEGIN;

-- 1. office_questions
ALTER TABLE public.office_questions DROP CONSTRAINT IF EXISTS office_questions_asked_by_fkey;
ALTER TABLE public.office_questions ADD CONSTRAINT office_questions_asked_by_fkey 
    FOREIGN KEY (asked_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.office_questions DROP CONSTRAINT IF EXISTS office_questions_answered_by_fkey;
ALTER TABLE public.office_questions ADD CONSTRAINT office_questions_answered_by_fkey 
    FOREIGN KEY (answered_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. institution_updates
ALTER TABLE public.institution_updates DROP CONSTRAINT IF EXISTS institution_updates_author_id_fkey;
ALTER TABLE public.institution_updates ADD CONSTRAINT institution_updates_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. institution_handlers
ALTER TABLE public.institution_handlers DROP CONSTRAINT IF EXISTS institution_handlers_user_id_fkey;
ALTER TABLE public.institution_handlers ADD CONSTRAINT institution_handlers_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Reload schema cache to ensure PostgREST picks up the new foreign keys immediately
NOTIFY pgrst, 'reload schema';

COMMIT;
