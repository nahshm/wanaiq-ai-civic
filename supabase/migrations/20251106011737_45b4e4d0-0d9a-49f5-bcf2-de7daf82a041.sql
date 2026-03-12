-- Drop existing overly permissive SELECT policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow profiles join for comments" ON public.profiles;

-- Create privacy-respecting SELECT policy
-- Public profiles (is_private = false/NULL) are visible to everyone
-- Private profiles only visible to the owner
-- Authenticated users can see basic info for app functionality
CREATE POLICY "Profiles with privacy controls"
ON public.profiles
FOR SELECT
USING (
  -- Own profile always visible
  auth.uid() = id 
  OR 
  -- Public profiles visible to all
  (is_private IS NULL OR is_private = false)
);