-- Migration: Add Government Projects and Accountability Tables
-- Date: 2025-10-10

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Government Projects table
CREATE TABLE IF NOT EXISTS government_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'planned', -- planned, ongoing, completed, cancelled, delayed
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical

    -- Budget and financial tracking
    budget_allocated DECIMAL(15,2),
    budget_used DECIMAL(15,2),
    funding_source VARCHAR(255),
    funding_type VARCHAR(100), -- government, donor, private, mixed

    -- Location and GIS
    location TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    county VARCHAR(100),
    constituency VARCHAR(100),
    ward VARCHAR(100),

    -- Timeline
    planned_start_date DATE,
    actual_start_date DATE,
    planned_completion_date DATE,
    actual_completion_date DATE,

    -- Progress tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completion_notes TEXT,

    -- Relationships
    official_id UUID REFERENCES officials(id) ON DELETE SET NULL,
    lead_contractor_id UUID,

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_by UUID REFERENCES auth.users(id)
);

-- Contractors table
CREATE TABLE IF NOT EXISTS contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),

    -- Company details
    company_type VARCHAR(100), -- individual, company, partnership, ngo
    specialization TEXT[], -- array of specializations
    years_experience INTEGER,

    -- Performance metrics
    total_projects_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_ratings INTEGER DEFAULT 0,

    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date DATE,
    blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Contractors junction table (many-to-many)
CREATE TABLE IF NOT EXISTS project_contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES government_projects(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    role VARCHAR(100), -- main_contractor, subcontractor, consultant, supervisor
    contract_value DECIMAL(15,2),
    contract_start_date DATE,
    contract_end_date DATE,
    performance_rating DECIMAL(3,2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, contractor_id, role)
);

-- Project Updates table (citizen reporting)
CREATE TABLE IF NOT EXISTS project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES government_projects(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id),
    reporter_name VARCHAR(255), -- for anonymous reports
    reporter_contact VARCHAR(255), -- optional contact info

    update_type VARCHAR(50) NOT NULL, -- progress, issue, completion, quality_concern, delay
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Evidence
    photos TEXT[], -- array of photo URLs
    videos TEXT[], -- array of video URLs
    documents TEXT[], -- array of document URLs

    -- Location and verification
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location_description TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected, resolved
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,

    -- Community verification
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    community_verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promise Verifications table (community verification for promises)
CREATE TABLE IF NOT EXISTS promise_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promise_id UUID NOT NULL REFERENCES development_promises(id) ON DELETE CASCADE,
    verifier_id UUID REFERENCES auth.users(id),
    verifier_name VARCHAR(255), -- for anonymous verifications

    verification_type VARCHAR(50) NOT NULL, -- progress_update, completion_evidence, issue_report
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Evidence
    photos TEXT[],
    videos TEXT[],
    documents TEXT[],

    -- Verification details
    claimed_progress INTEGER CHECK (claimed_progress >= 0 AND claimed_progress <= 100),
    actual_progress INTEGER CHECK (actual_progress >= 0 AND actual_progress <= 100),
    issues_identified TEXT,

    -- Community voting
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    community_confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (community_confidence >= 0 AND community_confidence <= 1),

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, disputed, rejected
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor Ratings table
CREATE TABLE IF NOT EXISTS contractor_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    project_id UUID REFERENCES government_projects(id) ON DELETE SET NULL,
    rater_id UUID REFERENCES auth.users(id),
    rater_name VARCHAR(255), -- for anonymous ratings

    -- Rating criteria
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),

    review_text TEXT,
    recommend BOOLEAN,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update government_projects to reference contractors properly
ALTER TABLE government_projects
ADD CONSTRAINT fk_lead_contractor
FOREIGN KEY (lead_contractor_id) REFERENCES contractors(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_government_projects_status ON government_projects(status);
CREATE INDEX idx_government_projects_county ON government_projects(county);
CREATE INDEX idx_government_projects_official_id ON government_projects(official_id);
CREATE INDEX idx_government_projects_location ON government_projects USING GIST (point(longitude, latitude));
CREATE INDEX idx_contractors_name ON contractors(name);
CREATE INDEX idx_contractors_verified ON contractors(is_verified);
CREATE INDEX idx_project_contractors_project_id ON project_contractors(project_id);
CREATE INDEX idx_project_contractors_contractor_id ON project_contractors(contractor_id);
CREATE INDEX idx_project_updates_project_id ON project_updates(project_id);
CREATE INDEX idx_project_updates_status ON project_updates(status);
CREATE INDEX idx_promise_verifications_promise_id ON promise_verifications(promise_id);
CREATE INDEX idx_promise_verifications_status ON promise_verifications(status);
CREATE INDEX idx_contractor_ratings_contractor_id ON contractor_ratings(contractor_id);

-- Row Level Security (RLS) Policies
ALTER TABLE government_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE promise_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_ratings ENABLE ROW LEVEL SECURITY;

-- Government projects: viewable by everyone, editable by officials and admins
CREATE POLICY "Government projects are viewable by everyone"
ON government_projects FOR SELECT
USING (true);

CREATE POLICY "Government projects can be inserted by authenticated users"
ON government_projects FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Government projects can be updated by officials and admins"
ON government_projects FOR UPDATE
USING (
    created_by = auth.uid()
);

-- Contractors: viewable by everyone
CREATE POLICY "Contractors are viewable by everyone"
ON contractors FOR SELECT
USING (true);

CREATE POLICY "Contractors can be managed by authenticated users"
ON contractors FOR ALL
USING (auth.role() = 'authenticated');

CREATE POLICY "Project contractors are viewable by everyone"
ON project_contractors FOR SELECT
USING (true);

-- Project updates: viewable by everyone, insertable by authenticated users
CREATE POLICY "Project updates are viewable by everyone"
ON project_updates FOR SELECT
USING (true);

CREATE POLICY "Project updates can be created by authenticated users"
ON project_updates FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Promise verifications: viewable by everyone, insertable by authenticated users
CREATE POLICY "Promise verifications are viewable by everyone"
ON promise_verifications FOR SELECT
USING (true);

CREATE POLICY "Promise verifications can be created by authenticated users"
ON promise_verifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Contractor ratings: viewable by everyone, insertable by authenticated users
CREATE POLICY "Contractor ratings are viewable by everyone"
ON contractor_ratings FOR SELECT
USING (true);

CREATE POLICY "Contractor ratings can be created by authenticated users"
ON contractor_ratings FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_government_projects_updated_at
    BEFORE UPDATE ON government_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractors_updated_at
    BEFORE UPDATE ON contractors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_updates_updated_at
    BEFORE UPDATE ON project_updates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promise_verifications_updated_at
    BEFORE UPDATE ON promise_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractor_ratings_updated_at
    BEFORE UPDATE ON contractor_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample contractors
INSERT INTO contractors (name, registration_number, contact_person, phone, email, company_type, specialization, years_experience, is_verified) VALUES
('China Road & Bridge Corporation', 'CRBC-KE-001', 'John Wang', '+254700000001', 'info@crbc.co.ke', 'company', ARRAY['roads', 'bridges', 'infrastructure'], 20, true),
('Safaricom PLC', 'SAF-KE-002', 'Peter Ndegwa', '+254700000002', 'procurement@safaricom.co.ke', 'company', ARRAY['telecommunications', 'digital services'], 25, true),
('Kenya Power & Lighting Co.', 'KPLC-KE-003', 'Mary Wanjiku', '+254700000003', 'projects@kplc.co.ke', 'company', ARRAY['electrical', 'power distribution'], 30, true),
('Local Contractors Ltd', 'LCL-KE-004', 'David Kiprop', '+254700000004', 'info@localcontractors.co.ke', 'company', ARRAY['construction', 'renovation'], 15, true),
('Japan International Cooperation Agency', 'JICA-KE-005', 'Takeshi Nakamura', '+254700000005', 'kenya@jica.go.jp', 'ngo', ARRAY['irrigation', 'agriculture', 'development'], 50, true);

-- Insert sample government projects
INSERT INTO government_projects (
    title, description, category, status, priority, budget_allocated, funding_source,
    location, county, constituency, latitude, longitude,
    planned_start_date, planned_completion_date, progress_percentage, official_id
) VALUES
('Standard Gauge Railway Phase 2A', 'Extension of SGR from Nairobi to Naivasha', 'Transport', 'ongoing', 'high', 150000000000.00, 'Government of Kenya & China',
    'Nairobi-Naivasha corridor', 'Nairobi', 'Various', -1.2864, 36.8172,
    '2023-01-01', '2025-12-31', 65, (SELECT id FROM officials WHERE name = 'William Samoei Ruto' LIMIT 1)),

('Nairobi Expressway', 'Construction of elevated expressway through Nairobi CBD', 'Transport', 'ongoing', 'critical', 100000000000.00, 'Kenya Roads Board',
    'Nairobi Central Business District', 'Nairobi', 'Westlands', -1.2864, 36.8172,
    '2022-06-01', '2026-05-31', 40, (SELECT id FROM officials WHERE name = 'Johnson Sakaja' LIMIT 1)),

('Mombasa Port Development', 'Expansion and modernization of Port of Mombasa', 'Infrastructure', 'ongoing', 'high', 200000000000.00, 'Government of Kenya',
    'Port of Mombasa', 'Mombasa', 'Mvita', -4.0435, 39.6682,
    '2021-03-01', '2027-02-28', 55, (SELECT id FROM officials WHERE name = 'William Samoei Ruto' LIMIT 1)),

('Konza Technopolis Phase 1', 'Development of technology city in Konza', 'Technology', 'ongoing', 'high', 50000000000.00, 'Government of Kenya & World Bank',
    'Konza City', 'Machakos', 'Masinga', -1.7667, 37.1333,
    '2019-01-01', '2025-12-31', 70, (SELECT id FROM officials WHERE name = 'Musalia Mudavadi' LIMIT 1)),

('Thwake Dam Project', 'Construction of multipurpose dam for water and power', 'Energy', 'ongoing', 'critical', 80000000000.00, 'Government of Kenya',
    'Thwake River', 'Makueni', 'Makueni', -1.9833, 37.6167,
    '2020-07-01', '2026-06-30', 45, (SELECT id FROM officials WHERE name = 'Simon Chelugui' LIMIT 1));

-- Link projects to contractors
INSERT INTO project_contractors (project_id, contractor_id, role, contract_value, contract_start_date, contract_end_date) VALUES
((SELECT id FROM government_projects WHERE title = 'Standard Gauge Railway Phase 2A' LIMIT 1),
 (SELECT id FROM contractors WHERE name = 'China Road & Bridge Corporation' LIMIT 1),
 'main_contractor', 120000000000.00, '2023-01-01', '2025-12-31'),

((SELECT id FROM government_projects WHERE title = 'Nairobi Expressway' LIMIT 1),
 (SELECT id FROM contractors WHERE name = 'China Road & Bridge Corporation' LIMIT 1),
 'main_contractor', 80000000000.00, '2022-06-01', '2026-05-31'),

((SELECT id FROM government_projects WHERE title = 'Mombasa Port Development' LIMIT 1),
 (SELECT id FROM contractors WHERE name = 'Local Contractors Ltd' LIMIT 1),
 'main_contractor', 150000000000.00, '2021-03-01', '2027-02-28'),

((SELECT id FROM government_projects WHERE title = 'Konza Technopolis Phase 1' LIMIT 1),
 (SELECT id FROM contractors WHERE name = 'Safaricom PLC' LIMIT 1),
 'technology_partner', 20000000000.00, '2019-01-01', '2025-12-31'),

((SELECT id FROM government_projects WHERE title = 'Thwake Dam Project' LIMIT 1),
 (SELECT id FROM contractors WHERE name = 'Kenya Power & Lighting Co.' LIMIT 1),
 'main_contractor', 60000000000.00, '2020-07-01', '2026-06-30');
