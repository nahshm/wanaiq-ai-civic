import { Eye, MessageCircle, CheckCircle2, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EngagementBarProps {
    viewsCount: number;
    commentsCount: number;
    verificationsCount: number;
    isVerified?: boolean;
    onComment?: () => void;
    onShare?: () => void;
    onBookmark?: () => void;
    isBookmarked?: boolean;
    compact?: boolean;
}

export function EngagementBar({
    viewsCount,
    commentsCount,
    verificationsCount,
    isVerified = false,
    onComment,
    onShare,
    onBookmark,
    isBookmarked = false,
    compact = false
}: EngagementBarProps) {
    const StatItem = ({ icon: Icon, count, label, verified }: {
        icon: typeof Eye;
        count: number;
        label: string;
        verified?: boolean;
    }) => (
        <div className={cn(
            "flex items-center gap-1",
            verified ? "text-green-600" : "text-muted-foreground"
        )}>
            <Icon className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
            <span className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
                {count.toLocaleString()}
            </span>
            {!compact && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                    {label}
                </span>
            )}
        </div>
    );

    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
                <StatItem icon={Eye} count={viewsCount} label="views" />
                <StatItem icon={MessageCircle} count={commentsCount} label="comments" />
                <StatItem
                    icon={CheckCircle2}
                    count={verificationsCount}
                    label="verified"
                    verified={isVerified}
                />
            </div>

            <div className="flex items-center gap-1">
                {onComment && (
                    <Button
                        variant="ghost"
                        size={compact ? "sm" : "default"}
                        onClick={onComment}
                        className="gap-1"
                    >
                        <MessageCircle className="w-4 h-4" />
                        {!compact && "Comment"}
                    </Button>
                )}
                {onShare && (
                    <Button
                        variant="ghost"
                        size={compact ? "sm" : "default"}
                        onClick={onShare}
                    >
                        <Share2 className="w-4 h-4" />
                        {!compact && "Share"}
                    </Button>
                )}
                {onBookmark && (
                    <Button
                        variant="ghost"
                        size={compact ? "sm" : "default"}
                        onClick={onBookmark}
                        className={isBookmarked ? "text-primary" : ""}
                    >
                        <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                    </Button>
                )}
            </div>
        </div>
    );
}
