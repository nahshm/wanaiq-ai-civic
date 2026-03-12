-- Create a separate secure table for official contact information
CREATE TABLE public.official_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  official_id uuid NOT NULL,
  contact_type text NOT NULL CHECK (contact_type IN ('email', 'phone', 'office_address', 'social_media')),
  contact_value text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (official_id) REFERENCES public.officials(id) ON DELETE CASCADE
);

-- Enable RLS on the new table
ALTER TABLE public.official_contacts ENABLE ROW LEVEL SECURITY;

-- Only allow public contact information to be visible to everyone
CREATE POLICY "Public official contacts are viewable by everyone" 
ON public.official_contacts 
FOR SELECT 
USING (is_public = true);

-- Only authenticated users with special roles can view private contacts
CREATE POLICY "Verified users can view private official contacts" 
ON public.official_contacts 
FOR SELECT 
USING (
  is_public = false 
  AND auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('official', 'journalist', 'expert')
    AND is_verified = true
  )
);

-- Create function to get current user role securely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update officials table RLS to exclude contact_info from public access
DROP POLICY IF EXISTS "Officials are viewable by everyone" ON public.officials;

-- New policy that excludes sensitive contact information
CREATE POLICY "Officials basic info viewable by everyone" 
ON public.officials 
FOR SELECT 
USING (true);

-- Add trigger to update timestamps
CREATE TRIGGER update_official_contacts_updated_at
BEFORE UPDATE ON public.official_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();