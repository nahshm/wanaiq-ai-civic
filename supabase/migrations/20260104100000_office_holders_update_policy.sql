-- Migration: Add UPDATE policy for office_holders
-- This allows admins to approve/reject position claims

-- Add UPDATE policy for admins to approve/reject claims
CREATE POLICY "Admins can update office_holders" ON office_holders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Also allow users to update their own claims (for resubmission)
CREATE POLICY "Users can update own claims" ON office_holders
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
