import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Clock, XCircle, Pause } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectHealthProps {
    stalled: number;
    active: number;
    completed: number;
    cancelled?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

interface StatusChipProps {
    count: number;
    label: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ count, label, icon, color, bgColor }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md',
                bgColor.replace('text-', 'bg-').replace('500', '500/10'),
            )}>
                <span className={color}>{icon}</span>
                <span className={cn('font-bold', color)}>{count}</span>
            </div>
        </TooltipTrigger>
        <TooltipContent>
            <span>{count} {label}</span>
        </TooltipContent>
    </Tooltip>
);

/**
 * ProjectHealth - Visual display of project status distribution
 */
export const ProjectHealth: React.FC<ProjectHealthProps> = ({
    stalled,
    active,
    completed,
    cancelled = 0,
    size = 'md',
    className,
}) => {
    const total = stalled + active + completed + cancelled;

    const iconSize = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    }[size];

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Project Health</span>
                <span className="text-sm text-muted-foreground">
                    {total} Total
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {stalled > 0 && (
                    <StatusChip
                        count={stalled}
                        label="Stalled"
                        icon={<Pause className={iconSize} />}
                        color="text-red-500"
                        bgColor="bg-red-500/10"
                    />
                )}

                <StatusChip
                    count={active}
                    label="Active"
                    icon={<Clock className={iconSize} />}
                    color="text-yellow-500"
                    bgColor="bg-yellow-500/10"
                />

                <StatusChip
                    count={completed}
                    label="Completed"
                    icon={<CheckCircle className={iconSize} />}
                    color="text-green-500"
                    bgColor="bg-green-500/10"
                />

                {cancelled > 0 && (
                    <StatusChip
                        count={cancelled}
                        label="Cancelled"
                        icon={<XCircle className={iconSize} />}
                        color="text-gray-500"
                        bgColor="bg-gray-500/10"
                    />
                )}
            </div>

            {/* Health indicator */}
            {total > 0 && (
                <div className="flex items-center gap-2 text-xs">
                    {stalled > active ? (
                        <span className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="w-3 h-3" />
                            Attention needed
                        </span>
                    ) : completed > stalled ? (
                        <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle className="w-3 h-3" />
                            Good progress
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-yellow-500">
                            <Clock className="w-3 h-3" />
                            Moderate progress
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectHealth;
