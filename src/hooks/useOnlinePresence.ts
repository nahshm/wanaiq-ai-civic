import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for real-time online presence tracking using Supabase Realtime.
 * Provides instant updates when users join/leave a community.
 */
export const useOnlinePresence = (communityId: string | undefined) => {
    const { user } = useAuth();
    const [onlineCount, setOnlineCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!communityId || !user) return;

        const channelName = `community:${communityId}:presence`;
        const channel = supabase.channel(channelName, {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const uniqueUsers = Object.keys(state).length;
                setOnlineCount(uniqueUsers);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('User joined:', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('User left:', key, leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    // Track our presence
                    await channel.track({
                        user_id: user.id,
                        online_at: new Date().toISOString(),
                    });
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                }
            });

        // Also update the database record for users without realtime support
        const updateActiveStatus = async () => {
            try {
                await supabase.rpc('update_community_active_status', {
                    p_community_id: communityId,
                    p_user_id: user.id,
                });
            } catch (error) {
                // Non-critical, just log
                console.error('Failed to update active status:', error);
            }
        };

        updateActiveStatus();

        // Cleanup on unmount
        return () => {
            channel.unsubscribe();
            setIsConnected(false);
        };
    }, [communityId, user]);

    return {
        onlineCount,
        isConnected,
    };
};
