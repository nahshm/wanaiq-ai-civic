-- Fix RLS infinite recursion on profiles table
-- Error: "infinite recursion detected in policy for relation profiles"
-- Root cause: Policies referencing profiles table within profiles RLS checks

-- =====================
-- PROFILES TABLE FIX
-- =====================

-- Drop all existing problematic policies on profiles
DROP POLICY IF EXISTS "Profiles with privacy controls" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own flair" ON public.profiles;

-- Simple, non-recursive SELECT policy
-- Allow users to view their own profile or any non-private profile
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT
USING (
  -- User can always see their own profile
  id = auth.uid()
  OR
  -- Or if no privacy settings exist (profile is public by default)
  NOT EXISTS (
    SELECT 1 FROM public.user_privacy_settings ups
    WHERE ups.user_id = profiles.id 
    AND ups.profile_visibility = 'private'
  )
);

-- Simple INSERT policy - users can only insert their own profile
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Simple UPDATE policy - users can only update their own profile
-- NO subquery to profiles table (avoids recursion)
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Simple DELETE policy (if needed) - users can delete their own profile
CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- =====================
-- FIX POLICIES THAT REFERENCE PROFILES
-- =====================

-- Find and fix any other policies that cause recursion by checking profiles.role
-- These should use user_roles table or app_role enum instead

-- Example fix for policies that check profiles.role:
-- Instead of: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
-- Use: has_role(auth.uid(), 'admin'::app_role)
-- Or use: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')

-- Note: Verify has_role() and is_super_admin() functions don't query profiles table
-- If they do, they need to be refactored to use user_roles table instead
