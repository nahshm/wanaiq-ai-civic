
-- 1. Add missing title column
ALTER TABLE public.vectors ADD COLUMN IF NOT EXISTS title text;

-- 2. Admin-only INSERT policy
CREATE POLICY "Admins can insert vectors" ON public.vectors
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);

-- 3. Admin-only UPDATE policy
CREATE POLICY "Admins can update vectors" ON public.vectors
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);

-- 4. Admin-only DELETE policy
CREATE POLICY "Admins can delete vectors" ON public.vectors
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
