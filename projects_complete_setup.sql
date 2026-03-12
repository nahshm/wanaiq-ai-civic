-- ============================================================
-- COMPLETE PROJECTS SYSTEM DATABASE SETUP
-- ============================================================
-- This migration adds all missing functionality for the projects system:
-- 1. Storage buckets for file uploads
-- 2. Project verifications table (community verification)
-- 3. Feature flags system
-- 4. RLS policies
-- ============================================================

-- ============================================================
-- 1. STORAGE BUCKETS SETUP
-- ============================================================

-- Create storage buckets for project media and documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('project-media', 'project-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']),
  ('project-documents', 'project-documents', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Anyone can view project media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'project-media');

CREATE POLICY "Authenticated users can upload project media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own project media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own project media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Same for documents
CREATE POLICY "Anyone can view project documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'project-documents');

CREATE POLICY "Authenticated users can upload project documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- 2. PROJECT VERIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS project_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES government_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX idx_project_verifications_project ON project_verifications(project_id);
CREATE INDEX idx_project_verifications_user ON project_verifications(user_id);

-- RLS Policies
ALTER TABLE project_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verifications"
  ON project_verifications FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can verify projects"
  ON project_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own verifications"
  ON project_verifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. FEATURE FLAGS SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Index
CREATE INDEX idx_feature_flags_key ON feature_flags(feature_key);
CREATE INDEX idx_feature_flags_category ON feature_flags(category);

-- RLS Policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feature flags"
  ON feature_flags FOR SELECT TO public
  USING (true);

CREATE POLICY "Only super admins can modify feature flags"
  ON feature_flags FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Seed initial feature flags
INSERT INTO feature_flags (feature_key, feature_name, description, category, is_enabled)
VALUES
  ('projects_map_view', 'Projects Map View', 'Display projects on interactive map', 'projects', true),
  ('projects_community_verification', 'Community Verification', 'Allow users to verify projects', 'projects', true),
  ('projects_file_uploads', 'Project File Uploads', 'Enable media and document uploads for projects', 'projects', true),
  ('projects_updates_submission', 'Project Updates', 'Allow citizens to submit project updates', 'projects', true),
  ('projects_analytics', 'Projects  Analytics Dashboard', 'Show analytics and statistics', 'projects', true),
  ('profile_studio', 'Profile Customization Studio', 'Profile customization features', 'profile', true),
  ('community_channels', 'Community Channels', 'Discord-style community channels', 'community', true),
  ('civic_clips', 'Civic Clips', 'Short-form video civic reports', 'content', true)
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================================
-- 4. ADD MISSING COLUMNS TO GOVERNMENT_PROJECTS
-- ============================================================

-- Add level field for hierarchical filtering (national, county, constituency, ward)
ALTER TABLE government_projects 
ADD COLUMN IF NOT EXISTS project_level TEXT DEFAULT 'county' CHECK (project_level IN ('national', 'county', 'constituency', 'ward'));

-- Add verification count (denormalized for performance)
ALTER TABLE government_projects 
ADD COLUMN IF NOT EXISTS verification_count INTEGER DEFAULT 0;

-- Function to update verification count
CREATE OR REPLACE FUNCTION update_project_verification_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE government_projects
    SET verification_count = verification_count + 1
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE government_projects
    SET verification_count = GREATEST(verification_count - 1, 0)
    WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain verification count
DROP TRIGGER IF EXISTS trigger_update_verification_count ON project_verifications;
CREATE TRIGGER trigger_update_verification_count
AFTER INSERT OR DELETE ON project_verifications
FOR EACH ROW EXECUTE FUNCTION update_project_verification_count();

-- ============================================================
-- 5. UPDATE OFFICIALS TABLE FOR HIERARCHICAL FILTERING
-- ============================================================

-- Ensure officials table has level field
ALTER TABLE officials 
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'county' CHECK (level IN ('national', 'county', 'constituency', 'ward'));

-- ============================================================
-- 6. PROJECT UPDATES TABLE IMPROVEMENTS
-- ============================================================

-- Ensure project_updates has all necessary fields
ALTER TABLE project_updates 
ADD COLUMN IF NOT EXISTS reporter_name TEXT,
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS community_verified BOOLEAN DEFAULT false;

-- ============================================================
-- 7. CONTRACTOR RATINGS
-- ============================================================

-- Add rating field to project_contractors if not exists
ALTER TABLE project_contractors
ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(2,1) CHECK (performance_rating >= 0 AND performance_rating <= 5);

-- ============================================================
-- COMPLETE - All database changes applied
-- ============================================================
