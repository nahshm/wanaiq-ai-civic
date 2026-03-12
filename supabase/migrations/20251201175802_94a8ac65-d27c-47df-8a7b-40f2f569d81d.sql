-- Fix user_is_room_participant to set search_path
CREATE OR REPLACE FUNCTION public.user_is_room_participant(room_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.room_id = room_uuid AND cp.user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql 
STABLE
SECURITY DEFINER
SET search_path = public;