import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, MessageSquare, Zap, Trophy, Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStats } from '../../hooks/useUserStats';

interface StatsOverviewProps {
    userId: string;
}

const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}> = ({ title, value, icon, color }) => {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div className={cn('p-2 rounded-lg', color)}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </div>
    );
};

export const StatsOverview: React.FC<StatsOverviewProps> = ({ userId }) => {
    const { data: stats, isLoading } = useUserStats(userId);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                ))}
            </div>
        );
    }

    if (!stats) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <p>No stats available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="w-4 h-4" />
                        Contribution Stats
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard
                            title="Posts Created"
                            value={stats.totalPosts}
                            icon={<FileText className="w-4 h-4" />}
                            color="text-blue-500 bg-blue-500/10"
                        />
                        <StatCard
                            title="Comments"
                            value={stats.totalComments}
                            icon={<MessageSquare className="w-4 h-4" />}
                            color="text-green-500 bg-green-500/10"
                        />
                        <StatCard
                            title="Civic Actions"
                            value={stats.totalCivicActions}
                            icon={<Zap className="w-4 h-4" />}
                            color="text-orange-500 bg-orange-500/10"
                        />
                        <StatCard
                            title="Actions Resolved"
                            value={stats.resolvedActions}
                            icon={<Trophy className="w-4 h-4" />}
                            color="text-amber-500 bg-amber-500/10"
                        />
                        <StatCard
                            title="Badges Earned"
                            value={stats.badgesEarned}
                            icon={<Award className="w-4 h-4" />}
                            color="text-purple-500 bg-purple-500/10"
                        />
                        <StatCard
                            title="Endorsements"
                            value={stats.endorsements}
                            icon={<TrendingUp className="w-4 h-4" />}
                            color="text-cyan-500 bg-cyan-500/10"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Impact Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Impact Rating</span>
                            <span className="text-2xl font-bold">{stats.impactRating}/100</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Civic Rank</span>
                            <span className="text-xl font-semibold">Level {stats.goatLevel}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
