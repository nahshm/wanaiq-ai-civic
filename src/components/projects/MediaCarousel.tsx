import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaCarouselProps {
    media: string[];
    alt?: string;
    aspectRatio?: '16/9' | '4/3' | '1/1';
    height?: string;
    showControls?: boolean;
    showIndicators?: boolean;
    autoPlay?: boolean;
    interval?: number;
    onImageClick?: (index: number) => void;
}

const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video');
};

export function MediaCarousel({
    media,
    alt = 'Project media',
    aspectRatio = '16/9',
    height = 'h-64',
    showControls = true,
    showIndicators = true,
    autoPlay = false,
    interval = 5000,
    onImageClick
}: MediaCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Return placeholder if no media
    if (!media || media.length === 0) {
        return (
            <div className={cn(
                "relative w-full bg-muted rounded-lg flex items-center justify-center",
                height
            )}
                style={{ aspectRatio }}>
                <div className="text-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No media available</p>
                </div>
            </div>
        );
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
        setIsPlaying(false);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
        setIsPlaying(false);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
        setIsPlaying(false);
    };

    const currentMedia = media[currentIndex];
    const isCurrentVideo = isVideo(currentMedia);

    // Reset playing state when media changes
    useEffect(() => {
        setIsPlaying(false);
    }, [currentIndex]);

    return (
        <div className="relative group">
            <div
                className={cn(
                    "relative w-full overflow-hidden rounded-lg bg-black cursor-pointer",
                    height
                )}
                style={{ aspectRatio }}
                onClick={() => !isCurrentVideo && onImageClick?.(currentIndex)}
            >
                {isCurrentVideo ? (
                    <video
                        ref={videoRef}
                        src={currentMedia}
                        controls
                        className="w-full h-full object-contain"
                        poster={currentMedia.replace(/\.(mp4|webm|ogg|mov)$/i, '.jpg')}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                    />
                ) : (
                    <img
                        src={currentMedia}
                        alt={`${alt} ${currentIndex + 1}`}
                        className="w-full h-full object-cover transition-opacity duration-300"
                        loading="lazy"
                    />
                )}

                {media.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        {currentIndex + 1} / {media.length}
                    </div>
                )}

                {isCurrentVideo && !isPlaying && (
                    <div
                        className="absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity duration-300"
                        onClick={(e) => {
                            e.stopPropagation();
                            videoRef.current?.play();
                        }}
                    >
                        <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                            <Play className="w-12 h-12 text-white fill-white" />
                        </div>
                    </div>
                )}
            </div>

            {showControls && media.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute left-2 top-1/2 -translate-y-1/2",
                            "bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm",
                            "opacity-0 group-hover:opacity-100 transition-opacity"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrevious();
                        }}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2",
                            "bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm",
                            "opacity-0 group-hover:opacity-100 transition-opacity"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                        }}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Button>
                </>
            )}

            {showIndicators && media.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {media.map((url, index) => {
                        const isVideoThumb = isVideo(url);
                        return (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToSlide(index);
                                }}
                                className={cn(
                                    "relative rounded-full transition-all",
                                    index === currentIndex
                                        ? "bg-white w-6 h-2"
                                        : "bg-white/50 hover:bg-white/75 w-2 h-2"
                                )}
                                aria-label={`Go to ${isVideoThumb ? 'video' : 'slide'} ${index + 1}`}
                            >
                                {isVideoThumb && index === currentIndex && (
                                    <Play className="absolute inset-0 w-2 h-2 m-auto" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
