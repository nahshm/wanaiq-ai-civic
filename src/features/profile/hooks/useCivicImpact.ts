import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface CivicImpactScore {
    userId: string;
    impactRating: number;
    trustTier: 'resident' | 'verified_resident' | 'verified_user' | 'verified_official';
    goatLevel: number;
    goatTitle: string;
    goatXp: number;
    actionsScore: number;
    resolutionScore: number;
    communityScore: number;
    reliabilityScore: number;
    calculatedAt: string;
}

export interface GoatLevel {
    level: number;
    title: string;
    xpRequired: number;
    description: string;
    badgeColor: string;
}

interface UseCivicImpactParams {
    userId: string;
    enabled?: boolean;
}

/**
 * Hook to fetch and manage civic impact scores
 * Uses React Query for caching and automatic updates
 */
export function useCivicImpact({ userId, enabled = true }: UseCivicImpactParams) {
    const queryClient = useQueryClient();

    // Fetch impact score
    const {
        data: impactScore,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['civic-impact', userId],
        queryFn: async (): Promise<CivicImpactScore | null> => {
            const { data, error } = await supabase
                .from('civic_impact_scores')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;
            if (!data) return null;

            // Transform snake_case to camelCase
            return {
                userId: data.user_id,
                impactRating: data.impact_rating,
                trustTier: (data.trust_tier || 'resident') as CivicImpactScore['trustTier'],
                goatLevel: data.goat_level,
                goatTitle: data.goat_title,
                goatXp: data.goat_xp,
                actionsScore: data.actions_score,
                resolutionScore: data.resolution_score,
                communityScore: data.community_score,
                reliabilityScore: data.reliability_score,
                calculatedAt: data.calculated_at,
            };
        },
        enabled: enabled && !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000,   // 30 minutes cache
        retry: 2,
    });

    // Fetch GOAT levels for reference
    const { data: goatLevels } = useQuery({
        queryKey: ['goat-levels'],
        queryFn: async (): Promise<GoatLevel[]> => {
            const { data, error } = await supabase
                .from('goat_levels')
                .select('*')
                .order('level', { ascending: true });

            if (error) throw error;

            return (data || []).map(level => ({
                level: level.level,
                title: level.title,
                xpRequired: level.xp_required,
                description: level.description,
                badgeColor: level.badge_color,
            }));
        },
        staleTime: 60 * 60 * 1000, // 1 hour - rarely changes
        gcTime: 24 * 60 * 60 * 1000, // 24 hours cache
    });

    // Mutation to recalculate impact rating
    const recalculateMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase
                .rpc('calculate_impact_rating', { p_user_id: userId });

            if (error) throw error;
            return data as number;
        },
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['civic-impact', userId] });
        },
    });

    // Calculate next level info
    const getNextLevel = (): GoatLevel | null => {
        if (!goatLevels || !impactScore) return null;
        return goatLevels.find(l => l.level > impactScore.goatLevel) || null;
    };

    // Calculate XP progress to next level
    const getXpProgress = (): { current: number; required: number; percent: number } => {
        const currentXp = impactScore?.goatXp || 0;
        const nextLevel = getNextLevel();

        if (!nextLevel || !goatLevels) {
            return { current: currentXp, required: 0, percent: 100 };
        }

        const currentLevelData = goatLevels.find(l => l.level === impactScore?.goatLevel);
        const currentLevelXp = currentLevelData?.xpRequired || 0;
        const xpNeeded = nextLevel.xpRequired - currentLevelXp;
        const xpProgress = currentXp - currentLevelXp;

        return {
            current: xpProgress,
            required: xpNeeded,
            percent: Math.min(100, Math.round((xpProgress / xpNeeded) * 100)),
        };
    };

    // Get impact rating color
    const getImpactColor = (): string => {
        const rating = impactScore?.impactRating || 0;
        if (rating >= 80) return 'text-green-500';
        if (rating >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Get trust tier display
    const getTrustTierDisplay = (): { label: string; icon: string; color: string } => {
        const tier = impactScore?.trustTier || 'resident';
        switch (tier) {
            case 'verified_official':
                return { label: 'Verified Official', icon: '🏛️', color: 'text-purple-500' };
            case 'verified_user':
                return { label: 'Verified User', icon: '✅', color: 'text-blue-500' };
            case 'verified_resident':
                return { label: 'Verified Resident', icon: '🏠', color: 'text-green-500' };
            default:
                return { label: 'Resident', icon: '👤', color: 'text-gray-500' };
        }
    };

    return {
        impactScore,
        goatLevels,
        isLoading,
        isError,
        error,
        refetch,
        recalculate: recalculateMutation.mutate,
        isRecalculating: recalculateMutation.isPending,
        getNextLevel,
        getXpProgress,
        getImpactColor,
        getTrustTierDisplay,
    };
}

export default useCivicImpact;
