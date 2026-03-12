-- =====================================================
-- Security Fix: Enable RLS on position_communities table
-- =====================================================

-- Enable RLS on position_communities table
ALTER TABLE position_communities ENABLE ROW LEVEL SECURITY;

-- Public read access to position-community associations (public metadata)
CREATE POLICY "Public can view position communities"
  ON position_communities FOR SELECT
  USING (true);

-- Only admins can manage position-community associations
CREATE POLICY "Admins can manage position communities"
  ON position_communities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'super_admin'::app_role)
    )
  );

CREATE POLICY "Admins can update position communities"
  ON position_communities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'super_admin'::app_role)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'super_admin'::app_role)
    )
  );

CREATE POLICY "Admins can delete position communities"
  ON position_communities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'super_admin'::app_role)
    )
  );