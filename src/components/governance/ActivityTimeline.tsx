import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getActivityTypeConfig, formatRelativeDate } from './officeConstants';

interface ActivityEntry {
    id: string;
    activity_type: string;
    title: string;
    description: string | null;
    metadata: any;
    reference_id: string | null;
    reference_type: string | null;
    created_at: string | null;
}

interface ActivityTimelineProps {
    entries: ActivityEntry[];
    isLoading?: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
    filterType?: string;
    onFilterChange?: (type: string) => void;
}

const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'promise', label: '🎯 Promises' },
    { value: 'question', label: '💬 Q&A' },
    { value: 'project', label: '🏗️ Projects' },
];

export function ActivityTimeline({
    entries = [],
    isLoading = false,
    onLoadMore,
    hasMore = false,
    filterType = 'all',
    onFilterChange,
}: ActivityTimelineProps) {
    const filteredEntries = filterType === 'all'
        ? entries
        : entries.filter(e => {
            if (filterType === 'promise') return e.activity_type.startsWith('promise');
            if (filterType === 'question') return e.activity_type.startsWith('question');
            if (filterType === 'project') return e.activity_type.startsWith('project');
            return true;
        });

    return (
        <div className="space-y-4">
            {/* Filter chips */}
            {onFilterChange && (
                <div className="flex gap-2 flex-wrap">
                    {FILTER_OPTIONS.map(opt => (
                        <Badge
                            key={opt.value}
                            variant={filterType === opt.value ? 'default' : 'outline'}
                            className="cursor-pointer transition-colors hover:bg-primary/10"
                            onClick={() => onFilterChange(opt.value)}
                        >
                            {opt.label}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Timeline */}
            {filteredEntries.length === 0 && !isLoading ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No activity yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />

                    <div className="space-y-4">
                        {filteredEntries.map((entry, index) => {
                            const config = getActivityTypeConfig(entry.activity_type);
                            return (
                                <div key={entry.id} className="relative pl-10">
                                    {/* Dot */}
                                    <div
                                        className={`absolute left-[8px] top-3 h-[16px] w-[16px] rounded-full border-2 border-background ${config.color} flex items-center justify-center text-[8px]`}
                                    >
                                        <span className="text-white text-[8px] leading-none">{config.icon}</span>
                                    </div>

                                    <Card className="border-border/50 hover:border-border transition-colors">
                                        <CardContent className="py-3 px-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] px-1.5 py-0 shrink-0"
                                                        >
                                                            {config.label}
                                                        </Badge>
                                                        {entry.created_at && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatRelativeDate(entry.created_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium truncate">{entry.title}</p>
                                                    {entry.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {entry.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Load More */}
            {hasMore && onLoadMore && (
                <div className="text-center pt-2">
                    <button
                        onClick={onLoadMore}
                        disabled={isLoading}
                        className="text-sm text-primary hover:underline disabled:opacity-50"
                    >
                        {isLoading ? 'Loading…' : 'Load more activity'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default ActivityTimeline;
