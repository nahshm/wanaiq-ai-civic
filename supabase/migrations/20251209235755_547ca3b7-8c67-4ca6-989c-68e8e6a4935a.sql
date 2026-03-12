-- Now seed the SuperAdmin after enum is committed
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT '66033a0b-3540-4ccd-988e-4ddae3057f8c'::uuid, 'super_admin'::app_role, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '66033a0b-3540-4ccd-988e-4ddae3057f8c' 
    AND role::text = 'super_admin'
);