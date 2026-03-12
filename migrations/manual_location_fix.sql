-- Quick fix: Manually set location for your profile
-- Replace with your actual location

-- First, let's see what Nairobi constituencies and wards exist
SELECT name, id
FROM administrative_divisions
WHERE governance_level = 'constituency'
  AND parent_id = (
    SELECT id FROM administrative_divisions 
    WHERE name = 'Nairobi' AND governance_level = 'county'
  )
ORDER BY name
LIMIT 10;

-- For your specific profile (66033a0b-3540-4ccd-988e-4ddae3057f8c)
-- Update with correct text values
-- You can pick the constituency/ward you actually live in

-- Example (adjust based on what you see above):
UPDATE profiles
SET 
    county = 'Nairobi',
    constituency = 'Dagoretti North',  -- Change to your actual constituency
    ward = 'Riruta'  -- Change to your actual ward
WHERE id = '66033a0b-3540-4ccd-988e-4ddae3057f8c';

-- Verify
SELECT county, constituency, ward, county_id, constituency_id, ward_id
FROM profiles
WHERE id = '66033a0b-3540-4ccd-988e-4ddae3057f8c';
