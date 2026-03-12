-- Create error_logs table for error tracking
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  context JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for querying
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON public.error_logs(component_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins and super_admins can view error logs
CREATE POLICY "Admins can view all error logs" ON public.error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Anyone can insert error logs (for error tracking)
CREATE POLICY "Anyone can create error logs" ON public.error_logs
  FOR INSERT WITH CHECK (true);

-- Only super admins can delete error logs
CREATE POLICY "Super admins can delete error logs" ON public.error_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );
