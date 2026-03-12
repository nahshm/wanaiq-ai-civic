-- Test if the subquery lookups actually work
-- Using your profile ID as example

-- Test county lookup
SELECT 
    p.id,
    p.county_id,
    (SELECT name FROM counties WHERE id = p.county_id) as county_name_lookup
FROM profiles p
WHERE p.id = '66033a0b-3540-4ccd-988e-4ddae3057f8c';

-- Test constituency lookup
SELECT 
    p.id,
    p.constituency_id,
    (SELECT name FROM constituencies WHERE id = p.constituency_id) as constituency_name_lookup
FROM profiles p
WHERE p.id = '66033a0b-3540-4ccd-988e-4ddae3057f8c';

-- Test ward lookup
SELECT 
    p.id,
    p.ward_id,
    (SELECT name FROM wards WHERE id = p.ward_id) as ward_name_lookup
FROM profiles p
WHERE p.id = '66033a0b-3540-4ccd-988e-4ddae3057f8c';

-- Test if WHERE clause matches your profile
SELECT id, county, constituency, ward, county_id, constituency_id, ward_id
FROM profiles
WHERE id = '66033a0b-3540-4ccd-988e-4ddae3057f8c'
  AND county_id IS NOT NULL 
  AND (county IS NULL OR constituency IS NULL OR ward IS NULL);
