
-- Add INSERT policy for communities so users can create geographic communities during onboarding
CREATE POLICY "Authenticated users can create communities"
ON public.communities
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add UPDATE policy for communities
CREATE POLICY "Authenticated users can update communities"
ON public.communities
FOR UPDATE
TO authenticated
USING (true);
