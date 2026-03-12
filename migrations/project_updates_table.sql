-- Create project_updates table for timeline functionality
-- Run this after project_engagement_tables.sql

-- Drop table if exists (for clean reinstall)
DROP TABLE IF EXISTS project_updates CASCADE;

-- Create project_updates table
CREATE TABLE project_updates (
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

-- Create indexes
CREATE INDEX idx_project_updates_project ON project_updates(project_id);
CREATE INDEX idx_project_updates_user ON project_updates(created_by);
CREATE INDEX idx_project_updates_type ON project_updates(update_type);
CREATE INDEX idx_project_updates_date ON project_updates(created_at);

-- Enable RLS
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
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

-- Create trigger for updated_at
CREATE TRIGGER update_project_updates_updated_at
    BEFORE UPDATE ON project_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE project_updates IS 'Project progress updates, milestones, and issues for timeline';
