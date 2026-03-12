-- Migration: Add Platform Admin Flag
-- Description: Adds is_platform_admin column to profiles for Governance Builder access control

-- Add platform admin flag
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- Create index for quick admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_platform_admin 
ON profiles(is_platform_admin) WHERE is_platform_admin = true;

-- RLS policy for updating admin status (only super admins can promote)
CREATE POLICY "Only platform admins can update admin status" 
ON profiles 
FOR UPDATE 
USING (
    -- Allow users to update their own non-admin fields
    auth.uid() = id 
    OR 
    -- Allow platform admins to update anyone
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
);

-- Notify PostgREST
NOTIFY pgrst, 'reload config';
