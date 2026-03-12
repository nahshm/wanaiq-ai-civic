-- Fix message_reactions RLS policy to restrict visibility to chat participants only
-- This prevents exposure of private conversation participants and activity patterns

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.message_reactions;

-- Create a restrictive policy that only allows viewing reactions for messages
-- the user can actually see (either in rooms they participate in, or channels they're members of)
CREATE POLICY "Reactions visible to chat participants"
    ON public.message_reactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_messages cm
            WHERE cm.id = message_reactions.message_id
            AND (
                -- Room messages: user must be a participant in the room
                (cm.room_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM chat_participants cp 
                    WHERE cp.room_id = cm.room_id 
                    AND cp.user_id = (SELECT auth.uid())
                ))
                OR
                -- Channel messages: user must be a member of the community that owns the channel
                (cm.channel_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM channels ch
                    JOIN community_members cmem ON cmem.community_id = ch.community_id
                    WHERE ch.id = cm.channel_id
                    AND cmem.user_id = (SELECT auth.uid())
                ))
            )
        )
    );