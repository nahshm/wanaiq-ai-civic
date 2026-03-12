import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, HelpCircle } from 'lucide-react';

interface PromiseMeterProps {
    total: number;
    kept: number;
    broken: number;
    inProgress: number;
    size?: 'sm' | 'md' | 'lg';
    showDetails?: boolean;
    className?: string;
}

/**
 * PromiseMeter - Visual progress bar showing promise delivery status
 */
export const PromiseMeter: React.FC<PromiseMeterProps> = ({
    total,
    kept,
    broken,
    inProgress,
    size = 'md',
    showDetails = true,
    className,
}) => {
    const percentKept = total > 0 ? Math.round((kept / total) * 100) : 0;
    const percentBroken = total > 0 ? Math.round((broken / total) * 100) : 0;
    const percentInProgress = total > 0 ? Math.round((inProgress / total) * 100) : 0;

    const heightClass = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
    }[size];

    const getStatusColor = (): string => {
        if (percentKept >= 70) return 'text-green-500';
        if (percentKept >= 50) return 'text-yellow-500';
        if (percentKept >= 30) return 'text-orange-500';
        return 'text-red-500';
    };

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Promise Meter</span>
                <span className={cn('font-bold', getStatusColor())}>
                    {percentKept}% Kept
                </span>
            </div>

            {/* Stacked progress bar */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        'w-full bg-muted rounded-full overflow-hidden flex',
                        heightClass
                    )}>
                        {/* Kept (Green) */}
                        <div
                            className="bg-green-500 transition-all duration-500"
                            style={{ width: `${percentKept}%` }}
                        />
                        {/* In Progress (Yellow) */}
                        <div
                            className="bg-yellow-500 transition-all duration-500"
                            style={{ width: `${percentInProgress}%` }}
                        />
                        {/* Broken (Red) */}
                        <div
                            className="bg-red-500 transition-all duration-500"
                            style={{ width: `${percentBroken}%` }}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-green-500" />
                            <span>Kept: {kept}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-yellow-500" />
                            <span>In Progress: {inProgress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-red-500" />
                            <span>Broken: {broken}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-muted" />
                            <span>Pending: {total - kept - broken - inProgress}</span>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>

            {/* Detail chips */}
            {showDetails && (
                <div className="flex flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="w-3 h-3" />
                        <span>{kept} Kept</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Clock className="w-3 h-3" />
                        <span>{inProgress} In Progress</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-500">
                        <XCircle className="w-3 h-3" />
                        <span>{broken} Broken</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromiseMeter;
