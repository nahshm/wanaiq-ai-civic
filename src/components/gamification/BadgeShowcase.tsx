import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { UserBadge, Badge as BadgeType } from '@/types/gamification';
import { Award, Trophy, TrendingUp, CheckCircle } from 'lucide-react';

interface BadgeShowcaseProps {
    userId: string;
}

const tierColors = {
    bronze: 'bg-amber-700 text-white',
    silver: 'bg-gray-400 text-white',
    gold: 'bg-yellow-500 text-white',
    platinum: 'bg-purple-600 text-white'
};

const tierIcons = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
};

export const BadgeShowcase = ({ userId }: BadgeShowcaseProps) => {
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBadges();
        fetchTotalPoints();
    }, [userId]);

    const fetchBadges = async () => {
        try {
            const { data, error } = await supabase
                .from('user_badges' as any)
                .select(`
          *,
          badge:badges(*)
        `)
                .eq('user_id', userId)
                .order('awarded_at', { ascending: false });

            if (error) throw error;
            setUserBadges((data as any[]) || []);
        } catch (error) {
            console.error('Error fetching badges:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTotalPoints = async () => {
        try {
            const { data, error } = await supabase
                .from('user_actions' as any)
                .select('action_value')
                .eq('user_id', userId);

            if (error) throw error;
            const total = (data as any[])?.reduce((sum: number, action: any) => sum + (action.action_value || 0), 0) || 0;
            setTotalPoints(total);
        } catch (error) {
            console.error('Error fetching points:', error);
        }
    };

    const getNextBadge = (category: string) => {
        const categoryBadges = userBadges.filter(ub => ub.badge?.category === category);
        if (categoryBadges.length === 0) return null;

        const currentBadge = categoryBadges[0];
        const tiers = ['bronze', 'silver', 'gold', 'platinum'];
        const currentTierIndex = tiers.indexOf(currentBadge.badge?.tier || 'bronze');

        if (currentTierIndex < tiers.length - 1) {
            return {
                tier: tiers[currentTierIndex + 1],
                progress: currentBadge.progress
            };
        }
        return null;
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">Loading badges...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Points Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Civic Points
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-primary mb-2">{totalPoints}</div>
                    <p className="text-sm text-muted-foreground">Total points earned</p>
                </CardContent>
            </Card>

            {/* Earned Badges */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Achievement Badges
                        <Badge variant="secondary" className="ml-auto">{userBadges.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {userBadges.length === 0 ? (
                        <div className="text-center py-8">
                            <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No badges earned yet</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Complete quests and contribute to earn badges!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {userBadges.map((userBadge) => {
                                const badge = userBadge.badge;
                                if (!badge) return null;

                                const nextBadge = getNextBadge(badge.category);
                                const isMaxTier = badge.tier === 'platinum';

                                return (
                                    <div key={userBadge.id} className="relative group">
                                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                                            <CardContent className="p-4">
                                                {/* Badge Icon/Tier */}
                                                <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-3xl ${tierColors[badge.tier]}`}>
                                                    {tierIcons[badge.tier]}
                                                </div>

                                                {/* Badge Name */}
                                                <h4 className="font-semibold text-center text-sm mb-1">
                                                    {badge.name.replace(` - ${badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}`, '')}
                                                </h4>
                                                <Badge variant="outline" className={`mx-auto block w-fit text-xs ${tierColors[badge.tier]}`}>
                                                    {badge.tier.toUpperCase()}
                                                </Badge>

                                                {/* Description */}
                                                <p className="text-xs text-muted-foreground text-center mt-2">
                                                    {badge.description}
                                                </p>

                                                {/* Progress to Next Tier */}
                                                {!isMaxTier && nextBadge && (
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-muted-foreground">
                                                                Next: {nextBadge.tier.charAt(0).toUpperCase() + nextBadge.tier.slice(1)}
                                                            </span>
                                                            <span className="font-semibold">{nextBadge.progress}%</span>
                                                        </div>
                                                        <Progress value={nextBadge.progress} className="h-1" />
                                                    </div>
                                                )}

                                                {isMaxTier && (
                                                    <div className="mt-3 flex items-center justify-center gap-1 text-xs text-green-600">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span>Max Tier</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Badge Categories */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Badge Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {['fact_checker', 'community_reporter', 'policy_analyst', 'voting_champion', 'civic_educator'].map(category => {
                            const categoryBadges = userBadges.filter(ub => ub.badge?.category === category);
                            const highestBadge = categoryBadges[0];
                            const categoryName = category.split('_').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ');

                            return (
                                <div key={category} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <span className="text-sm font-medium">{categoryName}</span>
                                    {highestBadge ? (
                                        <Badge className={tierColors[highestBadge.badge?.tier || 'bronze']}>
                                            {tierIcons[highestBadge.badge?.tier || 'bronze']} {highestBadge.badge?.tier.toUpperCase()}
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Not earned</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
