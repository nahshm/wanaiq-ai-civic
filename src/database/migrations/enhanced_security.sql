-- Enhanced Sensitive Reports Table with Encryption
CREATE TABLE IF NOT EXISTS sensitive_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(20) UNIQUE NOT NULL, -- SR-XXXX format
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'corruption', 'human_rights', 'tribalism', 'mismanagement',
        'electoral', 'police_brutality', 'environmental', 'land_grabbing',
        'public_health', 'other'
    )),
    encrypted_content TEXT NOT NULL, -- pgp_sym_encrypt(content, encryption_key)
    severity_level VARCHAR(20) CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    risk_score DECIMAL(3,2) CHECK (risk_score BETWEEN 0.00 AND 10.00),
    reporter_hash VARCHAR(256), -- SHA-256 hash for anonymous tracking
    session_token VARCHAR(256), -- Temporary session identifier
    submission_method VARCHAR(20) CHECK (submission_method IN ('web', 'tor', 'sms', 'secure_drop')),
    ip_masked BOOLEAN DEFAULT true,
    metadata_stripped BOOLEAN DEFAULT true,
    encryption_level VARCHAR(20) DEFAULT 'standard',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'escalated', 'resolved', 'closed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    assigned_moderator_id UUID REFERENCES users(id),
    escalation_level INTEGER DEFAULT 0
);

-- Evidence Files Table
CREATE TABLE IF NOT EXISTS evidence_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES sensitive_reports(id) ON DELETE CASCADE,
    file_type VARCHAR(20) CHECK (file_type IN ('document', 'image', 'video', 'audio')),
    original_filename TEXT,
    encrypted_filename TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    encryption_hash VARCHAR(256),
    blockchain_timestamp TEXT, -- IPFS hash for tamper-proofing
    metadata_analysis JSONB,
    verification_status VARCHAR(20) DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- NGO Partners Table
CREATE TABLE IF NOT EXISTS ngo_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tier INTEGER CHECK (tier IN (1, 2, 3)), -- 1=Human Rights, 2=Anti-Corruption, 3=Legal
    contact_email TEXT,
    api_endpoint TEXT,
    api_key_hash VARCHAR(256),
    is_active BOOLEAN DEFAULT true,
    partnership_start_date DATE,
    contact_person VARCHAR(255),
    escalation_threshold DECIMAL(3,2), -- Risk score threshold for auto-escalation
    created_at TIMESTAMP DEFAULT NOW()
);

-- Escalation Workflow Table
CREATE TABLE IF NOT EXISTS escalation_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES sensitive_reports(id) ON DELETE CASCADE,
    current_step VARCHAR(50) NOT NULL,
    ai_risk_assessment DECIMAL(3,2),
    community_triage_completed BOOLEAN DEFAULT false,
    expert_verification_completed BOOLEAN DEFAULT false,
    ngo_notified BOOLEAN DEFAULT false,
    ngo_response_received BOOLEAN DEFAULT false,
    legal_protection_activated BOOLEAN DEFAULT false,
    step_history JSONB, -- Track all step transitions
    estimated_completion_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    target_resource VARCHAR(100),
    target_user_id UUID REFERENCES users(id),
    before_state JSONB,
    after_state JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(256),
    justification TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Decryption Audit Log
CREATE TABLE IF NOT EXISTS decryption_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES sensitive_reports(id),
    admin_user_id UUID REFERENCES users(id),
    decryption_reason VARCHAR(100),
    accessed_fields TEXT[],
    ip_address INET,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sensitive_reports_status ON sensitive_reports(status);
CREATE INDEX IF NOT EXISTS idx_sensitive_reports_category ON sensitive_reports(category);
CREATE INDEX IF NOT EXISTS idx_sensitive_reports_risk_score ON sensitive_reports(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_sensitive_reports_created_at ON sensitive_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_files_report_id ON evidence_files(report_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_timestamp ON admin_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);

-- Insert default NGO partners
INSERT INTO ngo_partners (name, tier, contact_email, escalation_threshold, contact_person) VALUES
('Kenya National Commission on Human Rights', 1, 'escalation@knchr.org', 8.0, 'Commission Secretary'),
('Transparency International Kenya', 2, 'reports@tikenya.org', 7.5, 'Executive Director'),
('Law Society of Kenya', 3, 'legal@lsk.or.ke', 8.5, 'Chief Executive Officer')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS sensitive_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id text UNIQUE NOT NULL,
    category text NOT NULL CHECK (category IN (
        'corruption','human_rights','tribalism','mismanagement',
        'electoral','police_brutality','environmental','land_grabbing',
        'public_health','other'
    )),
    encrypted_content text NOT NULL,
    severity_level text CHECK (severity_level IN ('low','medium','high','critical')),
    risk_score numeric(3,2) CHECK (risk_score BETWEEN 0.00 AND 10.00),
    reporter_hash text,
    session_token text,
    submission_method text CHECK (submission_method IN ('web','tor','sms','secure_drop')),
    ip_masked boolean DEFAULT true,
    metadata_stripped boolean DEFAULT true,
    encryption_level text DEFAULT 'standard',
    status text DEFAULT 'pending' CHECK (status IN ('pending','reviewing','escalated','resolved','closed')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    closed_at timestamp with time zone,
    assigned_moderator_id uuid REFERENCES auth.users(id),
    escalation_level integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sensitive_reports_status ON sensitive_reports(status);
CREATE INDEX IF NOT EXISTS idx_sensitive_reports_category ON sensitive_reports(category);
CREATE INDEX IF NOT EXISTS idx_sensitive_reports_risk_score ON sensitive_reports(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_sensitive_reports_created_at ON sensitive_reports(created_at DESC);

CREATE TABLE IF NOT EXISTS evidence_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid REFERENCES sensitive_reports(id) ON DELETE CASCADE,
    file_type text CHECK (file_type IN ('document','image','video','audio')),
    original_filename text,
    encrypted_filename text NOT NULL,
    file_size_bytes bigint,
    mime_type text,
    encryption_hash text,
    blockchain_timestamp text,
    metadata_analysis jsonb,
    verification_status text DEFAULT 'pending',
    uploaded_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_files_report_id ON evidence_files(report_id);

CREATE TABLE IF NOT EXISTS ngo_partners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    tier integer CHECK (tier IN (1,2,3)),
    contact_email text,
    api_endpoint text,
    api_key_hash text,
    is_active boolean DEFAULT true,
    partnership_start_date date,
    contact_person text,
    escalation_threshold numeric(3,2),
    created_at timestamp with time zone DEFAULT now()
);

INSERT INTO ngo_partners (name, tier, contact_email, escalation_threshold, contact_person) VALUES
('Kenya National Commission on Human Rights', 1, 'escalation@knchr.org', 8.0, 'Commission Secretary'),
('Transparency International Kenya', 2, 'reports@tikenya.org', 7.5, 'Executive Director'),
('Law Society of Kenya', 3, 'legal@lsk.or.ke', 8.5, 'Chief Executive Officer')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS escalation_workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid REFERENCES sensitive_reports(id) ON DELETE CASCADE,
    current_step text NOT NULL,
    ai_risk_assessment numeric(3,2),
    community_triage_completed boolean DEFAULT false,
    expert_verification_completed boolean DEFAULT false,
    ngo_notified boolean DEFAULT false,
    ngo_response_received boolean DEFAULT false,
    legal_protection_activated boolean DEFAULT false,
    step_history jsonb,
    estimated_completion_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    target_resource text,
    target_user_id uuid REFERENCES auth.users(id),
    before_state jsonb,
    after_state jsonb,
    ip_address inet,
    user_agent text,
    session_id text,
    justification text,
    timestamp timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_timestamp ON admin_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);

CREATE TABLE IF NOT EXISTS decryption_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid REFERENCES sensitive_reports(id),
    admin_user_id uuid REFERENCES auth.users(id),
    decryption_reason text,
    accessed_fields text[],
    ip_address inet,
    timestamp timestamp with time zone DEFAULT now()
);