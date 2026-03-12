-- Migration: Global Position-Based Civic Identity System
-- Description: Implements tables for separating Office (Position) from Incumbent (Holder)
-- Also fixes missing 'Monitoring' channels from previous migration

-- ==========================================
-- 1. GLOBAL IDENTITY TABLES
-- ==========================================

-- 1.1 Governance Templates (Hierarchies)
CREATE TABLE IF NOT EXISTS country_governance_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) UNIQUE NOT NULL, -- ISO code (KE, US, IN)
  country_name VARCHAR(100) NOT NULL,
  governance_system JSONB NOT NULL, -- {"levels": ["nation", "county"], "nation": {...}}
  flag_emoji VARCHAR(10),
  
  -- Credibility & UGC Controls
  is_verified BOOLEAN DEFAULT false, -- Requires Admin Approval
  submitted_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Government Positions (The Permanent Office)
CREATE TABLE IF NOT EXISTS government_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_code VARCHAR(100) UNIQUE NOT NULL, -- e.g., "KE:president", "US:governor:CA"
  title VARCHAR(200) NOT NULL, -- "President of Kenya", "Governor of Nairobi"
  description TEXT,
  
  -- Jurisdiction
  country_code VARCHAR(3) NOT NULL,
  governance_level VARCHAR(50) NOT NULL, -- nation, state, county, ward
  jurisdiction_name VARCHAR(200) NOT NULL, -- "Kenya", "Nairobi County"
  jurisdiction_code VARCHAR(50), -- Map to geography
  
  -- Term Structure
  term_years INTEGER DEFAULT 5,
  term_limit INTEGER DEFAULT 2,
  
  -- Election Info
  next_election_date DATE,
  election_type VARCHAR(50), -- "general", "appointment"
  is_elected BOOLEAN DEFAULT true,
  
  -- Metadata
  responsibilities TEXT,
  authority_level INTEGER DEFAULT 50, -- 1-100 scale for sorting
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(country_code, governance_level, jurisdiction_code, title)
);

-- 1.3 Office Holders (The Temporary Incumbent)
CREATE TABLE IF NOT EXISTS office_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES government_positions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Term Dates
  term_start DATE NOT NULL,
  term_end DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Verification Logic
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  verification_method VARCHAR(50), -- 'document_upload', 'email', 'admin'
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_notes TEXT,
  
  -- Claim Data
  claimed_at TIMESTAMPTZ DEFAULT now(),
  proof_documents JSONB, -- { "doc_url": "...", "official_email": "..." }
  
  -- History
  is_historical BOOLEAN DEFAULT false,
  
  UNIQUE(position_id, user_id, term_start)
);

-- 1.4 Election Cycles (Transitions)
CREATE TABLE IF NOT EXISTS election_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES government_positions(id),
  election_date DATE NOT NULL,
  election_type VARCHAR(50),
  
  declared_candidates JSONB DEFAULT '[]'::jsonb, -- List of User IDs
  winner_user_id UUID REFERENCES profiles(id),
  results_certified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.5 Position Communities (Official Spaces)
CREATE TABLE IF NOT EXISTS position_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES government_positions(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  
  access_level VARCHAR(20) DEFAULT 'public', -- 'public', 'verified_citizens'
  auto_moderation BOOLEAN DEFAULT true,
  
  UNIQUE(position_id)
);

-- ==========================================
-- 2. RLS POLICIES (Basic Security)
-- ==========================================

-- Enable RLS
ALTER TABLE country_governance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_holders ENABLE ROW LEVEL SECURITY;

-- Policies for Templates
CREATE POLICY "Public can view verified templates" ON country_governance_templates
  FOR SELECT USING (is_verified = true);
  
CREATE POLICY "Admins can view all templates" ON country_governance_templates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Users can submit templates" ON country_governance_templates
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Policies for Positions
CREATE POLICY "Public can view positions" ON government_positions
  FOR SELECT USING (true);
  
-- Policies for Office Holders
CREATE POLICY "Public can view active holders" ON office_holders
  FOR SELECT USING (true); -- Historical data also public? Yes for transparency.

CREATE POLICY "Users can claim office" ON office_holders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 3. FIX: SEED MISSING CHANNELS
-- ==========================================
-- This repairs the regression where 'Monitoring' channels were lost

DO $$
DECLARE
  comm RECORD;
BEGIN
  FOR comm IN SELECT id FROM communities LOOP
    -- Restore 'Our Leaders' (Monitoring)
    INSERT INTO channels (community_id, name, type, category)
    SELECT comm.id, 'our-leaders', 'text', 'MONITORING'
    WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'our-leaders');
    
    -- Restore 'Projects Watch' (Monitoring)
    INSERT INTO channels (community_id, name, type, category)
    SELECT comm.id, 'projects-watch', 'text', 'MONITORING'
    WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'projects-watch');
    
    -- Restore 'Promises Watch' (Monitoring)
    INSERT INTO channels (community_id, name, type, category)
    SELECT comm.id, 'promises-watch', 'text', 'MONITORING'
    WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'promises-watch');
  END LOOP;
END;
$$;
