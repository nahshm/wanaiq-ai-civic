import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface PostSkeletonProps {
    viewMode?: 'card' | 'compact';
}

/**
 * Skeleton loading component for posts
 * Matches the layout of PostCard for smooth loading experience
 */
export function PostSkeleton({ viewMode = 'card' }: PostSkeletonProps) {
    if (viewMode === 'compact') {
        return (
            <div className="flex border-b border-sidebar-border animate-pulse">
                {/* Vote Column */}
                <div className="flex flex-col items-center p-2 w-12 bg-sidebar-background/50 gap-1">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-6 w-6 rounded" />
                </div>

                {/* Content */}
                <div className="flex-1 p-3 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex gap-4 pt-1">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-14" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Card className="mb-2 bg-sidebar-background border-sidebar-border max-w-[640px] mx-auto animate-pulse">
            <CardContent className="p-3 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                </div>

                {/* Media placeholder (optional) */}
                <Skeleton className="h-40 w-full rounded-lg" />

                {/* Tags */}
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                    <div className="flex items-center gap-1 bg-sidebar-accent/50 rounded-full px-2 py-1">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-14 rounded-full" />
                    <Skeleton className="h-8 w-12 rounded-full" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Multiple skeletons for feed loading
 */
export function PostSkeletonList({ count = 5, viewMode = 'card' }: { count?: number; viewMode?: 'card' | 'compact' }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <PostSkeleton key={i} viewMode={viewMode} />
            ))}
        </div>
    );
}
