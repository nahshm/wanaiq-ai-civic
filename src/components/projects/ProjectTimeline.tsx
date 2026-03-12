import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import {
    CheckCircle2, Image as ImageIcon, FileText, Rocket, MapPin,
    TrendingUp, AlertTriangle, Clock, DollarSign, ChevronDown,
    ChevronUp, MessageSquarePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTimelineTheme } from '@/constants/timelineThemes';

interface TimelineUpdate {
    id: string;
    title: string;
    description: string;
    update_type: string;
    created_at: string;
    media_urls: string[] | null;
    community_verified: boolean;
    author: {
        id: string;
        username: string;
        avatar_url: string | null;
    } | null;
}

interface ProjectTimelineProps {
    updates: TimelineUpdate[];
    projectCreatedAt: string;
    projectTitle: string;
    projectDescription: string;
    projectLocation?: string;
    projectBudget?: number;
    projectCategory?: string;
    projectProgress?: number;
    onMediaClick?: (urls: string[]) => void;
}

const updateTypeConfig: Record<string, { color: string; dotColor: string; label: string; icon: React.ElementType }> = {
    progress: { color: 'bg-blue-500', dotColor: 'bg-blue-500', label: 'Progress Update', icon: TrendingUp },
    milestone: { color: 'bg-green-500', dotColor: 'bg-green-500', label: 'Milestone', icon: CheckCircle2 },
    issue: { color: 'bg-red-500', dotColor: 'bg-red-500', label: 'Issue Reported', icon: AlertTriangle },
    completion: { color: 'bg-purple-500', dotColor: 'bg-purple-500', label: 'Completion', icon: CheckCircle2 },
    delay: { color: 'bg-yellow-500', dotColor: 'bg-yellow-500', label: 'Delay', icon: Clock },
    created: { color: 'bg-primary', dotColor: 'bg-primary', label: 'Project Created', icon: Rocket }
};

const DEFAULT_CONFIG = { color: 'bg-gray-500', dotColor: 'bg-gray-500', label: 'Update', icon: FileText };

// ─── Universal Project Roadmap ────────────────────────────────────────
function ProjectRoadmap({
    allEntries,
    progress,
    theme
}: {
    allEntries: TimelineUpdate[];
    progress: number;
    theme: ReturnType<typeof getTimelineTheme>;
}) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // Show all entries (up to 8) on the roadmap, sorted old→new
    const roadmapEntries = [...allEntries]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(0, 8);

    if (roadmapEntries.length === 0) return null;

    return (
        <div className="mb-6 p-4 sm:p-6 rounded-xl border bg-gradient-to-br from-muted/60 via-background to-muted/40 dark:from-muted/20 dark:via-background dark:to-muted/10">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    Project Roadmap
                </h4>
                <Badge variant="outline" className="text-xs font-mono">
                    {progress}% complete
                </Badge>
            </div>

            {/* ── Desktop: Horizontal layout ── */}
            <div className="hidden sm:block relative">
                {/* Track */}
                <div className="absolute top-5 left-4 right-4 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                            width: `${progress}%`,
                            backgroundImage: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                        }}
                    />
                </div>

                {/* Dots */}
                <div className="relative flex justify-between items-start px-1">
                    {roadmapEntries.map((entry, idx) => {
                        const config = updateTypeConfig[entry.update_type] || DEFAULT_CONFIG;
                        const Icon = config.icon;
                        const position = roadmapEntries.length > 1
                            ? (idx / (roadmapEntries.length - 1)) * 100
                            : 50;
                        const isReached = position <= progress;
                        const isHovered = hoveredId === entry.id;

                        return (
                            <div
                                key={entry.id}
                                className="flex flex-col items-center relative group"
                                style={{ flex: 1 }}
                                onMouseEnter={() => setHoveredId(entry.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {/* Dot */}
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-[3px] z-10 transition-all duration-300 cursor-pointer",
                                    isReached
                                        ? "border-background shadow-lg scale-100"
                                        : "border-muted bg-muted-foreground/10 scale-90",
                                    isHovered && "scale-110"
                                )} style={isReached ? {
                                    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                                    boxShadow: `0 4px 14px ${theme.colors.primary}40`
                                } : undefined}>
                                    <Icon className={cn(
                                        "w-4.5 h-4.5",
                                        isReached ? "text-white" : "text-muted-foreground/60"
                                    )} />
                                </div>

                                {/* Label */}
                                <div className="text-center mt-2 max-w-[90px]">
                                    <p className={cn(
                                        "text-[11px] font-medium leading-tight line-clamp-2 transition-colors",
                                        isReached ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {entry.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                        {format(new Date(entry.created_at), 'MMM d')}
                                    </p>
                                </div>

                                {/* Tooltip on hover */}
                                {isHovered && (
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                                        <div className="bg-popover border rounded-lg shadow-xl px-3 py-2 min-w-[180px] max-w-[240px]">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className={cn("w-2 h-2 rounded-full", config.dotColor)} />
                                                <span className="text-xs font-medium text-popover-foreground">{config.label}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{entry.description}</p>
                                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                                                {format(new Date(entry.created_at), 'MMM d, yyyy · h:mm a')}
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 bg-popover border-b border-r rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Mobile: Vertical compact layout ── */}
            <div className="sm:hidden space-y-3">
                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                            width: `${progress}%`,
                            backgroundImage: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                        }}
                    />
                </div>

                {/* Compact list */}
                {roadmapEntries.slice(-4).map((entry) => {
                    const config = updateTypeConfig[entry.update_type] || DEFAULT_CONFIG;
                    const Icon = config.icon;
                    const position = roadmapEntries.indexOf(entry);
                    const isReached = roadmapEntries.length > 1
                        ? (position / (roadmapEntries.length - 1)) * 100 <= progress
                        : true;

                    return (
                        <div key={entry.id} className="flex items-center gap-3">
                            <div className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                                isReached ? "" : "bg-muted"
                            )} style={isReached ? {
                                backgroundImage: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                            } : undefined}>
                                <Icon className={cn(
                                    "w-3.5 h-3.5",
                                    isReached ? "text-white" : "text-muted-foreground/60"
                                )} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-xs font-medium truncate",
                                    isReached ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {entry.title}
                                </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
                                {format(new Date(entry.created_at), 'MMM d')}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Timeline Component ──────────────────────────────────────────
export function ProjectTimeline({
    updates,
    projectCreatedAt,
    projectTitle,
    projectDescription,
    projectLocation,
    projectBudget,
    projectCategory,
    projectProgress = 0,
    onMediaClick
}: ProjectTimelineProps) {
    const theme = getTimelineTheme(projectCategory);
    const [expanded, setExpanded] = useState(false);
    const INITIAL_SHOW = 5;

    // Create initial project creation entry
    const creationEntry: TimelineUpdate = {
        id: 'creation',
        title: 'Project Announced',
        description: projectDescription,
        update_type: 'created',
        created_at: projectCreatedAt,
        media_urls: null,
        community_verified: true,
        author: null
    };

    // Combine: newest first for the list, but roadmap gets its own sort
    const allEntries = [creationEntry, ...updates];

    const visibleEntries = expanded ? allEntries : allEntries.slice(0, INITIAL_SHOW);
    const hasMore = allEntries.length > INITIAL_SHOW;

    return (
        <div>
            {/* Progress Header */}
            <div className="mb-6 p-4 rounded-lg border bg-gradient-to-r from-muted/50 to-muted/30">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {allEntries.length - 1} update{allEntries.length - 1 !== 1 ? 's' : ''}
                        </Badge>
                        <span className="text-sm font-bold" style={{ color: theme.colors.primary }}>
                            {projectProgress}%
                        </span>
                    </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                        className="h-2.5 rounded-full transition-all duration-700 ease-out"
                        style={{
                            width: `${projectProgress}%`,
                            backgroundImage: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                        }}
                    />
                </div>
            </div>

            {/* Roadmap */}
            {theme.showRoadmap && (
                <ProjectRoadmap
                    allEntries={allEntries}
                    progress={projectProgress}
                    theme={theme}
                />
            )}

            {/* Timeline Entries */}
            {allEntries.length <= 1 ? (
                /* Empty state — only creation entry exists */
                <div className="text-center py-10 px-4 border-2 border-dashed rounded-xl">
                    <MessageSquarePlus className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <h4 className="text-sm font-semibold text-foreground mb-1">No updates yet</h4>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Be the first to share a progress update, report an issue, or verify this project.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleEntries.map((update, index) => {
                        const config = updateTypeConfig[update.update_type] || DEFAULT_CONFIG;
                        const Icon = config.icon;
                        const isCreation = update.id === 'creation';
                        const isFirst = index === 0;

                        return (
                            <Card
                                key={update.id}
                                className={cn(
                                    "relative transition-all duration-200 hover:shadow-md overflow-hidden",
                                    "border-l-4",
                                    isFirst && "shadow-sm",
                                    index % 2 === 1 && "bg-muted/20"
                                )}
                                style={{ borderLeftColor: theme.colors.primary }}
                            >
                                {/* Timeline connector line */}
                                {index < visibleEntries.length - 1 && (
                                    <div
                                        className="absolute left-[1.85rem] top-14 bottom-0 w-px -mb-3 z-0"
                                        style={{ backgroundColor: theme.colors.accent + '30' }}
                                    />
                                )}

                                <CardHeader className="pb-3 pt-4 px-4">
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div
                                            className={cn(
                                                "relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                                            )}
                                            style={{
                                                backgroundImage: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                                            }}
                                        >
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Badge row */}
                                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                <Badge
                                                    variant="outline"
                                                    className="text-white border-0 text-[11px] px-2 py-0.5 shadow-sm"
                                                    style={{
                                                        backgroundImage: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                                                    }}
                                                >
                                                    {config.label}
                                                </Badge>
                                                {update.community_verified && (
                                                    <Badge variant="default" className="bg-green-600 gap-1 text-[11px] px-2 py-0.5">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Verified
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground ml-auto flex-shrink-0" title={format(new Date(update.created_at), 'PPpp')}>
                                                    {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <CardTitle className="text-base mb-1.5">{update.title}</CardTitle>

                                            {/* Description */}
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                                {update.description}
                                            </p>

                                            {/* Creation entry extra details */}
                                            {isCreation && (projectLocation || projectBudget) && (
                                                <div
                                                    className="mt-3 flex flex-wrap gap-x-4 gap-y-1 p-3 rounded-lg text-sm"
                                                    style={{
                                                        backgroundImage: `linear-gradient(135deg, ${theme.colors.primary}10, ${theme.colors.accent}10)`
                                                    }}
                                                >
                                                    {projectLocation && (
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} />
                                                            <span className="font-medium text-xs">{projectLocation}</span>
                                                        </span>
                                                    )}
                                                    {projectBudget && (
                                                        <span className="flex items-center gap-1.5">
                                                            <DollarSign className="w-3.5 h-3.5 text-green-600" />
                                                            <span className="font-medium text-xs">
                                                                KES {projectBudget >= 1e6 ? `${(projectBudget / 1e6).toFixed(1)}M` : projectBudget.toLocaleString()}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Media thumbnails */}
                                            {update.media_urls && update.media_urls.length > 0 && (
                                                <div className="mt-3 flex gap-2 flex-wrap">
                                                    {update.media_urls.slice(0, 4).map((url, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => onMediaClick?.(update.media_urls!)}
                                                            className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted hover:ring-2 transition-all group"
                                                            style={{ outlineColor: theme.colors.primary }}
                                                        >
                                                            <img
                                                                src={url}
                                                                alt={`Update media ${idx + 1}`}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                        </button>
                                                    ))}
                                                    {update.media_urls.length > 4 && (
                                                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-xs font-medium border-2 border-dashed">
                                                            <div className="text-center">
                                                                <ImageIcon className="w-5 h-5 mx-auto mb-0.5 opacity-50" />
                                                                +{update.media_urls.length - 4}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Author */}
                                            {update.author && (
                                                <div className="mt-2.5 flex items-center gap-2 text-xs">
                                                    <Avatar className="w-5 h-5">
                                                        <AvatarImage src={update.author.avatar_url || undefined} />
                                                        <AvatarFallback className="text-[10px]">
                                                            {update.author.username.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-muted-foreground">
                                                        by <span className="font-medium text-foreground">{update.author.username}</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        );
                    })}

                    {/* Show More / Less */}
                    {hasMore && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-muted-foreground hover:text-foreground gap-1.5"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    Show less
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    Show {allEntries.length - INITIAL_SHOW} more update{allEntries.length - INITIAL_SHOW !== 1 ? 's' : ''}
                                </>
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
