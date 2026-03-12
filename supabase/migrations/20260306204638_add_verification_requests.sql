-- Add is_deleted to profiles for soft deletion
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Create verification_requests table to handle Trusted Member requests
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add updated_at trigger for verification_requests
CREATE TRIGGER set_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS for verification_requests
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own verification requests" ON public.verification_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own verification requests" ON public.verification_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all verification requests" ON public.verification_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );
