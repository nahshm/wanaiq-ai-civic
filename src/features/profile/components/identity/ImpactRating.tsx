import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImpactRatingProps {
    rating: number;     // 0-100
    previousRating?: number;  // For trend display
    showBreakdown?: boolean;
    breakdown?: {
        actions: number;
        resolution: number;
        community: number;
        reliability: number;
    };
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

// Rating tier styling
const getRatingStyle = (rating: number): { color: string; bgColor: string; label: string } => {
    if (rating >= 80) return { color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Excellent' };
    if (rating >= 60) return { color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Good' };
    if (rating >= 40) return { color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Average' };
    if (rating >= 20) return { color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'Needs Work' };
    return { color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Getting Started' };
};

const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
};

/**
 * ImpactRating - Displays the user's civic impact score (0-100)
 * Large, prominent number with optional breakdown
 */
export const ImpactRating: React.FC<ImpactRatingProps> = ({
    rating,
    previousRating,
    showBreakdown = false,
    breakdown,
    size = 'lg',
    className,
}) => {
    const style = getRatingStyle(rating);
    const trend = previousRating !== undefined ? rating - previousRating : 0;

    const ratingDisplay = (
        <div className={cn(
            'relative inline-flex flex-col items-center justify-center p-4 rounded-2xl',
            style.bgColor,
            className
        )}>
            {/* Main Rating */}
            <div className="flex items-end gap-2">
                <span className={cn(
                    'font-bold tracking-tight',
                    style.color,
                    sizeClasses[size]
                )}>
                    {rating}
                </span>
                <span className={cn(
                    'text-muted-foreground mb-2',
                    size === 'xl' ? 'text-xl' : 'text-sm'
                )}>
                    /100
                </span>
            </div>

            {/* Trend Indicator */}
            {previousRating !== undefined && (
                <div className={cn(
                    'flex items-center gap-1 text-sm',
                    trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'
                )}>
                    {trend > 0 ? <TrendingUp className="w-4 h-4" /> :
                        trend < 0 ? <TrendingDown className="w-4 h-4" /> :
                            <Minus className="w-4 h-4" />}
                    <span>{trend > 0 ? '+' : ''}{trend.toFixed(0)}</span>
                </div>
            )}

            {/* Label */}
            <span className={cn('text-xs font-medium mt-1', style.color)}>
                {style.label}
            </span>
        </div>
    );

    if (showBreakdown && breakdown) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    {ratingDisplay}
                </TooltipTrigger>
                <TooltipContent className="w-64 p-4">
                    <h4 className="font-semibold mb-3">Impact Breakdown</h4>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Actions Taken</span>
                                <span>{breakdown.actions}/30</span>
                            </div>
                            <Progress value={(breakdown.actions / 30) * 100} className="h-2" />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Issues Resolved</span>
                                <span>{breakdown.resolution}/30</span>
                            </div>
                            <Progress value={(breakdown.resolution / 30) * 100} className="h-2" />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Community Support</span>
                                <span>{breakdown.community}/25</span>
                            </div>
                            <Progress value={(breakdown.community / 25) * 100} className="h-2" />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Reliability</span>
                                <span>{breakdown.reliability}/15</span>
                            </div>
                            <Progress value={(breakdown.reliability / 15) * 100} className="h-2" />
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        );
    }

    return ratingDisplay;
};

export default ImpactRating;
