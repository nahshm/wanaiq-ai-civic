/**
 * React Query Configuration Presets
 * 
 * Centralized cache timing configuration for different data types.
 * Use these presets to ensure consistent caching behavior across the app.
 */

export const QUERY_STALE_TIMES = {
    // Static data (changes very rarely - geography, categories, etc.)
    NEVER: Infinity,
    ONE_DAY: 24 * 60 * 60 * 1000, // 86,400,000 ms

    // Semi-static data (community info, user profiles)
    ONE_HOUR: 60 * 60 * 1000, // 3,600,000 ms
    THIRTY_MINUTES: 30 * 60 * 1000, // 1,800,000 ms
    FIFTEEN_MINUTES: 15 * 60 * 1000, // 900,000 ms

    // Dynamic data (posts, comments, feeds)
    FIVE_MINUTES: 5 * 60 * 1000, // 300,000 ms
    TWO_MINUTES: 2 * 60 * 1000, // 120,000 ms
    ONE_MINUTE: 60 * 1000, // 60,000 ms

    // Real-time-ish data (notifications, online users)
    THIRTY_SECONDS: 30 * 1000,
    TEN_SECONDS: 10 * 1000,
} as const;

export const QUERY_CACHE_TIMES = {
    // How long to keep unused data in memory
    ONE_DAY: 24 * 60 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    THIRTY_MINUTES: 30 * 60 * 1000,
    FIVE_MINUTES: 5 * 60 * 1000,
} as const;

/**
 * Preset configurations for different data types
 * 
 * Usage:
 * ```tsx
 * import { queryPresets } from '@/lib/react-query-config';
 * 
 * const { data } = useQuery({
 *   queryKey: ['counties'],
 *   queryFn: fetchCounties,
 *   ...queryPresets.static, // Spreads staleTime and cacheTime
 * });
 * ```
 */
export const queryPresets = {
    /**
     * Static data that never changes
     * Examples: geography data, interest categories, government position types
     */
    static: {
        staleTime: QUERY_STALE_TIMES.NEVER,
        cacheTime: QUERY_CACHE_TIMES.ONE_DAY,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    },

    /**
     * Semi-static data that changes occasionally
     * Examples: community info, user profiles, community rules
     */
    semiStatic: {
        staleTime: QUERY_STALE_TIMES.THIRTY_MINUTES,
        cacheTime: QUERY_CACHE_TIMES.ONE_HOUR,
        refetchOnWindowFocus: false,
    },

    /**
     * Dynamic data that updates frequently
     * Examples: posts, comments, feeds
     * Increased from 2min to 5min to reduce refetches by ~20%
     */
    dynamic: {
        staleTime: QUERY_STALE_TIMES.FIVE_MINUTES, // Increased from TWO_MINUTES
        cacheTime: QUERY_CACHE_TIMES.FIVE_MINUTES,
        refetchOnWindowFocus: true,
    },

    /**
     * Real-time data that needs frequent updates
     * Examples: notifications, online users count
     * 
     * NOTE: Use Supabase Realtime subscriptions instead of polling!
     */
    realtime: {
        staleTime: QUERY_STALE_TIMES.TEN_SECONDS,
        cacheTime: QUERY_CACHE_TIMES.FIVE_MINUTES,
        refetchOnWindowFocus: true,
        // refetchInterval: 30000, // ❌ REMOVED - was causing 35% egress waste
    },
} as const;

/**
 * Helper to create custom query options with base defaults
 */
export function createQueryOptions<T>(
    preset: keyof typeof queryPresets,
    overrides?: Partial<typeof queryPresets.static>
) {
    return {
        ...queryPresets[preset],
        ...overrides,
    };
}
