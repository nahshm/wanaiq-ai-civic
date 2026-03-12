-- =====================================================
-- Government Institutions Table
-- =====================================================
-- Stores government ministries, departments, agencies
-- for project accountability tracking
-- =====================================================

-- 1. Create government_institutions table
CREATE TABLE IF NOT EXISTS government_institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Institution Identity
    name VARCHAR(200) NOT NULL,
    acronym VARCHAR(20),  -- e.g., "MoH" for Ministry of Health
    institution_type VARCHAR(50) NOT NULL,  -- 'ministry', 'state_corporation', 'county_dept', 'agency'
    
    -- Jurisdiction
    jurisdiction_type VARCHAR(50) NOT NULL,  -- 'national', 'county', 'multi-county'
    jurisdiction_name VARCHAR(200),  -- 'Kenya', 'Nairobi County', NULL for national
    country_code VARCHAR(3) NOT NULL DEFAULT 'KE' REFERENCES country_governance_templates(country_code),
    
    -- Hierarchy
    parent_institution_id UUID REFERENCES government_institutions(id) ON DELETE SET NULL,
    reporting_level INTEGER DEFAULT 1,  -- 1=top-level ministry, 2=department, 3=unit
    
    -- Contact & Info
    description TEXT,
    website VARCHAR(200),
    contact_email VARCHAR(200),
    contact_phone VARCHAR(50),
    physical_address TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    established_date DATE,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_jurisdiction CHECK (
        (jurisdiction_type = 'national' AND jurisdiction_name IS NULL) OR
        (jurisdiction_type IN ('county', 'multi-county') AND jurisdiction_name IS NOT NULL)
    )
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_govt_inst_country ON government_institutions(country_code);
CREATE INDEX IF NOT EXISTS idx_govt_inst_type ON government_institutions(institution_type);
CREATE INDEX IF NOT EXISTS idx_govt_inst_jurisdiction ON government_institutions(jurisdiction_type, jurisdiction_name);
CREATE INDEX IF NOT EXISTS idx_govt_inst_parent ON government_institutions(parent_institution_id);
CREATE INDEX IF NOT EXISTS idx_govt_inst_active ON government_institutions(is_active);

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_government_institution_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_govt_institution_timestamp ON government_institutions;
CREATE TRIGGER set_govt_institution_timestamp
    BEFORE UPDATE ON government_institutions
    FOR EACH ROW
    EXECUTE FUNCTION update_government_institution_timestamp();

-- 4. Seed Kenya National Ministries
INSERT INTO government_institutions (name, acronym, institution_type, jurisdiction_type, country_code, description) VALUES
('Ministry of Health', 'MoH', 'ministry', 'national', 'KE', 'Responsible for national health policy and services'),
('Ministry of Transport & Infrastructure', 'MoTI', 'ministry', 'national', 'KE', 'Roads, railways, aviation, and public transport'),
('Ministry of Education', 'MoE', 'ministry', 'national', 'KE', 'Basic and higher education policy'),
('Ministry of Water & Sanitation', 'MoWS', 'ministry', 'national', 'KE', 'Water supply and sewerage services'),
('Ministry of Energy', 'MoE', 'ministry', 'national', 'KE', 'Power generation and distribution'),
('Ministry of ICT & Digital Economy', 'MoICT', 'ministry', 'national', 'KE', 'Digital infrastructure and government IT systems'),
('Ministry of Environment & Climate Change', 'MoECC', 'ministry', 'national', 'KE', 'Environmental protection and conservation'),
('Ministry of Lands & Housing', 'MoLH', 'ministry', 'national', 'KE', 'Land administration and public housing'),
('Ministry of Interior & National Administration', 'MoI', 'ministry', 'national', 'KE', 'Internal security and public order');

-- 5. Seed Kenya State Corporations
INSERT INTO government_institutions (name, acronym, institution_type, jurisdiction_type, country_code, parent_institution_id, description)
SELECT 
    'Kenya Power & Lighting Company', 'KPLC', 'state_corporation', 'national', 'KE', id, 'National electricity distributor'
FROM government_institutions WHERE name = 'Ministry of Energy' LIMIT 1;

INSERT INTO government_institutions (name, acronym, institution_type, jurisdiction_type, country_code, parent_institution_id, description)
SELECT 
    'Kenya Urban Roads Authority', 'KURA', 'state_corporation', 'national', 'KE', id, 'Urban roads development and maintenance'
FROM government_institutions WHERE name = 'Ministry of Transport & Infrastructure' LIMIT 1;

INSERT INTO government_institutions (name, acronym, institution_type, jurisdiction_type, country_code, parent_institution_id, description)
SELECT 
    'Kenya National Highways Authority', 'KeNHA', 'state_corporation', 'national', 'KE', id, 'National highways and major roads'
FROM government_institutions WHERE name = 'Ministry of Transport & Infrastructure' LIMIT 1;

INSERT INTO government_institutions (name, acronym, institution_type, jurisdiction_type, country_code, parent_institution_id, description)
SELECT 
    'National Environment Management Authority', 'NEMA', 'agency', 'national', 'KE', id, 'Environmental regulations and compliance'
FROM government_institutions WHERE name = 'Ministry of Environment & Climate Change' LIMIT 1;

-- 6. Seed Sample County Institutions (Nairobi as example)
INSERT INTO government_institutions (name, institution_type, jurisdiction_type, jurisdiction_name, country_code, description) VALUES
('Nairobi City County Government', 'county_government', 'county', 'Nairobi', 'KE', 'Nairobi County executive and administration'),
('Nairobi City Water & Sewerage Company', 'county_corporation', 'county', 'Nairobi', 'KE', 'Water supply for Nairobi'),
('Mombasa County Government', 'county_government', 'county', 'Mombasa', 'KE', 'Mombasa County executive and administration');

-- 7. Update government_projects table
ALTER TABLE government_projects
ADD COLUMN IF NOT EXISTS responsible_type VARCHAR(20) DEFAULT 'official',  -- 'official' | 'institution'
ADD COLUMN IF NOT EXISTS responsible_institution_id UUID REFERENCES government_institutions(id),
ADD COLUMN IF NOT EXISTS project_level VARCHAR(20);  -- May already exist

-- 8. Add RLS policies
ALTER TABLE government_institutions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view institutions"
    ON government_institutions FOR SELECT
    USING (is_active = true);

-- Authenticated users can suggest
CREATE POLICY "Authenticated users can suggest institutions"
    ON government_institutions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only admins can update/delete
CREATE POLICY "Admins can update institutions"
    ON government_institutions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can delete institutions"
    ON government_institutions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

COMMENT ON TABLE government_institutions IS 'Government ministries, departments, and agencies responsible for projects';
COMMENT ON COLUMN government_institutions.jurisdiction_type IS 'Scope of authority: national, county, or multi-county';
COMMENT ON COLUMN government_institutions.reporting_level IS 'Hierarchy depth: 1=Ministry, 2=Department, 3=Unit';
