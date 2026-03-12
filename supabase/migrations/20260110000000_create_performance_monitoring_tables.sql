-- Performance Monitoring System Tables
-- Created: 2026-01-10
-- Purpose: Track Web Vitals, API performance, and errors for SuperAdmin monitoring

-- Web Vitals metrics (LCP, INP, CLS, FCP, TTFB)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL, -- 'LCP', 'INP', 'CLS', 'FCP', 'TTFB'
  value numeric NOT NULL,
  rating text, -- 'good', 'needs-improvement', 'poor'
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- API response time metrics
CREATE TABLE IF NOT EXISTS api_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL, -- Query/mutation description
  duration_ms numeric NOT NULL,
  status text NOT NULL, -- 'success', 'error'
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Error logs
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message text NOT NULL,
  error_stack text,
  component_name text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url text,
  user_agent text,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_perf_metrics_created ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_api_metrics_created ON api_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_operation ON api_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);

-- RLS Policies (SuperAdmin only access)
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- SuperAdmins can view all metrics
CREATE POLICY "SuperAdmins can view performance metrics" ON performance_metrics
  FOR SELECT USING (is_super_admin((SELECT auth.uid())));

CREATE POLICY "SuperAdmins can view API metrics" ON api_metrics
  FOR SELECT USING (is_super_admin((SELECT auth.uid())));

CREATE POLICY "SuperAdmins can view error logs" ON error_logs
  FOR SELECT USING (is_super_admin((SELECT auth.uid())));

-- Anyone can INSERT metrics (for tracking)
CREATE POLICY "Anyone can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert API metrics" ON api_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Comments for clarity
COMMENT ON TABLE performance_metrics IS 'Stores Web Vitals metrics (LCP, INP, CLS, etc.)';
COMMENT ON TABLE api_metrics IS 'Stores API call performance data';
COMMENT ON TABLE error_logs IS 'Stores application errors for monitoring';
