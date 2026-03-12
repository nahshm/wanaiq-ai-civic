import React, { useState } from 'react';
import { Verification, VerificationStatus } from '@/types';
import { CheckCircle, AlertTriangle, XCircle, Info, ThumbsUp, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VerificationPanelProps {
    verification: Verification | null;
    onVote?: (type: 'true' | 'misleading' | 'outdated') => void;
    isExpanded?: boolean;
    isLoading?: boolean;
}

const VerificationPanel: React.FC<VerificationPanelProps> = ({
    verification,
    onVote,
    isExpanded = false,
    isLoading = false
}) => {
    const [expanded, setExpanded] = useState(isExpanded);

    // If no verification exists yet, show a simple "Verify this" button
    if (!verification) {
        return (
            <div className="mt-3">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    disabled={isLoading}
                >
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span className="font-semibold text-sm">
                            Community Verification
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">No votes yet</span>
                        <Info className="h-3 w-3" />
                    </div>
                </button>

                {expanded && (
                    <Card className="rounded-t-none border-t-0 bg-slate-50 text-slate-600 border-slate-200">
                        <CardContent className="p-3 space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Be the first to verify this content. Cast your vote to help the community determine accuracy.
                            </p>

                            <div className="flex items-center justify-between border-t pt-3">
                                <span className="text-xs text-muted-foreground">Start verification:</span>
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => onVote?.('true')}
                                        disabled={isLoading}
                                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                        title="Mark as Accurate"
                                    >
                                        <ThumbsUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => onVote?.('misleading')}
                                        disabled={isLoading}
                                        className="h-8 w-8 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                                        title="Mark as Misleading"
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => onVote?.('outdated')}
                                        disabled={isLoading}
                                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        title="Mark as Outdated"
                                    >
                                        <Clock className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    const getStatusConfig = (status: VerificationStatus) => {
        switch (status) {
            case 'VERIFIED':
                return {
                    variant: 'default' as const,
                    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
                    icon: CheckCircle
                };
            case 'DISPUTED':
                return {
                    variant: 'secondary' as const,
                    className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
                    icon: AlertTriangle
                };
            case 'DEBUNKED':
                return {
                    variant: 'destructive' as const,
                    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
                    icon: XCircle
                };
            case 'PENDING':
            default:
                return {
                    variant: 'outline' as const,
                    className: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
                    icon: Clock
                };
        }
    };

    const config = getStatusConfig(verification.status);
    const StatusIcon = config.icon;

    return (
        <div className="mt-3">
            {/* Summary Header - Clickable Badge */}
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    'w-full flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors',
                    config.className,
                    expanded && 'rounded-b-none border-b-0'
                )}
                disabled={isLoading}
            >
                <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    <span className="font-semibold text-sm">
                        Community Verification: {verification.status}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="font-bold">{verification.truthScore}%</span>
                    <span className="text-muted-foreground">Truth Score</span>
                    <Info className="h-3 w-3" />
                </div>
            </button>

            {/* Expanded Detail Panel */}
            {expanded && (
                <Card className={cn(
                    "rounded-t-none border-t-0 animate-in fade-in slide-in-from-top-1",
                    config.className
                )}>
                    <CardContent className="p-3 space-y-3">
                        {/* Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Based on <span className="text-foreground font-bold">{verification.totalVotes}</span> community votes.
                            This content has been reviewed by the community.
                        </p>

                        {/* Voting Progress Bars */}
                        <div className="space-y-2">
                            {/* Accurate */}
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-20 text-emerald-600 font-medium">Accurate</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all"
                                        style={{ width: `${(verification.breakdown.true / Math.max(verification.totalVotes, 1)) * 100}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right text-muted-foreground tabular-nums">
                                    {verification.breakdown.true}
                                </span>
                            </div>

                            {/* Misleading */}
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-20 text-yellow-600 font-medium">Misleading</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-500 transition-all"
                                        style={{ width: `${(verification.breakdown.misleading / Math.max(verification.totalVotes, 1)) * 100}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right text-muted-foreground tabular-nums">
                                    {verification.breakdown.misleading}
                                </span>
                            </div>

                            {/* Outdated */}
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-20 text-red-600 font-medium">Outdated</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 transition-all"
                                        style={{ width: `${(verification.breakdown.outdated / Math.max(verification.totalVotes, 1)) * 100}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right text-muted-foreground tabular-nums">
                                    {verification.breakdown.outdated}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between border-t pt-3">
                            <span className="text-xs text-muted-foreground">Vote on accuracy:</span>
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => onVote?.('true')}
                                    disabled={isLoading}
                                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                    title="Mark as Accurate"
                                >
                                    <ThumbsUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => onVote?.('misleading')}
                                    disabled={isLoading}
                                    className="h-8 w-8 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                                    title="Mark as Misleading"
                                >
                                    <AlertTriangle className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => onVote?.('outdated')}
                                    disabled={isLoading}
                                    className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    title="Mark as Outdated"
                                >
                                    <Clock className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <Button
                            variant="link"
                            size="sm"
                            className="w-full text-xs gap-1 h-7"
                        >
                            <ExternalLink className="h-3 w-3" />
                            View Evidence Links
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default VerificationPanel;
