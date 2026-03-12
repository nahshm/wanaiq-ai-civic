-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Recreate is_super_admin as SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::app_role
  )
$$;

-- Create is_admin function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role, 'super_admin'::app_role)
  )
$$;

-- Recreate policies using SECURITY DEFINER functions (no subqueries!)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage non-super roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.is_admin(auth.uid()) 
  AND role != 'super_admin'::app_role
)
WITH CHECK (
  public.is_admin(auth.uid()) 
  AND role != 'super_admin'::app_role
);