import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Calendar, TrendingUp, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MediaCarousel } from './MediaCarousel';
import { EntityList } from './EntityBadge';
import { EngagementBar } from './EngagementBar';
import { PROJECT_CATEGORIES_2026 } from '@/constants/projectConstants';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/clipboard-utils';

interface ProjectCardProps {
    project: any; // Will be typed from useProjects hook
    compact?: boolean;
    onClick?: () => void;
}

const statusConfig = {
    planned: { icon: Clock, color: 'bg-gray-500', label: 'Planned' },
    ongoing: { icon: TrendingUp, color: 'bg-blue-500', label: 'Ongoing' },
    completed: { icon: CheckCircle, color: 'bg-green-500', label: 'Completed' },
    cancelled: { icon: XCircle, color: 'bg-red-500', label: 'Cancelled' },
    stalled: { icon: AlertTriangle, color: 'bg-yellow-500', label: 'Stalled' }
};

const priorityConfig = {
    low: { color: 'bg-gray-400', label: 'Low' },
    medium: { color: 'bg-blue-400', label: 'Medium' },
    high: { color: 'bg-orange-400', label: 'High' },
    critical: { color: 'bg-red-400', label: 'Critical' }
};

export function ProjectCard({ project, compact = false, onClick }: ProjectCardProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(`/projects/${project.id}`);
        }
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        copyToClipboard(`${window.location.origin}/projects/${project.id}`, 'Link copied to clipboard');
    };

    const handleComment = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/projects/${project.id}#comments`);
    };

    const category = PROJECT_CATEGORIES_2026.find(c => c.value === project.category);
    const StatusIcon = statusConfig[project.status as keyof typeof statusConfig]?.icon || Clock;

    const formatCurrency = (amount: number | null) => {
        if (!amount) return 'N/A';
        if (amount >= 1e9) return `KES ${(amount / 1e9).toFixed(1)}B`;
        if (amount >= 1e6) return `KES ${(amount / 1e6).toFixed(1)}M`;
        return `KES ${amount.toLocaleString()}`;
    };

    const formatDate = (date: string | null) => {
        if (!date) return 'TBD';
        return new Date(date).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' });
    };

    // Determine location display
    const getLocationDisplay = () => {
        if (project.project_level === 'national') return '🇰🇪 National';
        if (project.ward) return `${project.ward} Ward`;
        if (project.constituency) return `${project.constituency} Constituency`;
        if (project.county) return `${project.county} County`;
        return 'Location TBD';
    };

    return (
        <Card
            className={cn(
                "group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden",
                "border-2 hover:border-primary/50"
            )}
            onClick={handleClick}
        >
            {/* Media Hero */}
            <MediaCarousel
                media={project.media_urls || []}
                alt={project.title}
                height={compact ? "h-48" : "h-64"}
                aspectRatio="16/9"
            />

            <CardHeader className="pb-3 space-y-3">
                {/* Category & Status Row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        {category && (
                            <Badge variant="outline" className="gap-1 font-medium">
                                <span>{category.icon}</span>
                                <span className="hidden sm:inline">{category.label}</span>
                            </Badge>
                        )}
                        <Badge className={cn(statusConfig[project.status as keyof typeof statusConfig]?.color, "text-white gap-1")}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[project.status as keyof typeof statusConfig]?.label || project.status}
                        </Badge>
                    </div>

                    {project.is_verified && (
                        <Badge variant="default" className="bg-green-600 gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                        </Badge>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                    {project.title}
                </h3>

                {/* Location & Progress */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{getLocationDisplay()}</span>
                    </div>
                    <span className="font-semibold">{project.progress_percentage}%</span>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Description */}
                {project.description && !compact && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                    </p>
                )}

                {/* Accountability Section */}
                <div className="space-y-2">
                    <EntityList
                        primaryType={project.primary_responsible_type}
                        primaryEntity={
                            project.primary_responsible_type === 'official'
                                ? project.primary_official
                                : project.primary_institution
                        }
                        collaboratingOfficials={project.collaborating_officials || []}
                        collaboratingInstitutions={project.collaborating_institutions || []}
                        maxCollaborators={2}
                        showLabel={false}
                    />
                </div>

                {/* Budget & Timeline */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <div>
                            <div className="font-semibold">{formatCurrency(project.budget_allocated)}</div>
                            <div className="text-xs text-muted-foreground">Budget</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <div>
                            <div className="font-semibold">{formatDate(project.planned_completion_date)}</div>
                            <div className="text-xs text-muted-foreground">Deadline</div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                    <Progress value={project.progress_percentage} className="h-2" />
                </div>

                {/* Engagement Bar */}
                <div className="pt-2 border-t">
                    <EngagementBar
                        viewsCount={project.views_count || 0}
                        commentsCount={project.comments_count || 0}
                        verificationsCount={project.verifications_count || 0}
                        isVerified={project.is_verified}
                        onComment={() => handleComment({} as React.MouseEvent)}
                        onShare={() => handleShare({} as React.MouseEvent)}
                        compact
                    />
                </div>

                {/* View Details Button */}
                <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                >
                    View Full Details →
                </Button>
            </CardContent>
        </Card>
    );
}

// Error boundary wrapper
export function ProjectCardWithErrorBoundary(props: ProjectCardProps) {
    try {
        return <ProjectCard {...props} />;
    } catch (error) {
        console.error('Error rendering ProjectCard:', error);
        return (
            <Card className="p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load project card</p>
            </Card>
        );
    }
}
