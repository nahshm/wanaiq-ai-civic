-- Fix infinite recursion in profiles RLS policy
-- Step 1: Drop the problematic recursive policy
DROP POLICY IF EXISTS "Only platform admins can update admin status" ON public.profiles;

-- Step 2: Recreate with safe, non-recursive logic using security definer function
CREATE POLICY "Only platform admins can update admin status"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  -- Users can update their own profile
  (SELECT auth.uid()) = id 
  -- OR they are a super_admin (checked via security definer function)
  OR public.is_super_admin((SELECT auth.uid()))
)
WITH CHECK (
  (SELECT auth.uid()) = id 
  OR public.is_super_admin((SELECT auth.uid()))
);