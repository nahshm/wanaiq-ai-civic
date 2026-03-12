-- =====================================================
-- Project Collaborators Enhancement
-- =====================================================
-- Adds support for multiple responsible parties on projects
-- Primary responsible entity + optional collaborators
-- =====================================================

-- 1. Add new columns to government_projects (if they don't exist)
ALTER TABLE government_projects
ADD COLUMN IF NOT EXISTS primary_responsible_type VARCHAR(20) DEFAULT 'official';

ALTER TABLE government_projects
ADD COLUMN IF NOT EXISTS primary_official_id UUID REFERENCES government_positions(id);

ALTER TABLE government_projects
ADD COLUMN IF NOT EXISTS primary_institution_id UUID REFERENCES government_institutions(id);

-- Copy data from old columns if they exist (safe migration)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='government_projects' AND column_name='responsible_type') THEN
        UPDATE government_projects SET primary_responsible_type = responsible_type WHERE responsible_type IS NOT NULL;
        ALTER TABLE government_projects DROP COLUMN responsible_type;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='government_projects' AND column_name='responsible_official_id') THEN
        UPDATE government_projects SET primary_official_id = responsible_official_id WHERE responsible_official_id IS NOT NULL;
        ALTER TABLE government_projects DROP COLUMN responsible_official_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='government_projects' AND column_name='responsible_institution_id') THEN
        UPDATE government_projects SET primary_institution_id = responsible_institution_id WHERE responsible_institution_id IS NOT NULL;
        ALTER TABLE government_projects DROP COLUMN responsible_institution_id;
    END IF;
END $$;

-- 2. Create junction table for collaborating officials
CREATE TABLE IF NOT EXISTS project_collaborating_officials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES government_projects(id) ON DELETE CASCADE,
    official_id UUID NOT NULL REFERENCES government_positions(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'collaborator',  -- 'lead', 'support', 'oversight', 'collaborator'
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Prevent duplicate collaborator entries
    UNIQUE(project_id, official_id)
);

-- 3. Create junction table for collaborating institutions
CREATE TABLE IF NOT EXISTS project_collaborating_institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES government_projects(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES government_institutions(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'collaborator',  -- 'lead', 'support', 'oversight', 'collaborator'
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Prevent duplicate collaborator entries
    UNIQUE(project_id, institution_id)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_proj_collab_officials_project ON project_collaborating_officials(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_collab_officials_official ON project_collaborating_officials(official_id);
CREATE INDEX IF NOT EXISTS idx_proj_collab_institutions_project ON project_collaborating_institutions(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_collab_institutions_institution ON project_collaborating_institutions(institution_id);

-- 5. Enable RLS
ALTER TABLE project_collaborating_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborating_institutions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies - Public read access
CREATE POLICY "Public can view project collaborating officials"
    ON project_collaborating_officials FOR SELECT
    USING (true);

CREATE POLICY "Public can view project collaborating institutions"
    ON project_collaborating_institutions FOR SELECT
    USING (true);

-- 7. RLS Policies - Authenticated users can add collaborators to their projects
CREATE POLICY "Users can add collaborators to their projects (officials)"
    ON project_collaborating_officials FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM government_projects
            WHERE id = project_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can add collaborators to their projects (institutions)"
    ON project_collaborating_institutions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM government_projects
            WHERE id = project_id
            AND created_by = auth.uid()
        )
    );

-- 8. RLS Policies - Users can remove collaborators from their projects
CREATE POLICY "Users can remove collaborators from their projects (officials)"
    ON project_collaborating_officials FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM government_projects
            WHERE id = project_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can remove collaborators from their projects (institutions)"
    ON project_collaborating_institutions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM government_projects
            WHERE id = project_id
            AND created_by = auth.uid()
        )
    );

-- 9. Comments for documentation
COMMENT ON TABLE project_collaborating_officials IS 'Junction table for projects with multiple responsible officials';
COMMENT ON TABLE project_collaborating_institutions IS 'Junction table for projects with multiple collaborating institutions';
COMMENT ON COLUMN project_collaborating_officials.role IS 'Role of official in project: lead, support, oversight, collaborator';
COMMENT ON COLUMN project_collaborating_institutions.role IS 'Role of institution in project: lead, support, oversight, collaborator';
