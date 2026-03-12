-- Populate profile text fields from OLD geography tables
-- Profile IDs reference the old counties/constituencies/wards tables

UPDATE profiles
SET 
    county = (SELECT name FROM counties WHERE id = profiles.county_id),
    constituency = (SELECT name FROM constituencies WHERE id = profiles.constituency_id),
    ward = (SELECT name FROM wards WHERE id = profiles.ward_id)
WHERE county_id IS NOT NULL 
  AND (county IS NULL OR constituency IS NULL OR ward IS NULL);

-- Verify the update worked
SELECT 
    id,
    county,
    constituency,
    ward,
    county_id,
    constituency_id,
    ward_id
FROM profiles
WHERE county_id IS NOT NULL
ORDER BY county, constituency, ward
LIMIT 10;
