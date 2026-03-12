-- Migration: Cleanup Duplicate Geography Data
-- Description: Removes duplicate entries from constituencies and wards tables
-- CAUTION: Run this AFTER backing up or verifying data

-- ==========================================
-- 1. CLEANUP DUPLICATE CONSTITUENCIES
-- Keep only the first entry for each duplicate name+county_id combination
-- ==========================================

-- First, identify duplicates and keep the one with the lowest ID
DELETE FROM constituencies 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM constituencies 
    GROUP BY name, county_id
);

-- Verify: Should now have ~290 constituencies
-- SELECT COUNT(*) FROM constituencies;

-- ==========================================
-- 2. CLEANUP DUPLICATE WARDS
-- Keep only the first entry for each duplicate name+constituency_id combination
-- ==========================================

DELETE FROM wards 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM wards 
    GROUP BY name, constituency_id
);

-- Verify: Should now have ~1450 wards
-- SELECT COUNT(*) FROM wards;

-- ==========================================
-- 3. CLEANUP DUPLICATE COUNTIES (if any)
-- ==========================================

DELETE FROM counties 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM counties 
    GROUP BY name
);

-- Verify: Should have exactly 47 counties
-- SELECT COUNT(*) FROM counties;

-- ==========================================
-- 4. ADD UNIQUE CONSTRAINTS TO PREVENT FUTURE DUPLICATES
-- ==========================================

-- Only proceed if constraints don't already exist
DO $$
BEGIN
    -- Constituencies unique on (name, county_id)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_constituency_per_county') THEN
        ALTER TABLE constituencies 
        ADD CONSTRAINT unique_constituency_per_county UNIQUE (name, county_id);
    END IF;
    
    -- Wards unique on (name, constituency_id)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_ward_per_constituency') THEN
        ALTER TABLE wards 
        ADD CONSTRAINT unique_ward_per_constituency UNIQUE (name, constituency_id);
    END IF;
    
    -- Counties unique on name
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_county_name') THEN
        ALTER TABLE counties 
        ADD CONSTRAINT unique_county_name UNIQUE (name);
    END IF;
END $$;

-- ==========================================
-- 5. VERIFICATION QUERIES (Run these to confirm)
-- ==========================================

-- SELECT 'counties' as tbl, COUNT(*) as cnt FROM counties
-- UNION ALL SELECT 'constituencies', COUNT(*) FROM constituencies
-- UNION ALL SELECT 'wards', COUNT(*) FROM wards;

-- Expected: counties ~47, constituencies ~290, wards ~1450

NOTIFY pgrst, 'reload config';
