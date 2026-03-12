import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GovernmentPosition } from '@/types/governance';

export interface LeaderProfile {
    id: string;
    display_name: string;
    avatar_url?: string;
    username?: string;
    is_verified?: boolean;
    official_position?: string | null;
    official_position_id?: string | null;
}

export interface PositionHolder {
    id: string;
    user_id: string;
    term_start: string;
    term_end: string;
    verification_status: string;
    user?: LeaderProfile | null;
}

export interface PositionWithHolder extends GovernmentPosition {
    current_holder?: PositionHolder | null;
    pending_holder?: PositionHolder | null;
    promise_count?: number;
    project_count?: number;
}

interface UseLeaderPositionsParams {
    levelType: 'COUNTY' | 'CONSTITUENCY' | 'WARD' | 'COMMUNITY';
    locationValue: string;
    enabled?: boolean;
}

/**
 * Custom hook to fetch government positions with their current holders
 * Uses React Query for caching, deduplication, and automatic retries
 */
export function useLeaderPositions({ levelType, locationValue, enabled = true }: UseLeaderPositionsParams) {
    return useQuery({
        queryKey: ['leader-positions', levelType, locationValue],
        queryFn: async (): Promise<PositionWithHolder[]> => {
            const governanceLevel = levelType.toLowerCase();

            const cleanedLocation = locationValue
                .replace(/\s*(county|constituency|ward)\s*$/i, '')
                .trim();

            const jurisdictionCode = cleanedLocation.toLowerCase().replace(/\s+/g, '-');

            // Step 1: Fetch all positions for this governance level and location
            const { data: positionsData, error: posError } = await supabase
                .from('government_positions')
                .select('*')
                .eq('governance_level', governanceLevel)
                .or(`jurisdiction_code.ilike.%${jurisdictionCode}%,jurisdiction_name.ilike.%${cleanedLocation}%`)
                .order('authority_level', { ascending: false });

            if (posError) {
                throw new Error(`Failed to fetch positions: ${posError.message}`);
            }

            if (!positionsData || positionsData.length === 0) {
                return [];
            }

            // Step 2: Batch fetch all active holders (verified AND pending)
            const positionIds = positionsData.map(p => p.id);

            const { data: holdersData, error: holdersError } = await supabase
                .from('office_holders')
                .select(`
                    id,
                    position_id,
                    user_id,
                    term_start,
                    term_end,
                    verification_status
                `)
                .in('position_id', positionIds)
                .eq('is_active', true)
                .in('verification_status', ['verified', 'pending']);

            if (holdersError) {
                console.warn('Error fetching holders:', holdersError);
            }

            // Step 3: Batch fetch all user profiles with extended fields
            const userIds = holdersData?.map(h => h.user_id).filter(Boolean) || [];
            let profilesMap: Record<string, LeaderProfile> = {};

            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, display_name, avatar_url, username, is_verified, official_position, official_position_id')
                    .in('id', userIds);

                if (profilesData) {
                    profilesMap = profilesData.reduce((acc, profile) => {
                        acc[profile.id] = profile;
                        return acc;
                    }, {} as Record<string, LeaderProfile>);
                }
            }

            // Step 4: Fetch promise and project counts per holder
            const holderUserIds = userIds.filter(id => id in profilesMap);
            let promiseCountMap: Record<string, number> = {};
            let projectCountMap: Record<string, number> = {};

            if (holderUserIds.length > 0) {
                // Promises linked to officials (politician_id references officials table, but we check by name match)
                // For now, count promises where politician_id matches any official record linked to the user
                const { data: promisesData } = await supabase
                    .from('campaign_promises')
                    .select('politician_id')
                    .in('submitted_by', holderUserIds);

                if (promisesData) {
                    promisesData.forEach(p => {
                        promiseCountMap[p.politician_id] = (promiseCountMap[p.politician_id] || 0) + 1;
                    });
                }
            }

            // Step 5: Join the data together
            // Group holders by position: verified takes priority, pending is fallback
            const verifiedHoldersMap: Record<string, PositionHolder> = {};
            const pendingHoldersMap: Record<string, PositionHolder> = {};

            (holdersData || []).forEach(holder => {
                const enrichedHolder: PositionHolder = {
                    ...holder,
                    user: profilesMap[holder.user_id] || null
                };

                if (holder.verification_status === 'verified') {
                    verifiedHoldersMap[holder.position_id] = enrichedHolder;
                } else if (holder.verification_status === 'pending') {
                    pendingHoldersMap[holder.position_id] = enrichedHolder;
                }
            });

            return positionsData.map(position => ({
                ...position,
                current_holder: verifiedHoldersMap[position.id] || null,
                pending_holder: !verifiedHoldersMap[position.id] ? (pendingHoldersMap[position.id] || null) : null,
                promise_count: 0, // TODO: wire up when promise-to-position linking is established
                project_count: 0,
            }));
        },
        enabled: enabled && !!locationValue,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    });
}
