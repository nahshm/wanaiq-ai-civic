
-- Clear existing geographic data to allow comprehensive reseeding with all 47 counties
-- This cascades to all child records due to foreign key constraints

TRUNCATE TABLE wards CASCADE;
TRUNCATE TABLE constituencies CASCADE;
TRUNCATE TABLE counties CASCADE;
