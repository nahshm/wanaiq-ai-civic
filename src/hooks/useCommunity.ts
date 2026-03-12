import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CommunityProfile, CommunityModerator, CommunityRule, CommunityFlair } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Utility function to convert snake_case keys to camelCase recursively
function toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result: any, key: string) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
}

interface CommunityData {
    community: CommunityProfile;
    moderators: CommunityModerator[];
    rules: CommunityRule[];
    flairs: CommunityFlair[];
    channels: any[];
    isMember: boolean;
    isModerator: boolean;
    isAdmin: boolean;
}

async function fetchCommunityByName(
    communityName: string,
    userId?: string,
    signal?: AbortSignal
): Promise<CommunityData | null> {
    const { data, error } = await supabase
        .from('communities')
        .select(`
      *,
        community_moderators (
            id,
            user_id,
            role,
            profiles!community_moderators_user_id_fkey (username, display_name, avatar_url)
        ),
      community_rules (*),
      community_flairs (*),
      channels (*)
    `)
        .eq('name', communityName)
        .abortSignal(signal)
        .single();

    if (error || !data) return null;

    const communityData = toCamelCase(data);

    // Fetch all-time distinct visitors
    const { data: visitsData } = await supabase
        .from('community_visits')
        .select('user_id')
        .eq('community_id', communityData.id)
        .abortSignal(signal);
    
    const totalVisitors = new Set(visitsData?.map(v => v.user_id) || []).size;

    // Fetch total posts as baseline for contributions
    const { count: totalPosts } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', communityData.id)
        .abortSignal(signal);

    // Attach total stats to community data
    communityData.weeklyVisitors = totalVisitors || 0;
    communityData.weekly_visitors = totalVisitors || 0; 
    communityData.weeklyContributions = totalPosts || 0;
    communityData.weekly_contributions = totalPosts || 0; 

    // Log this visit (for tracking weekly visitors)
    if (userId) {
        supabase.rpc('log_community_visit', {
            p_community_id: communityData.id
        }).then(() => { }); // Fire and forget
    }

    // Check membership and roles if user is logged in
    let isMember = false;
    let isModerator = false;
    let isAdmin = false;

    if (userId) {
        const { data: membership } = await supabase
            .from('community_members')
            .select('id')
            .eq('community_id', communityData.id)
            .eq('user_id', userId)
            .abortSignal(signal)
            .maybeSingle();

        isMember = !!membership;

        // Check for moderator/admin role from already fetched data
        const userMod = communityData.communityModerators?.find(
            (m: any) => m.userId === userId
        );
        if (userMod) {
            isModerator = userMod.role === 'moderator';
            isAdmin = userMod.role === 'admin';
        }
    }

    // Sort channels by position for consistent ordering
    const sortedChannels = (communityData.channels || []).sort(
        (a: any, b: any) => (a.position ?? 99) - (b.position ?? 99)
    );

    return {
        community: communityData,
        moderators: communityData.communityModerators || [],
        rules: communityData.communityRules || [],
        flairs: communityData.communityFlairs || [],
        channels: sortedChannels,
        isMember,
        isModerator,
        isAdmin,
    };
}

export const useCommunity = (communityName: string | undefined) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Main community query with caching
    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['community', communityName, user?.id],
        queryFn: ({ signal }) => fetchCommunityByName(communityName!, user?.id, signal),
        enabled: !!communityName,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false, // Don't retry - prevents stale data from old communities
    });

    // Membership toggle with optimistic updates
    const toggleMembership = useMutation({
        mutationFn: async () => {
            if (!user || !data?.community) throw new Error('Not authenticated or no community');

            const { community, isMember } = data;

            if (isMember) {
                const { error } = await supabase
                    .from('community_members')
                    .delete()
                    .eq('community_id', community.id)
                    .eq('user_id', user.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('community_members')
                    .insert({
                        community_id: community.id,
                        user_id: user.id,
                    });
                if (error) throw error;
            }

            return !isMember; // New membership state
        },
        onMutate: async () => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['community', communityName, user?.id] });

            // Snapshot the previous value
            const previousData = queryClient.getQueryData<CommunityData>(['community', communityName, user?.id]);

            // Optimistically update
            if (previousData) {
                queryClient.setQueryData<CommunityData>(['community', communityName, user?.id], {
                    ...previousData,
                    isMember: !previousData.isMember,
                    community: {
                        ...previousData.community,
                        memberCount: (previousData.community.memberCount || 0) + (previousData.isMember ? -1 : 1),
                    },
                });
            }

            return { previousData };
        },
        onError: (err, _, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(['community', communityName, user?.id], context.previousData);
            }
            toast({
                title: 'Error',
                description: 'Failed to update membership',
                variant: 'destructive',
            });
        },
        onSuccess: (newMemberState) => {
            toast({
                title: newMemberState ? 'Joined community' : 'Left community',
                description: `You have ${newMemberState ? 'joined' : 'left'} ${data?.community?.displayName}`,
            });
        },
        onSettled: () => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['community', communityName, user?.id] });
        },
    });

    return {
        community: data?.community ?? null,
        moderators: data?.moderators ?? [],
        rules: data?.rules ?? [],
        flairs: data?.flairs ?? [],
        channels: data?.channels ?? [],
        isMember: data?.isMember ?? false,
        isModerator: data?.isModerator ?? false,
        isAdmin: data?.isAdmin ?? false,
        isLoading,
        error,
        refetch,
        toggleMembership: toggleMembership.mutate,
        isTogglingMembership: toggleMembership.isPending,
    };
};
