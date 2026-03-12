import { cn } from '@/lib/utils'

interface CivicClipProgressIndicatorProps {
    progress: number // 0-100
    duration?: number
    className?: string
}

export const CivicClipProgressIndicator = ({
    progress,
    duration,
    className
}: CivicClipProgressIndicatorProps) => {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className={cn("w-full", className)}>
            {/* Progress bar */}
            <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                    className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />
                
                {/* Buffered indicator (optional) */}
                <div 
                    className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
                    style={{ width: `${Math.min(progress + 10, 100)}%` }}
                />
            </div>

            {/* Duration label */}
            {duration && (
                <div className="flex justify-between mt-1 text-[10px] text-white/60 font-mono">
                    <span>{formatTime(duration * progress / 100)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            )}
        </div>
    )
}
