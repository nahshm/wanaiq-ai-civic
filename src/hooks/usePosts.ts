import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FEED_CONFIG, FEED_QUERY_KEYS } from '@/constants/feed';
import type { Post } from '@/types';

interface RawPostData {
    id: string;
    title: string;
    content: string | null;
    created_at: string;
    upvotes: number;
    downvotes: number;
    comment_count: number;
    tags: string[];
    content_sensitivity: string;
    is_ngo_verified: boolean;
    link_url?: string | null;
    link_title?: string | null;
    link_description?: string | null;
    link_image?: string | null;
    profiles: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
        is_verified: boolean;
        role: string;
    } | null;
    communities: {
        id: string;
        name: string;
        display_name: string;
        description: string | null;
        member_count: number;
        category: string;
    } | null;
    officials: {
        id: string;
        name: string;
        position: string;
    } | null;
    post_media: Array<{
        id: string;
        url: string;
        type: string;
        caption: string | null;
    }>;
}

const POST_SELECT_QUERY = `
  *,
  profiles!posts_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
  communities!posts_community_id_fkey (id, name, display_name, description, member_count, category),
  officials!posts_official_id_fkey (id, name, position),
  post_media!post_media_post_id_fkey (*)
`;

/**
 * Transform raw Supabase post data to our Post interface
 */
function transformPost(post: RawPostData, userVote: 'up' | 'down' | null = null): Post {
    return {
        id: post.id,
        title: post.title,
        content: post.content || '',
        author: {
            id: post.profiles?.id || '',
            username: post.profiles?.username || 'anonymous',
            displayName: post.profiles?.display_name || 'Anonymous User',
            avatar: post.profiles?.avatar_url || '/placeholder.svg',
            isVerified: post.profiles?.is_verified || false,
            role: (post.profiles?.role || 'citizen') as 'citizen' | 'official' | 'expert' | 'journalist',
        },
        community: post.communities ? {
            id: post.communities.id,
            name: post.communities.name,
            displayName: post.communities.display_name,
            description: post.communities.description || '',
            memberCount: post.communities.member_count || 0,
            category: post.communities.category as 'governance' | 'civic-education' | 'accountability' | 'discussion',
        } : undefined,
        createdAt: new Date(post.created_at),
        upvotes: post.upvotes || 0,
        downvotes: post.downvotes || 0,
        commentCount: post.comment_count || 0,
        userVote,
        tags: post.tags || [],
        contentSensitivity: (post.content_sensitivity || 'public') as 'public' | 'sensitive' | 'crisis',
        isNgoVerified: post.is_ngo_verified || false,
        link_url: post.link_url || null,
        link_title: post.link_title || null,
        link_description: post.link_description || null,
        link_image: post.link_image || null,
        media: (post.post_media || []).map(m => ({
            id: m.id,
            url: m.url,
            type: m.type as 'image' | 'video' | 'document',
            caption: m.caption || undefined,
        })) as any,
    };
}

/**
 * Hook for fetching paginated posts with React Query caching
 */
export function usePosts(sortBy: string = 'new', filterBy: string = 'all') {
    const { user } = useAuth();

    return useInfiniteQuery({
        queryKey: FEED_QUERY_KEYS.posts(sortBy, filterBy),
        queryFn: async ({ pageParam = 0 }) => {
            const from = pageParam * FEED_CONFIG.POSTS_PER_PAGE;
            const to = from + FEED_CONFIG.POSTS_PER_PAGE - 1;

            // Fetch posts
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(POST_SELECT_QUERY)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (postsError) throw postsError;
            if (!postsData) return { posts: [], nextPage: undefined };

            // Fetch user votes if authenticated
            const userVotes: { [postId: string]: 'up' | 'down' } = {};
            if (user && postsData.length > 0) {
                const postIds = postsData.map(post => post.id);
                const { data: votesData } = await supabase
                    .from('votes')
                    .select('post_id, vote_type')
                    .eq('user_id', user.id)
                    .in('post_id', postIds);

                if (votesData) {
                    votesData.forEach(vote => {
                        userVotes[vote.post_id] = vote.vote_type as 'up' | 'down';
                    });
                }
            }

            // Transform posts
            const posts = postsData.map(post =>
                transformPost(post as unknown as RawPostData, userVotes[post.id] || null)
            );

            return {
                posts,
                nextPage: postsData.length === FEED_CONFIG.POSTS_PER_PAGE ? pageParam + 1 : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        staleTime: FEED_CONFIG.STALE_TIME,
        gcTime: FEED_CONFIG.CACHE_DURATION,
        initialPageParam: 0,
    });
}

/**
 * Hook for fetching trending posts
 */
export function useTrendingPosts() {
    return useQuery({
        queryKey: FEED_QUERY_KEYS.trending(),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('posts')
                .select(POST_SELECT_QUERY)
                .order('upvotes', { ascending: false })
                .limit(FEED_CONFIG.TRENDING_LIMIT);

            if (error) throw error;
            return (data || []).map(post =>
                transformPost(post as unknown as RawPostData, null)
            );
        },
        staleTime: FEED_CONFIG.STALE_TIME,
        gcTime: FEED_CONFIG.CACHE_DURATION,
    });
}

/**
 * Hook for refreshing posts cache
 */
export function useRefreshPosts() {
    const queryClient = useQueryClient();

    return useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['trending'] });
    }, [queryClient]);
}
