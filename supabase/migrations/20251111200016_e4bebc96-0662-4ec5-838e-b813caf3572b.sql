-- Enable admin users to manage geographic data

-- Counties policies
CREATE POLICY "Admins can insert counties"
ON public.counties
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update counties"
ON public.counties
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete counties"
ON public.counties
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Constituencies policies
CREATE POLICY "Admins can insert constituencies"
ON public.constituencies
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update constituencies"
ON public.constituencies
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete constituencies"
ON public.constituencies
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Wards policies
CREATE POLICY "Admins can insert wards"
ON public.wards
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update wards"
ON public.wards
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete wards"
ON public.wards
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Civic interests policies
CREATE POLICY "Admins can manage civic interests"
ON public.civic_interests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));