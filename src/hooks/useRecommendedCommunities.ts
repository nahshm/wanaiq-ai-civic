import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RecommendedCommunity {
    id: string;
    name: string;
    displayName: string;
    description: string;
    avatarUrl: string | null;
    memberCount: number;
    weeklyVisitors: number;
    weeklyContributions: number;
    recommendationScore: number;
    recommendationReason: string;
}

async function fetchRecommendations(
    userId: string,
    limit: number = 10,
    signal?: AbortSignal
): Promise<RecommendedCommunity[]> {
    const { data, error } = await supabase
        .rpc('recommend_communities', {
            p_user_id: userId,
            p_limit: limit
        })
        .abortSignal(signal);

    if (error) throw error;

    return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        displayName: c.display_name,
        description: c.description,
        avatarUrl: c.avatar_url,
        memberCount: c.member_count,
        weeklyVisitors: c.weekly_visitors,
        weeklyContributions: c.weekly_contributions,
        recommendationScore: c.recommendation_score,
        recommendationReason: c.recommendation_reason
    }));
}

export const useRecommendedCommunities = (limit: number = 10) => {
    const { user } = useAuth();

    const {
        data: recommendations = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['communities', 'recommendations', user?.id, limit],
        queryFn: ({ signal }) => fetchRecommendations(user!.id, limit, signal),
        enabled: !!user,
        staleTime: 10 * 60 * 1000, // 10 minutes - recommendations don't need frequent updates
        retry: 1,
    });

    return {
        recommendations,
        isLoading,
        error,
        refetch,
    };
};
