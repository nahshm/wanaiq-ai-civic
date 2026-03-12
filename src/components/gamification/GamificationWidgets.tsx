import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserQuest, UserBadge, LeaderboardScore } from '@/types/gamification';
import { Trophy, Target, Award, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GamificationWidgets = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeQuests, setActiveQuests] = useState<UserQuest[]>([]);
    const [recentBadges, setRecentBadges] = useState<UserBadge[]>([]);
    const [userRank, setUserRank] = useState<LeaderboardScore | null>(null);
    const [totalPoints, setTotalPoints] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchGamificationData();
        }
    }, [user]);

    const fetchGamificationData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Fetch active quests
            const { data: quests } = await supabase
                .from('user_quests' as any)
                .select('*, quest:quests(*)')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .limit(3);

            setActiveQuests((quests as any[]) || []);

            // Fetch recent badges (last 3)
            const { data: badges } = await supabase
                .from('user_badges' as any)
                .select('*, badge:badges(*)')
                .eq('user_id', user.id)
                .order('awarded_at', { ascending: false })
                .limit(3);

            setRecentBadges((badges as any[]) || []);

            // Fetch user rank
            const { data: rank } = await supabase
                .from('leaderboard_scores' as any)
                .select('*')
                .eq('user_id', user.id)
                .eq('period', 'all_time')
                .is('location_type', null)
                .maybeSingle();

            setUserRank(rank as any);

            // Fetch total points
            const { data: actions } = await supabase
                .from('user_actions' as any)
                .select('action_value')
                .eq('user_id', user.id);

            const total = (actions as any[])?.reduce((sum: number, a: any) => sum + (a.action_value || 0), 0) || 0;
            setTotalPoints(total);
        } catch (error) {
            console.error('Error fetching gamification data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !user) {
        return null;
    }

    const tierIcons: Record<string, string> = {
        bronze: '🥉',
        silver: '🥈',
        gold: '🥇',
        platinum: '💎'
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Active Quests Widget */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Active Quests
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/quests')}>
                        View All
                    </Button>
                </CardHeader>
                <CardContent>
                    {activeQuests.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground mb-2">No active quests</p>
                            <Button variant="outline" size="sm" onClick={() => navigate('/quests')}>
                                Browse Quests
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeQuests.map((uq) => (
                                <div key={uq.id} className="border-b pb-2 last:border-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <p className="text-sm font-medium line-clamp-1">{uq.quest?.title}</p>
                                        <Badge variant="secondary" className="text-xs">
                                            {uq.quest?.points}pts
                                        </Badge>
                                    </div>
                                    <Progress value={uq.progress} className="h-1" />
                                    <p className="text-xs text-muted-foreground mt-1">{uq.progress}% complete</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Badges Widget */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Recent Achievements
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/profile/${user.id}?tab=badges`)}>
                        View All
                    </Button>
                </CardHeader>
                <CardContent>
                    {recentBadges.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">No badges earned yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentBadges.map((ub) => (
                                <div key={ub.id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                        {tierIcons[ub.badge?.tier || 'bronze']}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium line-clamp-1">{ub.badge?.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(ub.awarded_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Leaderboard Rank Widget */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Your Ranking
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/leaderboards')}>
                        Leaderboard
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-primary mb-1">{totalPoints}</div>
                            <p className="text-xs text-muted-foreground">Civic Points</p>
                        </div>

                        {userRank ? (
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium">National Rank</span>
                                </div>
                                <div className="text-lg font-bold text-primary">#{userRank.rank}</div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">
                                Complete quests to get ranked!
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
