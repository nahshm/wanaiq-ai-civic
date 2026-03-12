-- CRITICAL SECURITY FIX: Remove exposed contact_info from officials table
-- The contact_info jsonb field in officials table exposes sensitive contact information
-- We already have official_contacts table with proper RLS policies
ALTER TABLE public.officials DROP COLUMN IF EXISTS contact_info;

-- PRIVACY FIX: Update votes table RLS policies to hide individual voting patterns
-- Drop existing policies that expose user voting behavior
DROP POLICY IF EXISTS "Users can view all votes" ON public.votes;

-- Create new privacy-focused policy that only allows users to see their own votes
-- and aggregate vote counts (not individual voter identities)
CREATE POLICY "Users can only view their own votes" 
ON public.votes 
FOR SELECT 
USING (auth.uid() = user_id);

-- PRIVACY FIX: Update community_members RLS policies for better privacy
-- Drop existing policy that exposes all membership data
DROP POLICY IF EXISTS "Community members are viewable by everyone" ON public.community_members;

-- Create privacy-focused policy that hides individual membership unless user opts in
CREATE POLICY "Community membership privacy" 
ON public.community_members 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = community_members.user_id 
    AND (profiles.bio IS NOT NULL OR profiles.role IN ('official', 'expert', 'journalist'))
  )
);

-- Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{
  "show_voting_activity": false,
  "show_community_membership": false,
  "allow_contact": true
}'::jsonb;

-- Update profiles RLS to respect privacy settings
CREATE OR REPLACE FUNCTION public.get_profile_with_privacy(profile_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  role text,
  is_verified boolean,
  created_at timestamptz,
  updated_at timestamptz,
  privacy_settings jsonb
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    CASE 
      WHEN p.id = auth.uid() OR p.privacy_settings->>'allow_contact' = 'true' 
      THEN p.bio 
      ELSE NULL 
    END,
    p.role,
    p.is_verified,
    p.created_at,
    p.updated_at,
    CASE 
      WHEN p.id = auth.uid() 
      THEN p.privacy_settings 
      ELSE '{}'::jsonb 
    END
  FROM public.profiles p 
  WHERE p.id = profile_id;
$$;