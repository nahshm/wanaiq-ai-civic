-- Enable RLS on election_cycles table
ALTER TABLE election_cycles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public can view certified election results
CREATE POLICY "Public can view certified election results"
ON election_cycles
FOR SELECT
TO public
USING (results_certified = true);

-- Policy 2: Admins can view all election cycles
CREATE POLICY "Admins can view all election cycles"
ON election_cycles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Policy 3: Only admins can insert election cycles
CREATE POLICY "Only admins can insert election cycles"
ON election_cycles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Policy 4: Only admins can update election cycles
CREATE POLICY "Only admins can update election cycles"
ON election_cycles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Policy 5: Only admins can delete election cycles
CREATE POLICY "Only admins can delete election cycles"
ON election_cycles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);