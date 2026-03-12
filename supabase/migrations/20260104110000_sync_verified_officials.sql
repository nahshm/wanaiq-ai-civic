-- Migration: Sync verified officials to profiles
-- When an office holder is verified, update their profile's is_verified flag and official_position

-- 1. Add official_position column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS official_position TEXT,
ADD COLUMN IF NOT EXISTS official_position_id UUID REFERENCES government_positions(id);

-- 2. Create function to sync verification status
CREATE OR REPLACE FUNCTION sync_official_verification()
RETURNS TRIGGER AS $$
DECLARE
    position_title TEXT;
BEGIN
    -- When verification_status changes to 'verified'
    IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
        -- Get the position title
        SELECT title INTO position_title
        FROM government_positions
        WHERE id = NEW.position_id;
        
        -- Update the user's profile
        UPDATE profiles
        SET 
            is_verified = true,
            official_position = position_title,
            official_position_id = NEW.position_id,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        RAISE NOTICE 'Verified official % for position %', NEW.user_id, position_title;
    END IF;
    
    -- When verification_status changes FROM 'verified' to something else
    IF OLD.verification_status = 'verified' AND NEW.verification_status != 'verified' THEN
        -- Check if user has any OTHER verified positions
        IF NOT EXISTS (
            SELECT 1 FROM office_holders 
            WHERE user_id = NEW.user_id 
            AND id != NEW.id 
            AND verification_status = 'verified'
            AND is_active = true
        ) THEN
            -- No other verified positions, remove verified status
            UPDATE profiles
            SET 
                is_verified = false,
                official_position = NULL,
                official_position_id = NULL,
                updated_at = NOW()
            WHERE id = NEW.user_id;
            
            RAISE NOTICE 'Unverified official %', NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_official_verification ON office_holders;
CREATE TRIGGER trigger_sync_official_verification
    AFTER UPDATE ON office_holders
    FOR EACH ROW
    EXECUTE FUNCTION sync_official_verification();

-- 4. Backfill: Update existing verified officials
UPDATE profiles p
SET 
    is_verified = true,
    official_position = gp.title,
    official_position_id = gp.id,
    updated_at = NOW()
FROM office_holders oh
JOIN government_positions gp ON gp.id = oh.position_id
WHERE oh.user_id = p.id
AND oh.verification_status = 'verified'
AND oh.is_active = true;

-- Add comment
COMMENT ON COLUMN profiles.official_position IS 'Title of the government position if user is a verified official';
COMMENT ON COLUMN profiles.official_position_id IS 'Reference to government_positions if user is a verified official';
