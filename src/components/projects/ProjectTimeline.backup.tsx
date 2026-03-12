import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, Image as ImageIcon, FileText, Rocket, MapPin, TrendingUp, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    onMediaClick?: (urls: string[]) => void;
}

const updateTypeConfig = {
    progress: { color: 'bg-blue-500', label: 'Progress Update', icon: TrendingUp },
    milestone: { color: 'bg-green-500', label: 'Milestone', icon: CheckCircle2 },
    issue: { color: 'bg-red-500', label: 'Issue Reported', icon: AlertTriangle },
    completion: { color: 'bg-purple-500', label: 'Completion', icon: CheckCircle2 },
    delay: { color: 'bg-yellow-500', label: 'Delay', icon: Clock },
    created: { color: 'bg-primary', label: 'Project Created', icon: Rocket }
};

export function ProjectTimeline({
    updates,
    projectCreatedAt,
    projectTitle,
    projectDescription,
    projectLocation,
    projectBudget,
    onMediaClick
}: ProjectTimelineProps) {
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

    // Combine creation entry with updates
    const allEntries = [creationEntry, ...updates];

    return (
        <div className="space-y-4">
            {allEntries.map((update, index) => {
                const config = updateTypeConfig[update.update_type as keyof typeof updateTypeConfig] || {
                    color: 'bg-gray-500',
                    label: 'Update',
                    icon: FileText
                };
                const Icon = config.icon;
                const isCreation = update.id === 'creation';

                return (
                    <Card key={update.id} className="relative">
                        {/* Timeline connector */}
                        {index < allEntries.length - 1 && (
                            <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border -mb-4 z-0" />
                        )}

                        <CardHeader className="pb-3">
                            <div className="flex items-start gap-4">
                                {/* Timeline dot with icon */}
                                <div className={cn(
                                    "relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                                    config.color
                                )}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                        <Badge variant="outline" className={cn("text-white", config.color)}>
                                            {config.label}
                                        </Badge>
                                        {update.community_verified && (
                                            <Badge variant="default" className="bg-green-600 gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Verified
                                            </Badge>
                                        )}
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(update.created_at), 'MMM d, yyyy · h:mm a')}
                                        </span>
                                    </div>

                                    <CardTitle className="text-lg mb-2">{update.title}</CardTitle>

                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {update.description}
                                    </p>

                                    {/* Project details for creation entry */}
                                    {isCreation && (
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
                                            {projectLocation && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                    <span className="font-medium">{projectLocation}</span>
                                                </div>
                                            )}
                                            {projectBudget && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <DollarSign className="w-4 h-4 text-green-600" />
                                                    <span className="font-medium">
                                                        KES {projectBudget >= 1e6 ? `${(projectBudget / 1e6).toFixed(1)}M` : projectBudget.toLocaleString()}
                                                    </span>
                                                </div>
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
                                                    className="relative w-24 h-24 rounded overflow-hidden bg-muted hover:ring-2 ring-primary transition-all group"
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
                                                <div className="w-24 h-24 rounded bg-muted flex items-center justify-center text-sm font-medium border-2 border-dashed">
                                                    <div className="text-center">
                                                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                                        +{update.media_urls.length - 4}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Author */}
                                    {update.author && (
                                        <div className="mt-3 flex items-center gap-2 text-sm">
                                            <Avatar className="w-6 h-6">
                                                <AvatarImage src={update.author.avatar_url || undefined} />
                                                <AvatarFallback>
                                                    {update.author.username.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-muted-foreground">
                                                Posted by <span className="font-medium text-foreground">{update.author.username}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                );
            })}
        </div>
    );
}
