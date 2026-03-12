import { useRef, useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { getVideoUrlsWithFallback, loadVideoWithRetry, getPreloadStrategy } from '@/lib/video-utils'

interface VideoPlayerProps {
    videoUrl: string
    thumbnailUrl?: string
    autoPlay?: boolean
    muted?: boolean
    loop?: boolean
    className?: string
    isActive?: boolean
    onView?: (duration: number, percentage: number) => void
    onComplete?: () => void
    onMuteChange?: (muted: boolean) => void
    /** Enable lazy loading - only loads video when near viewport */
    lazyLoad?: boolean
    /** Root margin for intersection observer (how early to start loading) */
    preloadMargin?: string
}

export const VideoPlayer = ({
    videoUrl,
    thumbnailUrl,
    autoPlay = false,
    muted = true,
    loop = false,
    className,
    isActive = true,
    onView,
    onComplete,
    onMuteChange,
    lazyLoad = true,
    preloadMargin = '200px'
}: VideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const [playing, setPlaying] = useState(autoPlay)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(muted ? 0 : 1)
    const [isMuted, setIsMuted] = useState(muted)
    const [showControls, setShowControls] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)
    const [isLoaded, setIsLoaded] = useState(!lazyLoad) // If not lazy loading, consider it loaded
    const [isBuffering, setIsBuffering] = useState(false)
    const [loadError, setLoadError] = useState<Error | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const maxRetries = 3

    // Intersection Observer for lazy loading
    const { ref: inViewRef, inView } = useInView({
        threshold: 0,
        rootMargin: preloadMargin,
        triggerOnce: true, // Only trigger once - once loaded, stay loaded
    })

    // Combine refs
    const setRefs = (node: HTMLDivElement | null) => {
        containerRef.current = node
        inViewRef(node)
    }

    // Start loading video when it comes into view
    useEffect(() => {
        if (inView && lazyLoad && !isLoaded && !loadError) {
            setIsLoaded(true)
        }
    }, [inView, lazyLoad, isLoaded, loadError])

    // Handle video loading with retry on error
    useEffect(() => {
        const video = videoRef.current
        if (!video || !isLoaded || !videoUrl) return

        const handleLoadError = async () => {
            console.warn('Video load error, attempting fallback...', { url: videoUrl, attempt: retryCount })
            setLoadError(new Error('Video failed to load'))

            // Try with fallback URLs
            if (retryCount < maxRetries) {
                setRetryCount(prev => prev + 1)
                setIsBuffering(true)

                try {
                    const fallbackUrls = getVideoUrlsWithFallback(videoUrl)
                    await loadVideoWithRetry(video, fallbackUrls, 2)
                    setLoadError(null)
                    setIsBuffering(false)
                } catch (error) {
                    console.error('All video load attempts failed:', error)
                    setIsBuffering(false)
                }
            }
        }

        video.addEventListener('error', handleLoadError)
        return () => video.removeEventListener('error', handleLoadError)
    }, [isLoaded, videoUrl, retryCount, maxRetries])

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime)

            // Track viewing progress
            if (video.duration && video.currentTime > 0) {
                const percentage = (video.currentTime / video.duration) * 100
                if (!hasStarted && video.currentTime > 1) {
                    setHasStarted(true)
                }
            }
        }

        const handleLoadedMetadata = () => {
            setDuration(video.duration)
        }

        const handleEnded = () => {
            setPlaying(false)

            // Track view completion
            if (onView && video.duration) {
                const percentage = 100
                onView(video.duration, percentage)
            }

            onComplete?.()
        }

        const handlePlay = () => {
            setPlaying(true)
        }

        const handlePause = () => {
            setPlaying(false)

            // Track partial view
            if (onView && video.duration && video.currentTime > 0) {
                const percentage = (video.currentTime / video.duration) * 100
                onView(video.currentTime, percentage)
            }
        }

        video.addEventListener('timeupdate', handleTimeUpdate)
        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('ended', handleEnded)
        video.addEventListener('play', handlePlay)
        video.addEventListener('pause', handlePause)

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate)
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            video.removeEventListener('ended', handleEnded)
            video.removeEventListener('play', handlePlay)
            video.removeEventListener('pause', handlePause)
        }
    }, [hasStarted, onView, onComplete])

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Handle play/pause based on isActive (visibility)
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handlePlayPause = async () => {
            try {
                if (isActive) {
                    // Video is in view - play it
                    // Only play if not already playing
                    if (video.paused) {
                        await video.play()
                    }
                } else {
                    // Video is out of view - pause it
                    // Only pause if not already paused
                    if (!video.paused) {
                        video.pause()
                    }
                }
            } catch (error) {
                // Silently handle AbortError when play/pause conflict
                if (error instanceof DOMException && error.name === 'AbortError') {
                    // Expected error when scrolling quickly, ignore it
                    return
                }
                console.error('Video play/pause error:', error)
            }
        }

        handlePlayPause()
    }, [isActive])

    // Pause video when tab/window is not visible (Page Visibility API)
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Tab is hidden - pause video
                if (!video.paused) {
                    video.pause()
                }
            } else {
                // Tab is visible again - resume if this video is active
                if (isActive && video.paused && autoPlay) {
                    video.play().catch(() => {
                        // Silently handle play errors
                    })
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [isActive, autoPlay])

    const togglePlay = () => {
        if (videoRef.current) {
            if (playing) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            const newMuted = !isMuted
            videoRef.current.muted = newMuted
            setIsMuted(newMuted)
            setVolume(newMuted ? 0 : 1)
            onMuteChange?.(newMuted)
        }
    }

    const handleSeek = (value: number[]) => {
        if (videoRef.current) {
            videoRef.current.currentTime = value[0]
            setCurrentTime(value[0])
        }
    }

    const handleVolumeChange = (value: number[]) => {
        if (videoRef.current) {
            const newVolume = value[0]
            videoRef.current.volume = newVolume
            setVolume(newVolume)
            setIsMuted(newVolume === 0)
        }
    }

    const toggleFullscreen = () => {
        if (!containerRef.current) return

        if (!isFullscreen) {
            containerRef.current.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    // Handle video buffering state
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleWaiting = () => setIsBuffering(true)
        const handlePlaying = () => setIsBuffering(false)
        const handleCanPlay = () => setIsBuffering(false)

        video.addEventListener('waiting', handleWaiting)
        video.addEventListener('playing', handlePlaying)
        video.addEventListener('canplay', handleCanPlay)

        return () => {
            video.removeEventListener('waiting', handleWaiting)
            video.removeEventListener('playing', handlePlaying)
            video.removeEventListener('canplay', handleCanPlay)
        }
    }, [isLoaded])

    return (
        <div
            ref={setRefs}
            className={cn(
                'relative aspect-[9/16] bg-black rounded-lg overflow-hidden group',
                className
            )}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Thumbnail placeholder shown before video loads */}
            {(!isLoaded || !videoUrl) && thumbnailUrl && (
                <img
                    src={thumbnailUrl}
                    alt="Video thumbnail"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}

            {/* Loading spinner */}
            {(!isLoaded || isBuffering) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Loader2 className="h-10 w-10 text-white animate-spin" />
                </div>
            )}

            {/* Video element - only render src when loaded */}
            <video
                ref={videoRef}
                src={isLoaded ? videoUrl : undefined}
                poster={thumbnailUrl}
                className="w-full h-full object-contain cursor-pointer"
                autoPlay={isLoaded && autoPlay}
                muted={muted}
                loop={loop}
                playsInline
                preload={isLoaded ? getPreloadStrategy() : 'none'}
                onClick={togglePlay}
                crossOrigin="anonymous"
            />

            {/* Play/Pause Overlay */}
            {!playing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity">
                    <Button
                        size="lg"
                        variant="ghost"
                        className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                        onClick={togglePlay}
                    >
                        <Play className="h-8 w-8 text-white fill-white" />
                    </Button>
                </div>
            )}

            {/* Controls */}
            <div
                className={cn(
                    'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity',
                    showControls || !playing ? 'opacity-100' : 'opacity-0'
                )}
            >
                {/* Progress Bar */}
                <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="mb-3 cursor-pointer"
                />

                <div className="flex items-center justify-between text-white text-sm">
                    <div className="flex items-center gap-2">
                        {/* Play/Pause */}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-white/20"
                            onClick={togglePlay}
                        >
                            {playing ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                        </Button>

                        {/* Volume */}
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-white/20"
                                onClick={toggleMute}
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX className="h-4 w-4" />
                                ) : (
                                    <Volume2 className="h-4 w-4" />
                                )}
                            </Button>

                            <Slider
                                value={[volume]}
                                max={1}
                                step={0.1}
                                onValueChange={handleVolumeChange}
                                className="w-20 hidden sm:block"
                            />
                        </div>

                        {/* Time */}
                        <span className="text-xs font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Fullscreen */}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-white/20"
                        onClick={toggleFullscreen}
                    >
                        {isFullscreen ? (
                            <Minimize className="h-4 w-4" />
                        ) : (
                            <Maximize className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
