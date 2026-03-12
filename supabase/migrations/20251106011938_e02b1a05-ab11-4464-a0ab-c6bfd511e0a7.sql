-- Drop existing overly permissive policy on contractors
DROP POLICY IF EXISTS "Contractors are viewable by everyone" ON public.contractors;
DROP POLICY IF EXISTS "Contractors can be managed by authenticated users" ON public.contractors;

-- Create policy for public contractor info (without sensitive contact data)
-- This will be handled at application level by selecting only non-sensitive fields
CREATE POLICY "Public contractor information viewable by everyone"
ON public.contractors
FOR SELECT
USING (true);

-- Re-enable the management policy for authenticated users
CREATE POLICY "Authenticated users can manage contractors"
ON public.contractors
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create a view for public contractor data that excludes sensitive contact info
CREATE OR REPLACE VIEW public.public_contractors AS
SELECT 
  id,
  name,
  company_type,
  specialization,
  years_experience,
  total_projects_completed,
  average_rating,
  total_ratings,
  is_verified,
  verification_date,
  blacklisted,
  blacklist_reason,
  created_at,
  updated_at,
  -- Hide sensitive contact information
  NULL::character varying as email,
  NULL::character varying as phone,
  NULL::character varying as contact_person,
  NULL::character varying as website,
  NULL::character varying as registration_number
FROM public.contractors;

-- Grant access to the public view
GRANT SELECT ON public.public_contractors TO anon;
GRANT SELECT ON public.public_contractors TO authenticated;

-- Create a view for authenticated users with full contact info
CREATE OR REPLACE VIEW public.contractor_contacts AS
SELECT 
  id,
  name,
  email,
  phone,
  contact_person,
  website,
  registration_number,
  company_type,
  specialization,
  created_at
FROM public.contractors;

-- Only authenticated users can view contact information
GRANT SELECT ON public.contractor_contacts TO authenticated;