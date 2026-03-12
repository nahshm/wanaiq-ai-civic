-- Remove duplicate "Home" channel - now replaced by "community-feed"
-- The "Home" channel was created by 20251208000000_hybrid_channels.sql
-- but since we now have "community-feed" in the FEED category, we should remove the duplicate

DELETE FROM channels WHERE name = 'Home';
