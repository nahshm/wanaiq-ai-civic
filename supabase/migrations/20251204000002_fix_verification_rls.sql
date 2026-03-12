-- Fix RLS policies for verifications - Add missing INSERT policy
-- The SELECT policies exist, but we need to allow authenticated users to INSERT verifications

-- Add INSERT policy for verifications table
DROP POLICY IF EXISTS "Authenticated users can create verifications" ON public.verifications;
CREATE POLICY "Authenticated users can create verifications"
  ON public.verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add UPDATE policy for verifications (for triggers)
DROP POLICY IF EXISTS "Verifications can be updated by system" ON public.verifications;
CREATE POLICY "Verifications can be updated by system"
  ON public.verifications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
