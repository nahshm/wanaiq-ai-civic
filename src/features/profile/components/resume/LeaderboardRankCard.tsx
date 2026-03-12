import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardRankCardProps {
    userId: string;
}

export const LeaderboardRankCard: React.FC<LeaderboardRankCardProps> = ({ userId }) => {
    const { data: scores, isLoading } = useQuery({
        queryKey: ['resume-leaderboard-ranks', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('leaderboard_scores')
                .select('*')
                .eq('user_id', userId)
                .in('period', ['weekly', 'all_time']);

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" /> Leaderboard Rank
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-16 bg-muted animate-pulse rounded-lg" />
                    <div className="h-16 bg-muted animate-pulse rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    if (!scores || scores.length === 0) {
        return null;
    }

    const weeklyScore = scores.find(s => s.period === 'weekly');
    const allTimeScore = scores.find(s => s.period === 'all_time');

    const renderTrend = (trend?: string | null) => {
        if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    };

    return (
        <Card>
            <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Standing
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {weeklyScore && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">This Week</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                    #{weeklyScore.rank}
                                </span>
                                <span className="text-sm font-medium">in County</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{weeklyScore.total_points} pts</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                            {renderTrend((weeklyScore as any).trend)}
                        </div>
                    </div>
                )}

                {allTimeScore && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">All Time</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold">#{allTimeScore.rank}</span>
                                <span className="text-sm font-medium text-muted-foreground">Overall</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{allTimeScore.total_points} total pts</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
