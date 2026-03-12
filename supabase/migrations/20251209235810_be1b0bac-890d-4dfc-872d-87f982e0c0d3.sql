-- Fix RLS issues by checking which tables need RLS enabled
-- Enable RLS on user_roles if not enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Check and fix functions with missing search_path
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = 'super_admin'
  );
END;
$$;