import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Sentiment } from '@/types';
import { cn } from '@/lib/utils';

interface SentimentBarProps {
    sentiment: Sentiment;
    showLabel?: boolean;
    className?: string;
}

const SentimentBar: React.FC<SentimentBarProps> = ({
    sentiment,
    showLabel = true,
    className
}) => {
    const total = sentiment.positive + sentiment.neutral + sentiment.negative;

    if (total === 0) return null;

    const positivePercent = Math.round((sentiment.positive / total) * 100);
    const neutralPercent = Math.round((sentiment.neutral / total) * 100);
    const negativePercent = Math.round((sentiment.negative / total) * 100);

    return (
        <div className={cn("flex items-center gap-2 text-xs", className)}>
            {showLabel && (
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex">
                <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${positivePercent}%` }}
                    title={`Positive: ${positivePercent}%`}
                />
                <div
                    className="h-full bg-slate-300 transition-all"
                    style={{ width: `${neutralPercent}%` }}
                    title={`Neutral: ${neutralPercent}%`}
                />
                <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${negativePercent}%` }}
                    title={`Negative: ${negativePercent}%`}
                />
            </div>
            <span className="text-muted-foreground tabular-nums whitespace-nowrap">
                {positivePercent}% Positive
            </span>
        </div>
    );
};

export default SentimentBar;
