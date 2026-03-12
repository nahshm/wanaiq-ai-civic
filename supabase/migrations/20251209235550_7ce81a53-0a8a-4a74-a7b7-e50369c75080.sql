-- First migration: Just add the enum value
-- Note: super_admin was already added in previous attempt
-- Now create the function and tables in a separate transaction

-- Create is_super_admin function (without referencing super_admin directly in text)
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

-- RLS Policies for user_roles (using text comparison)
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Create anonymous_reports table
CREATE TABLE IF NOT EXISTS public.anonymous_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id text UNIQUE NOT NULL,
    category text NOT NULL,
    severity text NOT NULL DEFAULT 'medium',
    title text,
    encrypted_content text NOT NULL,
    location_text text,
    county_id uuid REFERENCES public.counties(id),
    constituency_id uuid REFERENCES public.constituencies(id),
    ward_id uuid REFERENCES public.wards(id),
    evidence_count integer DEFAULT 0,
    status text NOT NULL DEFAULT 'submitted',
    escalated_to text[],
    escalated_at timestamp with time zone,
    assigned_to uuid REFERENCES auth.users(id),
    risk_score numeric DEFAULT 0,
    is_identity_protected boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.anonymous_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage anonymous reports" ON public.anonymous_reports;
CREATE POLICY "Super admins can manage anonymous reports"
ON public.anonymous_reports
FOR ALL
USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Create crisis_reports table
CREATE TABLE IF NOT EXISTS public.crisis_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id text UNIQUE NOT NULL,
    anonymous_report_id uuid REFERENCES public.anonymous_reports(id),
    crisis_type text NOT NULL,
    severity text NOT NULL DEFAULT 'high',
    title text NOT NULL,
    description text,
    location_text text,
    latitude numeric,
    longitude numeric,
    evidence_urls text[],
    status text NOT NULL DEFAULT 'active',
    escalated_to_ngo uuid[],
    response_actions jsonb DEFAULT '[]'::jsonb,
    resolved_at timestamp with time zone,
    resolved_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.crisis_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage crisis reports" ON public.crisis_reports;
CREATE POLICY "Super admins can manage crisis reports"
ON public.crisis_reports
FOR ALL
USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Create ngo_partners table
CREATE TABLE IF NOT EXISTS public.ngo_partners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    description text,
    contact_email text,
    contact_phone text,
    hotline text,
    website text,
    logo_url text,
    sla_hours integer DEFAULT 24,
    is_active boolean DEFAULT true,
    reports_received integer DEFAULT 0,
    avg_response_hours numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ngo_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active NGO partners" ON public.ngo_partners;
CREATE POLICY "Anyone can view active NGO partners"
ON public.ngo_partners
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Super admins can manage NGO partners" ON public.ngo_partners;
CREATE POLICY "Super admins can manage NGO partners"
ON public.ngo_partners
FOR ALL
USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Create system_audit_log table
CREATE TABLE IF NOT EXISTS public.system_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.system_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.system_audit_log;
CREATE POLICY "Super admins can view audit logs"
ON public.system_audit_log
FOR SELECT
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.system_audit_log;
CREATE POLICY "System can insert audit logs"
ON public.system_audit_log
FOR INSERT
WITH CHECK (true);

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_role text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    severity text DEFAULT 'info',
    action_url text,
    is_read boolean DEFAULT false,
    read_by uuid[],
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view notifications"
ON public.admin_notifications
FOR SELECT
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Super admins can manage notifications" ON public.admin_notifications;
CREATE POLICY "Super admins can manage notifications"
ON public.admin_notifications
FOR ALL
USING (public.is_super_admin(auth.uid()));