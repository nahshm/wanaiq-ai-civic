-- Fix Project Location Validation to Allow Hierarchical Scopes
-- This allows users to create county-level projects even if their profile has constituency/ward

CREATE OR REPLACE FUNCTION public.validate_project_location()
RETURNS TRIGGER AS $$
DECLARE
    v_user_county TEXT;
    v_user_constituency TEXT;
    v_user_ward TEXT;
BEGIN
    -- Allow national-level projects for everyone
    IF NEW.ward IS NULL AND NEW.constituency IS NULL AND NEW.county IS NULL THEN
        RETURN NEW; -- National project, no restriction
    END IF;

    -- Get user's location from profile
    SELECT county, constituency, ward INTO v_user_county, v_user_constituency, v_user_ward
    FROM public.profiles
    WHERE id = NEW.created_by;

    -- Hierarchical validation:
    -- User can create projects at ANY level within their location hierarchy
    
    -- County-level project: Just check county matches
    IF NEW.ward IS NULL AND NEW.constituency IS NULL AND NEW.county IS NOT NULL THEN
        IF NEW.county = v_user_county THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Constituency-level project: Check county and constituency match
    IF NEW.ward IS NULL AND NEW.constituency IS NOT NULL THEN
        IF NEW.county = v_user_county AND NEW.constituency = v_user_constituency THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Ward-level project: Check all three match
    IF NEW.ward IS NOT NULL THEN
        IF NEW.county = v_user_county AND 
           NEW.constituency = v_user_constituency AND 
           NEW.ward = v_user_ward THEN
            RETURN NEW;
        END IF;
    END IF;

    -- If we get here, location doesn't match
    RAISE EXCEPTION 'You can only post projects within your registered location. Your location: County=%, Constituency=%, Ward=%. Project location: County=%, Constituency=%, Ward=%',
        v_user_county, v_user_constituency, v_user_ward, NEW.county, NEW.constituency, NEW.ward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger already exists, no need to recreate it
-- It will automatically use the updated function

COMMENT ON FUNCTION public.validate_project_location() IS 'Validates that users can only create projects within their registered location hierarchy. Allows county, constituency, or ward level projects as long as they are within the users location.';
