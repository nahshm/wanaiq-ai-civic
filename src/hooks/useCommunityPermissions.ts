import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CommunityPermissions {
    isMember: boolean;
    isModerator: boolean;
    isAdmin: boolean;
    canManageChannels: boolean;
    canDeleteChannels: boolean;
    canPost: boolean;
    canModerate: boolean;
}

async function fetchPermissions(
    communityId: string,
    userId: string,
    signal?: AbortSignal
): Promise<CommunityPermissions> {
    // Check membership
    const { data: membership } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .abortSignal(signal)
        .maybeSingle();

    const isMember = !!membership;

    // Check moderator/admin role
    const { data: modData } = await supabase
        .from('community_moderators')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .abortSignal(signal)
        .maybeSingle();

    const isModerator = modData?.role === 'moderator';
    const isAdmin = modData?.role === 'admin';

    return {
        isMember,
        isModerator,
        isAdmin,
        canManageChannels: isAdmin || isModerator,
        canDeleteChannels: isAdmin,
        canPost: isMember, // Could add public community check here
        canModerate: isAdmin || isModerator,
    };
}

export const useCommunityPermissions = (communityId: string | undefined) => {
    const { user } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ['communityPermissions', communityId, user?.id],
        queryFn: ({ signal }) => fetchPermissions(communityId!, user!.id, signal),
        enabled: !!communityId && !!user,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Return default permissions when not loaded or not logged in
    const defaultPermissions: CommunityPermissions = {
        isMember: false,
        isModerator: false,
        isAdmin: false,
        canManageChannels: false,
        canDeleteChannels: false,
        canPost: false,
        canModerate: false,
    };

    return {
        ...(data ?? defaultPermissions),
        isLoading,
    };
};
