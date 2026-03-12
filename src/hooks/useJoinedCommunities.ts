import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CommunityProfile } from '@/types';

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

interface GeographicCommunities {
    county?: CommunityProfile;
    constituency?: CommunityProfile;
    ward?: CommunityProfile;
}

async function fetchJoinedCommunities(
    userId: string,
    geoCommunities: GeographicCommunities,
    signal?: AbortSignal
): Promise<CommunityProfile[]> {
    const { data: memberships } = await supabase
        .from('community_members')
        .select('community:communities(*)')
        .eq('user_id', userId)
        .abortSignal(signal);

    if (!memberships) return [];

    const allJoined = memberships.map((m: any) => toCamelCase(m.community));

    // Filter out geographic communities to avoid duplication
    const geoIds = new Set([
        geoCommunities.county?.id,
        geoCommunities.constituency?.id,
        geoCommunities.ward?.id,
    ].filter(Boolean));

    return allJoined.filter((c: CommunityProfile) => !geoIds.has(c.id));
}

export const useJoinedCommunities = (geoCommunities: GeographicCommunities) => {
    const { user } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: ['joinedCommunities', user?.id, geoCommunities.county?.id, geoCommunities.constituency?.id, geoCommunities.ward?.id],
        queryFn: ({ signal }) => fetchJoinedCommunities(user!.id, geoCommunities, signal),
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        joinedCommunities: data ?? [],
        isLoading,
        error,
    };
};
