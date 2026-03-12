import { useAuth } from '@/contexts/AuthContext';
import { useGeographicCommunities } from './useGeographicCommunities';

/**
 * Hook to get the user's primary community based on their geographic location
 * 
 * Priority order (broad to specific):
 * 1. County (broadest, most activity)
 * 2. Constituency (medium specificity)
 * 3. Ward (most specific)
 * 
 * @returns Primary community info or null if no location set
 */
export const usePrimaryCommunity = () => {
    const { user, profile } = useAuth();
    const { geoCommunities, isLoading, error } = useGeographicCommunities();

    // Determine primary community (County > Constituency > Ward)
    const primaryCommunity = geoCommunities.county ||
        geoCommunities.constituency ||
        geoCommunities.ward;

    // Check if user has any location data
    // Use geoCommunities as source of truth (fetched directly from DB)
    // Fallback to profile for immediate availability
    const hasLocation = !!(
        geoCommunities.county ||
        geoCommunities.constituency ||
        geoCommunities.ward ||
        profile?.county ||
        profile?.constituency ||
        profile?.ward
    );

    return {
        // Community data
        slug: primaryCommunity?.name || null,
        displayName: primaryCommunity?.displayName || null,
        type: primaryCommunity?.type || null,
        avatarUrl: primaryCommunity?.avatarUrl || null,

        // Status flags
        hasLocation,
        isLoading,
        error,

        // For navigation
        path: primaryCommunity?.name ? `/c/${primaryCommunity.name}` : null,
    };
};
