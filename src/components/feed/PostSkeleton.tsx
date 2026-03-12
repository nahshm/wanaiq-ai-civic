import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PostSkeletonProps {
  viewMode?: 'card' | 'compact';
}

/**
 * Skeleton loader for PostCard component
 * Provides visual feedback during data fetching
 */
export const PostSkeleton = ({ viewMode = 'card' }: PostSkeletonProps) => {
  if (viewMode === 'compact') {
    return (
      <Card className="mb-2">
        <CardContent className="p-3">
          <div className="flex gap-3 animate-pulse">
            {/* Vote section */}
            <div className="flex flex-col items-center gap-2 w-10">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-4 w-8 rounded" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" /> {/* Title */}
              <Skeleton className="h-3 w-1/2" /> {/* Metadata */}
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded" /> {/* Comment count */}
                <Skeleton className="h-6 w-16 rounded" /> {/* Share */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-4 animate-pulse">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" /> {/* Avatar */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" /> {/* Community name */}
              <Skeleton className="h-3 w-24" /> {/* Timestamp */}
            </div>
          </div>

          {/* Title */}
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />

          {/* Media placeholder */}
          <Skeleton className="h-64 w-full rounded-lg" />

          {/* Content preview */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Flairs */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-6 pt-3 border-t border-border/50">
            <Skeleton className="h-8 w-20 rounded-full" /> {/* Upvote */}
            <Skeleton className="h-8 w-20 rounded-full" /> {/* Comment */}
            <Skeleton className="h-8 w-20 rounded-full" /> {/* Share */}
            <Skeleton className="h-8 w-20 rounded-full" /> {/* Save */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface PostSkeletonListProps {
  count?: number;
  viewMode?: 'card' | 'compact';
  className?: string;
}

/**
 * List of skeleton loaders for multiple posts
 * Used during initial feed load and infinite scroll
 */
export const PostSkeletonList = ({ 
  count = 5, 
  viewMode = 'card',
  className = ''
}: PostSkeletonListProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton key={`skeleton-${index}`} viewMode={viewMode} />
      ))}
    </div>
  );
};

/**
 * Inline skeleton for infinite scroll loading indicator
 * Smaller and more subtle than full PostSkeleton
 */
export const InlinePostSkeleton = () => {
  return (
    <div className="py-8 flex justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading more posts...</span>
      </div>
    </div>
  );
};

/**
 * Shimmer effect skeleton for media loading
 * Used as placeholder while images/videos load
 */
export const MediaSkeleton = ({ aspectRatio = '16/9' }: { aspectRatio?: string }) => {
  return (
    <div 
      className="relative overflow-hidden bg-muted rounded-lg"
      style={{ aspectRatio }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};
