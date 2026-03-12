-- Fix existing geographic communities that were created with wrong type
-- These should be type='location' with location_type and location_value set

-- Update Nairobi County
UPDATE public.communities
SET 
  type = 'location',
  location_type = 'county',
  location_value = 'Nairobi'
WHERE name = 'Nairobi' 
  AND (type IS NULL OR type = 'interest')
  AND display_name LIKE '%County%';

-- Update Embakasi East Constituency  
UPDATE public.communities
SET 
  type = 'location',
  location_type = 'constituency',
  location_value = 'Embakasi East'
WHERE name = 'EmbakasiEast'
  AND (type IS NULL OR type = 'interest')
  AND display_name LIKE '%Constituency%';

-- Update Utawala Ward
UPDATE public.communities
SET 
  type = 'location',
  location_type = 'ward',
  location_value = 'Utawala'
WHERE name = 'Utawala'
  AND (type IS NULL OR type = 'interest')
  AND display_name LIKE '%Ward%';

-- General fix for any other geographic communities that match the naming pattern
-- County pattern: name without spaces, display_name ends with "County"
UPDATE public.communities
SET 
  type = 'location',
  location_type = 'county',
  location_value = REGEXP_REPLACE(display_name, ' County$', '')
WHERE display_name LIKE '% County'
  AND (type IS NULL OR type = 'interest')
  AND location_type IS NULL;

-- Constituency pattern: name without spaces, display_name ends with "Constituency"
UPDATE public.communities
SET 
  type = 'location',
  location_type = 'constituency',
  location_value = REGEXP_REPLACE(display_name, ' Constituency$', '')
WHERE display_name LIKE '% Constituency'
  AND (type IS NULL OR type = 'interest')
  AND location_type IS NULL;

-- Ward pattern: name without spaces, display_name ends with "Ward"
UPDATE public.communities
SET 
  type = 'location',
  location_type = 'ward',
  location_value = REGEXP_REPLACE(display_name, ' Ward$', '')
WHERE display_name LIKE '% Ward'
  AND (type IS NULL OR type = 'interest')
  AND location_type IS NULL;

-- Verify the changes
SELECT 
  name,
  display_name,
  type,
  location_type,
  location_value
FROM public.communities
WHERE display_name LIKE '%County' 
   OR display_name LIKE '%Constituency'
   OR display_name LIKE '%Ward'
ORDER BY location_type, display_name;
