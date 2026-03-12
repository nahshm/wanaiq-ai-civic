import { useState, useRef, useEffect } from 'react'
import { VideoPlayer } from './VideoPlayer'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, MessageCircle, Bookmark, Share2, Eye, Volume2, VolumeX, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { copyToClipboard } from '@/lib/clipboard-utils'
import { CivicClipAccountabilityBadge } from './CivicClipAccountabilityBadge'
import { CivicClipProgressIndicator } from './CivicClipProgressIndicator'
import { SafeContentRenderer } from '@/components/posts/SafeContentRenderer'
import { buildProfileLink } from '@/lib/profile-links'
interface CivicClipCardProps {
    clip: any
    isActive: boolean
    isMuted: boolean
    onMuteToggle: (muted: boolean) => void
    showAccountability?: boolean
}

export const CivicClipCard = ({ clip, isActive, isMuted, onMuteToggle, showAccountability = false }: CivicClipCardProps) => {
    const { user } = useAuth()
    const { toast } = useToast()
    const [liked, setLiked] = useState(false)
    const [saved, setSaved] = useState(false)
    const [likes, setLikes] = useState(clip.post?.votes_count || 0)
    const [progress, setProgress] = useState(0)
    const [showActions, setShowActions] = useState(false)

    const post = clip.post
    const author = post?.author
    const community = post?.community

    const handleLike = async () => {
        if (!user || !post) return

        try {
            if (liked) {
                // Unlike
                await supabase
                    .from('votes')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', user.id)

                setLikes(prev => prev - 1)
                setLiked(false)
            } else {
                // Like
                await supabase
                    .from('votes')
                    .insert({
                        post_id: post.id,
                        user_id: user.id,
                        vote_type: 'upvote'
                    })

                setLikes(prev => prev + 1)
                setLiked(true)
            }
        } catch (error) {
            console.error('Error toggling like:', error)
        }
    }

    const handleSave = async () => {
        if (!user || !post) return

        try {
            if (saved) {
                // Unsave
                await (supabase as any)
                    .from('saved_posts')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', user.id)

                setSaved(false)
                toast({ title: 'Removed from saved' })
            } else {
                // Save
                await (supabase as any)
                    .from('saved_posts')
                    .insert({
                        post_id: post.id,
                        user_id: user.id
                    })

                setSaved(true)
                toast({ title: 'Saved to your collection' })
            }
        } catch (error) {
            console.error('Error toggling save:', error)
        }
    }

    const handleShare = async () => {
        const url = `${window.location.origin}/post/${post.id}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.content,
                    url
                })
            } catch (error) {
                // User cancelled or error
            }
        } else {
            copyToClipboard(url, 'Link copied to clipboard')
        }
    }

    const handleView = async (duration: number, percentage: number) => {
        setProgress(percentage)

        if (!user) return

        try {
            await supabase
                .from('civic_clip_views')
                .insert({
                    clip_id: clip.id,
                    user_id: user.id,
                    watch_duration: Math.floor(duration),
                    watch_percentage: percentage,
                    completed: percentage >= 90,
                    device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
                })
        } catch (error) {
            // Silently fail - views are tracked best-effort
            console.error('Error tracking view:', error)
        }
    }

    const toggleMute = () => {
        onMuteToggle(!isMuted)
    }

    const getCategoryColor = (category?: string) => {
        const colors: Record<string, string> = {
            civic_education: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            promise_update: 'bg-green-500/20 text-green-400 border-green-500/30',
            project_showcase: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            explainer: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            community_report: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            accountability: 'bg-red-500/20 text-red-400 border-red-500/30',
            discussion: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
        }
        return colors[category || ''] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }

    const formatCategory = (category?: string) => {
        if (!category) return ''
        return category.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
    }

    return (
        <div className="relative h-screen w-full snap-start snap-always bg-black">
            {/* Video Progress Bar - Top */}
            <div className="absolute top-0 left-0 right-0 z-50 px-0">
                <CivicClipProgressIndicator progress={progress} duration={clip.duration} />
            </div>

            {/* Video Player */}
            <div className="absolute inset-0">
                <VideoPlayer
                    videoUrl={clip.video_url}
                    thumbnailUrl={clip.thumbnail_url}
                    autoPlay={isActive}
                    isActive={isActive}
                    muted={isMuted}
                    loop={true}
                    onView={handleView}
                    onMuteChange={onMuteToggle}
                    className="h-full w-full"
                />
            </div>

            {/* Overlay Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none">
                {/* Mute/Unmute Button - Top Left */}
                <button
                    onClick={toggleMute}
                    className="absolute top-24 left-4 p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all pointer-events-auto z-50"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? (
                        <VolumeX className="h-6 w-6 text-white" />
                    ) : (
                        <Volume2 className="h-6 w-6 text-white" />
                    )}
                </button>

                {/* Category and Views - Top Right */}
                <div className="absolute top-24 right-4 flex flex-col items-end gap-2 pointer-events-auto z-10">
                    <div className="flex items-center gap-2">
                        <Badge className={`${getCategoryColor(clip.category)} border`}>
                            {formatCategory(clip.category)}
                        </Badge>

                        <div className="flex items-center gap-1.5 text-white text-sm bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{clip.views_count?.toLocaleString() || 0}</span>
                        </div>
                    </div>

                    {/* Accountability Badge - hidden until columns exist */}
                    {/* Accountability Badge */}
                    {showAccountability && (
                        <CivicClipAccountabilityBadge
                            factCheckStatus={clip.fact_check_status || 'unverified'}
                            officialResponse={clip.official_response || 'none'}
                            hasSourceCitation={!!clip.source_citation_url}
                        />
                    )}
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-auto">
                    <div className="flex items-end justify-between gap-4">
                        {/* Left side - Info */}
                        <div className="flex-1 min-w-0">
                            {/* Author */}
                            <Link
                                to={buildProfileLink({ username: author?.username ?? '', is_verified: author?.is_verified, official_position: author?.official_position })}
                                className="flex items-center gap-3 mb-3 group"
                            >
                                <Avatar className="h-10 w-10 ring-2 ring-white/20">
                                    <AvatarImage src={author?.avatar_url} />
                                    <AvatarFallback>{author?.display_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-white font-semibold group-hover:underline">
                                        {author?.display_name}
                                    </p>
                                    <p className="text-white/70 text-sm">
                                        @{author?.username}
                                        {post?.created_at && ` • ${formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}`}
                                    </p>
                                </div>
                            </Link>

                            {/* Title */}
                            <Link to={`/post/${post?.id}`}>
                                <h3 className="text-white text-lg font-bold mb-2 line-clamp-2 hover:underline">
                                    {post?.title}
                                </h3>
                            </Link>

                            {/* Description */}
                            {post?.content && (
                                <SafeContentRenderer
                                    content={post.content}
                                    className="text-white/90 text-sm mb-3"
                                    truncate={true}
                                    maxLength={150}
                                />
                            )}

                            {/* Hashtags */}
                            {clip.hashtags && clip.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {clip.hashtags.slice(0, 3).map((tag: string) => (
                                        <Link
                                            key={tag}
                                            to={`/search?q=${encodeURIComponent('#' + tag)}`}
                                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                        >
                                            #{tag}
                                        </Link>
                                    ))}
                                    {clip.hashtags.length > 3 && (
                                        <span className="text-white/60 text-sm">
                                            +{clip.hashtags.length - 3} more
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Community */}
                            {community && (
                                <Link
                                    to={`/c/${community.name}`}
                                    className="text-white/80 hover:text-white text-sm font-medium"
                                >
                                    c/{community.name}
                                </Link>
                            )}
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex flex-col items-center gap-6">
                            {/* Like */}
                            <button
                                onClick={handleLike}
                                className="flex flex-col items-center gap-1 group"
                            >
                                <div className={`p-3 rounded-full bg-white/10 backdrop-blur-sm transition-all ${liked ? 'bg-red-500/30' : 'group-hover:bg-white/20'
                                    }`}>
                                    <Heart
                                        className={`h-6 w-6 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-white'
                                            }`}
                                    />
                                </div>
                                <span className="text-white text-xs font-medium">
                                    {likes > 0 ? likes.toLocaleString() : ''}
                                </span>
                            </button>

                            {/* Comment */}
                            <Link
                                to={`/post/${post?.id}`}
                                className="flex flex-col items-center gap-1 group"
                            >
                                <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                                    <MessageCircle className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-white text-xs font-medium">
                                    {post?.comment_count || ''}
                                </span>
                            </Link>

                            {/* Save */}
                            <button
                                onClick={handleSave}
                                className="flex flex-col items-center gap-1 group"
                            >
                                <div className={`p-3 rounded-full bg-white/10 backdrop-blur-sm transition-all ${saved ? 'bg-yellow-500/30' : 'group-hover:bg-white/20'
                                    }`}>
                                    <Bookmark
                                        className={`h-6 w-6 transition-colors ${saved ? 'fill-yellow-500 text-yellow-500' : 'text-white'
                                            }`}
                                    />
                                </div>
                            </button>

                            {/* Share */}
                            <button
                                onClick={handleShare}
                                className="flex flex-col items-center gap-1 group"
                            >
                                <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                                    <Share2 className="h-6 w-6 text-white" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
