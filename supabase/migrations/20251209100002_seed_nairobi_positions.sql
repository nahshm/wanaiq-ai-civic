-- Migration: Seed Additional Positions (Nairobi Constituencies + Wards)
-- Description: Direct inserts for constituencies and wards that may not be in geography tables

-- ==========================================
-- NAIROBI CONSTITUENCIES (MPs)
-- ==========================================

INSERT INTO government_positions (
    position_code, title, description, country_code, governance_level,
    jurisdiction_name, jurisdiction_code, term_years, term_limit,
    next_election_date, election_type, is_elected, responsibilities, authority_level
) VALUES 
-- Embakasi East
('KE:embakasi-east:mp', 'Member of Parliament for Embakasi East', 
 'Represents Embakasi East Constituency in the National Assembly',
 'KE', 'constituency', 'Embakasi East Constituency', 'embakasi-east',
 5, NULL, '2027-08-09', 'general', true,
 'Legislation, Constituency development, Representation', 60),

-- Other Nairobi Constituencies
('KE:embakasi-west:mp', 'Member of Parliament for Embakasi West', 
 'Represents Embakasi West Constituency in the National Assembly',
 'KE', 'constituency', 'Embakasi West Constituency', 'embakasi-west',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:embakasi-north:mp', 'Member of Parliament for Embakasi North', 
 'Represents Embakasi North Constituency in the National Assembly',
 'KE', 'constituency', 'Embakasi North Constituency', 'embakasi-north',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:embakasi-south:mp', 'Member of Parliament for Embakasi South', 
 'Represents Embakasi South Constituency in the National Assembly',
 'KE', 'constituency', 'Embakasi South Constituency', 'embakasi-south',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:embakasi-central:mp', 'Member of Parliament for Embakasi Central', 
 'Represents Embakasi Central Constituency in the National Assembly',
 'KE', 'constituency', 'Embakasi Central Constituency', 'embakasi-central',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:westlands:mp', 'Member of Parliament for Westlands', 
 'Represents Westlands Constituency in the National Assembly',
 'KE', 'constituency', 'Westlands Constituency', 'westlands',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:starehe:mp', 'Member of Parliament for Starehe', 
 'Represents Starehe Constituency in the National Assembly',
 'KE', 'constituency', 'Starehe Constituency', 'starehe',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:langata:mp', 'Member of Parliament for Lang''ata', 
 'Represents Lang''ata Constituency in the National Assembly',
 'KE', 'constituency', 'Lang''ata Constituency', 'langata',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:kibra:mp', 'Member of Parliament for Kibra', 
 'Represents Kibra Constituency in the National Assembly',
 'KE', 'constituency', 'Kibra Constituency', 'kibra',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:dagoretti-north:mp', 'Member of Parliament for Dagoretti North', 
 'Represents Dagoretti North Constituency in the National Assembly',
 'KE', 'constituency', 'Dagoretti North Constituency', 'dagoretti-north',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:dagoretti-south:mp', 'Member of Parliament for Dagoretti South', 
 'Represents Dagoretti South Constituency in the National Assembly',
 'KE', 'constituency', 'Dagoretti South Constituency', 'dagoretti-south',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:roysambu:mp', 'Member of Parliament for Roysambu', 
 'Represents Roysambu Constituency in the National Assembly',
 'KE', 'constituency', 'Roysambu Constituency', 'roysambu',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:kasarani:mp', 'Member of Parliament for Kasarani', 
 'Represents Kasarani Constituency in the National Assembly',
 'KE', 'constituency', 'Kasarani Constituency', 'kasarani',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:ruaraka:mp', 'Member of Parliament for Ruaraka', 
 'Represents Ruaraka Constituency in the National Assembly',
 'KE', 'constituency', 'Ruaraka Constituency', 'ruaraka',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:mathare:mp', 'Member of Parliament for Mathare', 
 'Represents Mathare Constituency in the National Assembly',
 'KE', 'constituency', 'Mathare Constituency', 'mathare',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:makadara:mp', 'Member of Parliament for Makadara', 
 'Represents Makadara Constituency in the National Assembly',
 'KE', 'constituency', 'Makadara Constituency', 'makadara',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60),

('KE:kamukunji:mp', 'Member of Parliament for Kamukunji', 
 'Represents Kamukunji Constituency in the National Assembly',
 'KE', 'constituency', 'Kamukunji Constituency', 'kamukunji',
 5, NULL, '2027-08-09', 'general', true, 'Legislation, Constituency development', 60)

ON CONFLICT (position_code) DO NOTHING;

-- ==========================================
-- EMBAKASI EAST WARDS (MCAs)
-- ==========================================

INSERT INTO government_positions (
    position_code, title, description, country_code, governance_level,
    jurisdiction_name, jurisdiction_code, term_years, term_limit,
    next_election_date, election_type, is_elected, responsibilities, authority_level
) VALUES 
-- Utawala Ward
('KE:utawala:mca', 'MCA for Utawala Ward', 
 'Member of County Assembly representing Utawala Ward',
 'KE', 'ward', 'Utawala Ward', 'utawala',
 5, NULL, '2027-08-09', 'general', true,
 'County legislation, Ward development, Oversight', 50),

-- Upper Savannah Ward  
('KE:upper-savannah:mca', 'MCA for Upper Savannah Ward', 
 'Member of County Assembly representing Upper Savannah Ward',
 'KE', 'ward', 'Upper Savannah Ward', 'upper-savannah',
 5, NULL, '2027-08-09', 'general', true, 'County legislation, Ward development', 50),

-- Lower Savannah Ward
('KE:lower-savannah:mca', 'MCA for Lower Savannah Ward', 
 'Member of County Assembly representing Lower Savannah Ward',
 'KE', 'ward', 'Lower Savannah Ward', 'lower-savannah',
 5, NULL, '2027-08-09', 'general', true, 'County legislation, Ward development', 50),

-- Embakasi Ward
('KE:embakasi:mca', 'MCA for Embakasi Ward', 
 'Member of County Assembly representing Embakasi Ward',
 'KE', 'ward', 'Embakasi Ward', 'embakasi',
 5, NULL, '2027-08-09', 'general', true, 'County legislation, Ward development', 50),

-- Mihango Ward
('KE:mihango:mca', 'MCA for Mihango Ward', 
 'Member of County Assembly representing Mihango Ward',
 'KE', 'ward', 'Mihango Ward', 'mihango',
 5, NULL, '2027-08-09', 'general', true, 'County legislation, Ward development', 50)

ON CONFLICT (position_code) DO NOTHING;

NOTIFY pgrst, 'reload config';
