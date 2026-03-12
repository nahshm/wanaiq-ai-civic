
-- FIX 1: Remove overly permissive SELECT policies on profiles that bypass privacy settings
-- The "profiles_select_policy" already handles proper privacy-aware access
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view user flairs" ON public.profiles;

-- FIX 2: Add explicit RLS policy on ai_configurations for super admins only
-- Currently RLS is enabled with no policies (default deny), but let's be explicit
CREATE POLICY "Only super admins can access AI configurations"
ON public.ai_configurations
FOR ALL
TO authenticated
USING (public.is_super_admin((SELECT auth.uid())));
