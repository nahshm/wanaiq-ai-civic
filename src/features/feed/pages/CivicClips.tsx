import { useState, useEffect, Suspense } from 'react'
import { VideoFeed } from '@/components/video/VideoFeed'
import { VideoFeedErrorBoundary } from '@/components/video/VideoFeedErrorBoundary'
import { CivicClipsHeader } from '@/components/video/CivicClipsHeader'
import { CivicClipsCategoryTabs, CivicCategory } from '@/components/video/CivicClipsCategoryTabs'
import { SwipeHint } from '@/components/video/SwipeHint'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { X, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { initCivicClipsMonitoring } from '@/lib/civic-clips-monitoring'
import { CivicClipsFilterModal, ClipsFilters } from '@/components/civic-clips/CivicClipsFilterModal'

export const CivicClipsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

    const categoryParam = searchParams.get('category') as CivicCategory | null
    const hashtag = searchParams.get('hashtag') || undefined

    const [activeCategory, setActiveCategory] = useState<CivicCategory | null>(categoryParam)
    const [showSwipeHint, setShowSwipeHint] = useState(true)
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isFirstVisit, setIsFirstVisit] = useState(true)
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [filters, setFilters] = useState<ClipsFilters>({ sortBy: 'recent' })

    // Show swipe hint only on first visit
    useEffect(() => {
        const hasSeenHint = localStorage.getItem('civic-clips-hint-seen')
        if (hasSeenHint) {
            setShowSwipeHint(false)
            setIsFirstVisit(false)
        } else {
            const timer = setTimeout(() => {
                localStorage.setItem('civic-clips-hint-seen', 'true')
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [])

    // Performance monitoring
    useEffect(() => {
        const cleanup = initCivicClipsMonitoring()
        return cleanup
    }, [])

    const handleCategoryChange = (category: CivicCategory | null) => {
        setActiveCategory(category)

        // Update URL params
        if (category) {
            setSearchParams({ category })
        } else {
            setSearchParams({})
        }
    }

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=clips`)
        }
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
        if (e.key === 'Escape') {
            setShowSearch(false)
            setSearchQuery('')
        }
    }

    return (
        <div className="fixed inset-0 bg-black">
            {/* Header */}
            <CivicClipsHeader
                onSearchClick={() => setShowSearch(true)}
                onFilterClick={() => setShowFilterModal(true)}
            />

            {/* Category Tabs */}
            <CivicClipsCategoryTabs
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
            />

            {/* Search Overlay */}
            {showSearch && (
                <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm">
                    <div className="flex flex-col items-center justify-start pt-20 px-4">
                        <div className="w-full max-w-md relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                            <Input
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search civic clips, hashtags, topics..."
                                className="w-full h-12 pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full text-lg"
                            />
                            <button
                                onClick={() => {
                                    setShowSearch(false)
                                    setSearchQuery('')
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Quick Search Suggestions */}
                        <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
                            {['#CDF', '#Accountability', '#ProjectWatch', '#Promise2027', '#CountyBudget'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        navigate(`/civic-clips?hashtag=${encodeURIComponent(tag.slice(1))}`)
                                        setShowSearch(false)
                                    }}
                                    className="px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm hover:bg-white/20 transition-colors"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Modal */}
            <CivicClipsFilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onApplyFilters={(newFilters) => setFilters(newFilters)}
                currentFilters={filters}
            />

            {/* Video Feed with Error Boundary */}
            <VideoFeedErrorBoundary
                onReset={() => {
                    // Reset state on error
                    setActiveCategory(null)
                    window.location.reload()
                }}
            >
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center h-screen bg-black">
                            <Loader2 className="h-12 w-12 text-white animate-spin" />
                        </div>
                    }
                >
                    <VideoFeed
                        category={activeCategory === 'trending' ? undefined : activeCategory || undefined}
                        hashtag={hashtag}
                        trending={activeCategory === 'trending'}
                        sortBy={filters.sortBy as 'recent' | 'views' | 'likes'}
                    />
                </Suspense>
            </VideoFeedErrorBoundary>

            {/* Swipe Hint (first visit only) */}
            <SwipeHint show={showSwipeHint && isFirstVisit} />
        </div>
    )
}
