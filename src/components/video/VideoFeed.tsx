import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { CivicClipCard } from './CivicClipCard'
import { Loader2 } from 'lucide-react'
import { useInView } from 'react-intersection-observer'

interface VideoFeedProps {
    category?: string
    hashtag?: string
    userId?: string
    trending?: boolean
    sortBy?: 'recent' | 'views' | 'likes'
}

export const VideoFeed = ({ category, hashtag, userId, trending = false, sortBy = 'recent' }: VideoFeedProps) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isMuted, setIsMuted] = useState(true) // Global mute state for all videos
    const containerRef = useRef<HTMLDivElement>(null)
    const { ref: loadMoreRef, inView } = useInView()

    // Fetch civic clips with infinite scroll
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['civic-clips', category, hashtag, userId, trending, sortBy],
        staleTime: 2 * 60 * 1000, // 2 minutes - data stays fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - cache time (renamed from cacheTime)
        refetchOnWindowFocus: false, // Don't refetch on tab focus
        refetchOnReconnect: true, // Refetch on network reconnect
        queryFn: async ({ pageParam = 0 }) => {
            let query = supabase
                .from('civic_clips')
                .select(`
          *,
          post:posts!civic_clips_post_id_fkey(
            id,
            title,
            content,
            created_at,
            author:profiles!posts_author_id_fkey(
              id,
              username,
              display_name,
              avatar_url
            ),
            community:communities(
              id,
              name,
              display_name
            )
          )
        `)
                .eq('processing_status', 'ready')

            // Order by sort preference
            if (trending || sortBy === 'views') {
                query = query.order('views_count', { ascending: false })
            } else if (sortBy === 'likes') {
                query = query.order('likes_count', { ascending: false })
            } else {
                query = query.order('created_at', { ascending: false })
            }

            query = query.range(pageParam * 10, (pageParam + 1) * 10 - 1)

            // Apply filters
            if (category) {
                query = query.eq('category', category)
            }
            if (hashtag) {
                query = query.contains('hashtags', [hashtag])
            }
            if (userId) {
                query = query.eq('post.author_id', userId)
            }

            const { data, error } = await query

            if (error) throw error
            return data || []
        },
        getNextPageParam: (lastPage, pages) => {
            if (lastPage.length < 10) return undefined
            return pages.length
        },
        initialPageParam: 0,
        retry: 2, // Retry failed requests twice
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    })

    // Load more when scrolling to bottom
    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const allClips = data?.pages.flatMap(page => page) || []

    // Track which video is currently in view using Intersection Observer
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observerOptions = {
            root: container,
            threshold: 0.5, // Video must be at least 50% visible
            rootMargin: '0px'
        }

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Find the index of the intersecting video
                    const videoElement = entry.target as HTMLElement
                    const index = parseInt(videoElement.dataset.index || '0', 10)
                    if (index !== currentIndex) {
                        setCurrentIndex(index)
                    }
                }
            })
        }

        const observer = new IntersectionObserver(observerCallback, observerOptions)

        // Observe all video cards
        const videoCards = container.querySelectorAll('[data-video-card]')
        videoCards.forEach((card) => observer.observe(card))

        return () => {
            videoCards.forEach((card) => observer.unobserve(card))
            observer.disconnect()
        }
    }, [allClips.length, currentIndex])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (allClips.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-6">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-2xl font-bold mb-2">No CivicClips Yet</h3>
                <p className="text-muted-foreground">
                    {category ? `No videos in the ${category} category.` : 'Be the first to create a CivicClip!'}
                </p>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth pt-24"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {allClips.map((clip, index) => {
                // Virtual rendering: only render current video +/- 1
                const shouldRender = Math.abs(index - currentIndex) <= 1
                const isActive = index === currentIndex

                return (
                    <div
                        key={clip.id}
                        data-video-card
                        data-index={index}
                        className="h-screen snap-start snap-always"
                    >
                        {shouldRender ? (
                            <CivicClipCard
                                clip={clip}
                                isActive={isActive}
                                isMuted={isMuted}
                                onMuteToggle={setIsMuted}
                                showAccountability={true}
                            />
                        ) : (
                            // Placeholder for non-rendered videos
                            <div className="h-full w-full bg-black flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-white/20" />
                            </div>
                        )}
                    </div>
                )
            })}

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                {isFetchingNextPage && (
                    <Loader2 className="h-6 w-6 animate-spin" />
                )}
            </div>

            {/* Hide scrollbar with CSS */}
            <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </div>
    )
}
