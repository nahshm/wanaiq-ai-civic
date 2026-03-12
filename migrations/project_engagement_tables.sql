-- Migration to add project views tracking table
-- Run this after government_institutions.sql and project_collaborators.sql

CREATE TABLE IF NOT EXISTS project_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES government_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Create project_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES government_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    parent_comment_id UUID REFERENCES project_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create project_updates table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES government_projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    update_type VARCHAR(50) NOT NULL DEFAULT 'progress',
    media_urls TEXT[],
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    community_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT valid_update_type CHECK (update_type IN ('progress', 'milestone', 'issue', 'delay', 'completion'))
);

-- Create project_verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES government_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_verified BOOLEAN DEFAULT true,
    verification_note TEXT,
    media_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- One verification per user per project
    UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_views_project ON project_views(project_id);
CREATE INDEX IF NOT EXISTS idx_project_views_user ON project_views(user_id);
CREATE INDEX IF NOT EXISTS idx_project_views_date ON project_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_project_comments_project ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_user ON project_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_parent ON project_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_project_updates_project ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_user ON project_updates(created_by);
CREATE INDEX IF NOT EXISTS idx_project_updates_type ON project_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_project_updates_date ON project_updates(created_at);

CREATE INDEX IF NOT EXISTS idx_project_verifications_project ON project_verifications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_verifications_user ON project_verifications(user_id);

-- Enable RLS
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view project views" ON project_views;
DROP POLICY IF EXISTS "Authenticated users can add views" ON project_views;
DROP POLICY IF EXISTS "Anyone can view comments" ON project_comments;
DROP POLICY IF EXISTS "Authenticated users can add comments" ON project_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON project_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON project_comments;
DROP POLICY IF EXISTS "Anyone can view updates" ON project_updates;
DROP POLICY IF EXISTS "Authenticated users can add updates" ON project_updates;
DROP POLICY IF EXISTS "Users can update their own updates" ON project_updates;
DROP POLICY IF EXISTS "Users can delete their own updates" ON project_updates;
DROP POLICY IF EXISTS "Anyone can view verifications" ON project_verifications;
DROP POLICY IF EXISTS "Authenticated users can add verifications" ON project_verifications;
DROP POLICY IF EXISTS "Users can update their own verifications" ON project_verifications;

-- RLS Policies for project_views
CREATE POLICY "Anyone can view project views"
    ON project_views FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can add views"
    ON project_views FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for project_comments
CREATE POLICY "Anyone can view comments"
    ON project_comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can add comments"
    ON project_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON project_comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON project_comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for project_updates
CREATE POLICY "Anyone can view updates"
    ON project_updates FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can add updates"
    ON project_updates FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own updates"
    ON project_updates FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own updates"
    ON project_updates FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- RLS Policies for project_verifications
CREATE POLICY "Anyone can view verifications"
    ON project_verifications FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can add verifications"
    ON project_verifications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verifications"
    ON project_verifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create or replace function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_project_views_updated_at ON project_views;
CREATE TRIGGER update_project_views_updated_at
    BEFORE UPDATE ON project_views
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_comments_updated_at ON project_comments;
CREATE TRIGGER update_project_comments_updated_at
    BEFORE UPDATE ON project_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_updates_updated_at ON project_updates;
CREATE TRIGGER update_project_updates_updated_at
    BEFORE UPDATE ON project_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_verifications_updated_at ON project_verifications;
CREATE TRIGGER update_project_verifications_updated_at
    BEFORE UPDATE ON project_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE project_views IS 'Tracks individual user views of government projects for analytics';
COMMENT ON TABLE project_comments IS 'User comments and discussions on government projects';
COMMENT ON TABLE project_updates IS 'Project progress updates, milestones, and issues';
COMMENT ON TABLE project_verifications IS 'Community verifications of project status and progress';
