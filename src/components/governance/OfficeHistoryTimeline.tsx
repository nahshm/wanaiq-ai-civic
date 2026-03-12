import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Crown, Clock, CheckCircle, MessageSquare, ArrowRight } from 'lucide-react';
import { formatRelativeDate } from './officeConstants';

interface OfficeHolderHistoryEntry {
    id: string;
    is_active: boolean;
    is_historical: boolean;
    term_start: string | null;
    term_end: string | null;
    profiles: {
        username: string | null;
        display_name: string | null;
        avatar_url: string | null;
    } | null;
    // Aggregated metrics
    office_promises?: { id: string; status: string }[];
    office_questions?: { id: string; answer: string | null }[];
}

interface OfficeHistoryTimelineProps {
    holders: OfficeHolderHistoryEntry[];
    currentHolderId: string;
    positionTitle?: string;
}

export function OfficeHistoryTimeline({
    holders,
    currentHolderId,
    positionTitle,
}: OfficeHistoryTimelineProps) {
    const navigate = useNavigate();

    const getPromiseStats = (promises: { id: string; status: string }[] | undefined) => {
        if (!promises || promises.length === 0) return null;
        const kept = promises.filter(p => p.status === 'completed').length;
        return { total: promises.length, kept, pct: Math.round((kept / promises.length) * 100) };
    };

    const getQAStats = (questions: { id: string; answer: string | null }[] | undefined) => {
        if (!questions || questions.length === 0) return null;
        const answered = questions.filter(q => q.answer).length;
        return { total: questions.length, answered, pct: Math.round((answered / questions.length) * 100) };
    };

    const formatTermDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).getFullYear().toString();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">
                    Office History{positionTitle ? ` — ${positionTitle}` : ''}
                </h3>
            </div>

            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-4">
                    {holders.map((holder, index) => {
                        const isCurrent = holder.id === currentHolderId;
                        const promiseStats = getPromiseStats(holder.office_promises);
                        const qaStats = getQAStats(holder.office_questions);
                        const displayName = holder.profiles?.display_name || holder.profiles?.username || 'Unknown';
                        const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                        return (
                            <div key={holder.id} className="relative pl-12">
                                {/* Timeline dot */}
                                <div
                                    className={`absolute left-[12px] top-4 h-[16px] w-[16px] rounded-full border-2 ${
                                        isCurrent
                                            ? 'bg-primary border-primary shadow-sm shadow-primary/30'
                                            : 'bg-background border-muted-foreground/30'
                                    }`}
                                />

                                {/* Year marker */}
                                <div className="absolute left-0 top-4 -translate-x-full pr-4 hidden sm:block">
                                    <span className={`text-xs font-mono ${isCurrent ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                                        {formatTermDate(holder.term_start)}
                                    </span>
                                </div>

                                <Card className={`${isCurrent ? 'border-primary/30 bg-primary/[0.02]' : 'border-border/50'} transition-colors hover:border-border`}>
                                    <CardContent className="py-4 px-4">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-10 w-10 shrink-0">
                                                <AvatarImage src={holder.profiles?.avatar_url || ''} />
                                                <AvatarFallback className={isCurrent ? 'bg-primary/10 text-primary' : ''}>
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-sm">{displayName}</span>
                                                    {isCurrent && (
                                                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                                            Current
                                                        </Badge>
                                                    )}
                                                    {holder.is_historical && (
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                            Historical
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        Term: {formatTermDate(holder.term_start)}–{holder.term_end ? formatTermDate(holder.term_end) : 'Present'}
                                                    </span>
                                                </div>

                                                {/* Metrics */}
                                                <div className="flex items-center gap-4 mt-2 flex-wrap">
                                                    {promiseStats && (
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                                                            <span className="text-muted-foreground">
                                                                {promiseStats.pct}% promises kept ({promiseStats.kept}/{promiseStats.total})
                                                            </span>
                                                        </div>
                                                    )}
                                                    {qaStats && (
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <MessageSquare className="h-3 w-3 text-blue-500" />
                                                            <span className="text-muted-foreground">
                                                                {qaStats.answered}/{qaStats.total} answered
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Navigate to their page */}
                                            {!isCurrent && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="shrink-0 h-8 text-xs gap-1"
                                                    onClick={() => navigate(`/g/${holder.id}`)}
                                                >
                                                    View
                                                    <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default OfficeHistoryTimeline;
