import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCivicImpact } from './useCivicImpact';

export interface UserStats {
    totalPosts: number;
    totalComments: number;
    totalCivicActions: number;
    resolvedActions: number;
    badgesEarned: number;
    endorsements: number;
    impactRating: number;
    goatLevel: number;
}

export const useUserStats = (userId: string) => {
    const { impactScore } = useCivicImpact({ userId });

    return useQuery({
        queryKey: ['user-stats', userId],
        queryFn: async (): Promise<UserStats> => {
            if (!userId) {
                return {
                    totalPosts: 0,
                    totalComments: 0,
                    totalCivicActions: 0,
                    resolvedActions: 0,
                    badgesEarned: 0,
                    endorsements: 0,
                    impactRating: 0,
                    goatLevel: 1,
                };
            }

            // Fetch total posts
            const { count: postsCount } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('author_id', userId) as { count: number | null };

            // Fetch total comments
            const { count: commentsCount } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('author_id', userId) as { count: number | null };

            // Fetch total civic actions
            const { count: actionsCount } = await supabase
                .from('civic_actions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            // Fetch resolved actions
            const { count: resolvedCount } = await supabase
                .from('civic_actions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'resolved');

            // Fetch badges
            const { count: badgesCount } = await supabase
                .from('user_badges')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            // Fetch endorsements
            const { data: expertiseData } = await supabase
                .from('user_expertise')
                .select('endorsement_count')
                .eq('user_id', userId);

            const totalEndorsements = expertiseData?.reduce((sum, exp) => sum + (exp.endorsement_count || 0), 0) || 0;

            return {
                totalPosts: postsCount || 0,
                totalComments: commentsCount || 0,
                totalCivicActions: actionsCount || 0,
                resolvedActions: resolvedCount || 0,
                badgesEarned: badgesCount || 0,
                endorsements: totalEndorsements,
                impactRating: impactScore?.impactRating || 0,
                goatLevel: impactScore?.goatLevel || 1,
            };
        },
        enabled: !!userId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};
