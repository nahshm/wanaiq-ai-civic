import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LeaderboardScore } from '@/types/gamification';
import { Trophy, TrendingUp, Award, MapPin, Calendar } from 'lucide-react';

const Leaderboards = () => {
    const { user } = useAuth();
    const [leaderboards, setLeaderboards] = useState<LeaderboardScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');
    const [locationType, setLocationType] = useState<'national' | 'county' | 'constituency' | 'ward'>('national');
    const [userRank, setUserRank] = useState<LeaderboardScore | null>(null);

    useEffect(() => {
        fetchLeaderboards();
    }, [period, locationType]);

    const fetchLeaderboards = async () => {
        try {
            setLoading(true);

            // Build query
            let query = supabase
                .from('leaderboard_scores' as any)
                .select(`
          *,
          user:profiles(id, username, display_name, avatar_url)
        `)
                .eq('period', period)
                .order('rank', { ascending: true })
                .limit(100);

            // Add location filter
            if (locationType === 'national') {
                query = query.is('location_type', null);
            } else {
                query = query.eq('location_type', locationType);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLeaderboards((data as any[]) || []);

            // Find current user's rank
            if (user && data) {
                const myRank = (data as any[]).find((score: any) => score.user_id === user.id);
                setUserRank(myRank || null);
            }
        } catch (error) {
            console.error('Error fetching leaderboards:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Award className="w-5 h-5 text-gray-400" />;
        if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
        return null;
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-500 font-bold';
        if (rank === 2) return 'text-gray-400 font-semibold';
        if (rank === 3) return 'text-amber-600 font-semibold';
        return '';
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Loading leaderboards...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold">Civic Leaderboards</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Top contributors making a difference in their communities
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all_time">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    All Time
                                </div>
                            </SelectItem>
                            <SelectItem value="monthly">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    This Month
                                </div>
                            </SelectItem>
                            <SelectItem value="weekly">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    This Week
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1">
                    <Select value={locationType} onValueChange={(val: any) => setLocationType(val)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="national">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    National
                                </div>
                            </SelectItem>
                            <SelectItem value="county">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    County
                                </div>
                            </SelectItem>
                            <SelectItem value="constituency">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Constituency
                                </div>
                            </SelectItem>
                            <SelectItem value="ward">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Ward
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Your Rank */}
            {userRank && (
                <Card className="mb-6 border-primary bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-3xl font-bold text-primary">#{userRank.rank}</div>
                                <div>
                                    <p className="font-semibold">Your Rank</p>
                                    <p className="text-sm text-muted-foreground">{userRank.total_points} points</p>
                                </div>
                            </div>
                            <Badge variant="secondary" className="text-lg px-4 py-2">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Top {Math.round((userRank.rank! / leaderboards.length) * 100)}%
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Leaderboard Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Top 100 Contributors
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {leaderboards.map((score, idx) => (
                            <div
                                key={score.id}
                                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${score.user_id === user?.id ? 'bg-primary/10 border-2 border-primary' : 'bg-muted/50 hover:bg-muted'
                                    }`}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    {/* Rank */}
                                    <div className={`w-12 text-center text-2xl font-bold ${getRankColor(score.rank || idx + 1)}`}>
                                        {getRankBadge(score.rank || idx + 1) || `#${score.rank || idx + 1}`}
                                    </div>

                                    {/* Avatar */}
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={(score.user as any)?.avatar_url || (score.user as any)?.avatar || ''} />
                                        <AvatarFallback>
                                            {(score.user as any)?.display_name?.charAt(0) || (score.user as any)?.displayName?.charAt(0) || score.user?.username?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* User Info */}
                                    <div className="flex-1">
                                        <p className="font-semibold">
                                            {(score.user as any)?.display_name || (score.user as any)?.displayName || score.user?.username || 'Anonymous'}
                                            {score.user_id === user?.id && (
                                                <Badge variant="secondary" className="ml-2">You</Badge>
                                            )}
                                        </p>
                                        {score.location_value && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {score.location_value}
                                            </p>
                                        )}
                                    </div>

                                    {/* Points */}
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">{score.total_points}</p>
                                        <p className="text-xs text-muted-foreground">points</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {leaderboards.length === 0 && (
                            <div className="text-center py-12">
                                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No rankings yet</h3>
                                <p className="text-muted-foreground">
                                    Complete quests and submit projects to appear on the leaderboard!
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Leaderboards;
