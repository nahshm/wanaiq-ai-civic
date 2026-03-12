import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, MessageSquare, Zap, Trophy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserActivity, UserActivityItem } from '../../hooks/useUserActivity';
import { Link } from 'react-router-dom';

interface ActivityTimelineProps {
    userId: string;
}

const ActivityIcon: React.FC<{ type: UserActivityItem['type'] }> = ({ type }) => {
    switch (type) {
        case 'post':
            return <FileText className="w-4 h-4" />;
        case 'comment':
            return <MessageSquare className="w-4 h-4" />;
        case 'civic_action':
            return <Zap className="w-4 h-4" />;
        case 'badge':
            return <Trophy className="w-4 h-4" />;
    }
};

const ActivityItemComponent: React.FC<{ item: UserActivityItem }> = ({ item }) => {
    const iconColors = {
        post: 'text-blue-500 bg-blue-500/10',
        comment: 'text-green-500 bg-green-500/10',
        civic_action: 'text-orange-500 bg-orange-500/10',
        badge: 'text-amber-500 bg-amber-500/10',
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="flex gap-3 group">
            {/* Icon */}
            <div className={cn(
                'flex-shrink-0 mt-1 p-2 rounded-lg',
                iconColors[item.type]
            )}>
                <ActivityIcon type={item.type} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        {item.link ? (
                            <Link to={item.link} className="font-medium hover:underline flex items-center gap-1">
                                <span className="truncate">{item.title}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        ) : (
                            <p className="font-medium truncate">{item.title}</p>
                        )}
                        {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                {item.description}
                            </p>
                        )}
                        {item.metadata?.status && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs mt-1 bg-muted">
                                {item.metadata.status}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                        {timeAgo(item.created_at)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ userId }) => {
    const { data: activities, isLoading } = useUserActivity(userId);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {activities.map(item => (
                <ActivityItemComponent key={item.id} item={item} />
            ))}
        </div>
    );
};
