/**
 * Feed System Constants
 * Centralized configuration for the feed feature
 */

export const FEED_CONFIG = {
    /** Number of posts to load per page */
    POSTS_PER_PAGE: 20,

    /** Cache duration for posts (5 minutes) */
    CACHE_DURATION: 5 * 60 * 1000,

    /** Stale time before refetch (2 minutes) */
    STALE_TIME: 2 * 60 * 1000,

    /** Minimum time between votes (1 second) */
    VOTE_COOLDOWN_MS: 1000,

    /** Number of trending posts to show */
    TRENDING_LIMIT: 10,

    /** Maximum content preview length */
    CONTENT_PREVIEW_LENGTH: 280,
} as const;

export const POST_SORT_OPTIONS = {
    HOT: 'hot',
    NEW: 'new',
    TOP: 'top',
    RISING: 'rising',
} as const;

export type PostSortOption = typeof POST_SORT_OPTIONS[keyof typeof POST_SORT_OPTIONS];

export const POST_CATEGORIES = {
    GOVERNANCE: 'governance',
    CIVIC_EDUCATION: 'civic-education',
    ACCOUNTABILITY: 'accountability',
    DISCUSSION: 'discussion',
} as const;

export type PostCategory = typeof POST_CATEGORIES[keyof typeof POST_CATEGORIES];

export const FEED_QUERY_KEYS = {
    posts: (sortBy: string, filterBy?: string) => ['posts', sortBy, filterBy] as const,
    post: (id: string) => ['post', id] as const,
    trending: () => ['trending'] as const,
    comments: (postId: string) => ['comments', postId] as const,
} as const;
