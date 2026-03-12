import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, Play, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassLightbox } from '@/components/ui/GlassLightbox';

interface MediaGalleryProps {
    media: string[];
    title?: string;
    showDownload?: boolean;
}

const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video');
};

export function MediaGallery({ media, title = 'Project Media', showDownload = true }: MediaGalleryProps) {
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [videoLightboxOpen, setVideoLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!media || media.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No media available</p>
            </div>
        );
    }

    const openMedia = (index: number) => {
        const url = media[index];
        setCurrentIndex(index);
        if (isVideo(url)) {
            setVideoLightboxOpen(true);
        } else {
            setLightboxSrc(url);
        }
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    };

    const currentMedia = media[currentIndex];

    return (
        <>
            {/* Grid View */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((url, index) => {
                    const itemIsVideo = isVideo(url);
                    return (
                        <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group border-2 border-transparent hover:border-primary transition-all"
                            onClick={() => openMedia(index)}
                        >
                            {itemIsVideo ? (
                                <>
                                    <video
                                        src={url}
                                        className="w-full h-full object-cover"
                                        poster={url.replace(/\.(mp4|webm|ogg|mov)$/i, '.jpg')}
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity group-hover:bg-black/50">
                                        <div className="bg-white/90 rounded-full p-3 backdrop-blur-sm">
                                            <Play className="w-8 h-8 text-primary fill-primary" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                        <Video className="w-3 h-3" />
                                        Video
                                    </div>
                                </>
                            ) : (
                                <>
                                    <img
                                        src={url}
                                        alt={`${title} ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <ZoomIn className="w-8 h-8 text-white" />
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* GlassLightbox for images only */}
            <GlassLightbox
                src={lightboxSrc}
                alt={title}
                onClose={() => setLightboxSrc(null)}
            />

            {/* Video Lightbox */}
            <Dialog open={videoLightboxOpen} onOpenChange={setVideoLightboxOpen}>
                <DialogContent className="max-w-5xl h-[90vh] p-0 bg-black">
                    <div className="relative h-full flex flex-col">
                        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
                            <div className="flex items-center justify-between">
                                <DialogTitle className="text-white text-lg">
                                    {currentIndex + 1} / {media.length}
                                    <span className="ml-2 text-sm opacity-75">(Video)</span>
                                </DialogTitle>
                                <div className="flex items-center gap-2">
                                    {showDownload && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-white hover:bg-white/20"
                                            onClick={() => window.open(currentMedia, '_blank')}
                                        >
                                            <Download className="w-5 h-5" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:bg-white/20"
                                        onClick={() => setVideoLightboxOpen(false)}
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center p-4 pt-20">
                            <video
                                key={currentMedia}
                                src={currentMedia}
                                controls
                                autoPlay
                                className="max-w-full max-h-full object-contain"
                                poster={currentMedia.replace(/\.(mp4|webm|ogg|mov)$/i, '.jpg')}
                            />
                        </div>

                        {media.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-12 w-12"
                                    onClick={goToPrevious}
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-12 w-12"
                                    onClick={goToNext}
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </Button>
                            </>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {media.map((url, index) => {
                                    const thumbIsVideo = isVideo(url);
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentIndex(index)}
                                            className={cn(
                                                "relative flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all",
                                                index === currentIndex
                                                    ? "border-white scale-110 shadow-lg"
                                                    : "border-transparent opacity-60 hover:opacity-100 hover:border-white/50"
                                            )}
                                        >
                                            {thumbIsVideo ? (
                                                <>
                                                    <video src={url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                        <Play className="w-4 h-4 text-white fill-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
