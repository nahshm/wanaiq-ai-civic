import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
    TrendingUp,
    Award,
    Target,
    Clock,
    CheckCircle,
    BarChart3,
    Users,
    Zap,
    ArrowLeft
} from 'lucide-react';

interface CivicStats {
    totalActions: number;
    resolvedActions: number;
    activeActions: number;
    supportGiven: number;
    supportReceived: number;
    civicHealthScore: number;
}

interface Achievement {
    achievement_type: string;
    achievement_name: string;
    achievement_description: string;
    earned_at: string;
}

interface CategoryStats {
    category: string;
    count: number;
    resolved: number;
    avg_days: number | null;
}

const Analytics = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<CivicStats>({
        totalActions: 0,
        resolvedActions: 0,
        activeActions: 0,
        supportGiven: 0,
        supportReceived: 0,
        civicHealthScore: 0,
    });
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchAnalytics();
        }
    }, [user]);

    const fetchAnalytics = async () => {
        if (!user) return;

        try {
            // Get user's actions
            const { data: actions } = await supabase
                .from('civic_actions')
                .select('*')
                .eq('user_id', user.id);

            // Get support given by user
            const { data: supportGiven } = await supabase
                .from('civic_action_supporters')
                .select('id')
                .eq('user_id', user.id);

            // Get total support received by user's actions
            const actionIds = actions?.map(a => a.id) || [];
            let supportReceived = 0;
            if (actionIds.length > 0) {
                const { data: supporterCount } = await supabase
                    .from('civic_action_supporters')
                    .select('id')
                    .in('action_id', actionIds);
                supportReceived = supporterCount?.length || 0;
            }

            // Get achievements
            const { data: achievementsData } = await supabase
                .from('user_achievements')
                .select('*')
                .eq('user_id', user.id)
                .order('earned_at', { ascending: false });

            // Calculate category stats
            const categoryMap = new Map<string, CategoryStats>();
            actions?.forEach(action => {
                const existing = categoryMap.get(action.category) || {
                    category: action.category,
                    count: 0,
                    resolved: 0,
                    avg_days: null,
                };

                existing.count++;
                if (action.status === 'resolved') {
                    existing.resolved++;
                }
                categoryMap.set(action.category, existing);
            });

            const totalActions = actions?.length || 0;
            const resolvedActions = actions?.filter(a => a.status === 'resolved').length || 0;
            const activeActions = actions?.filter(a =>
                a.status === 'in_progress' || a.status === 'acknowledged'
            ).length || 0;

            // Calculate Civic Health Score (0-100)
            const score = calculateCivicHealthScore({
                totalActions,
                resolvedActions,
                supportGiven: supportGiven?.length || 0,
                supportReceived,
                achievements: achievementsData?.length || 0,
            });

            setStats({
                totalActions,
                resolvedActions,
                activeActions,
                supportGiven: supportGiven?.length || 0,
                supportReceived,
                civicHealthScore: score,
            });

            setAchievements(achievementsData || []);
            setCategoryStats(Array.from(categoryMap.values()));

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateCivicHealthScore = (data: {
        totalActions: number;
        resolvedActions: number;
        supportGiven: number;
        supportReceived: number;
        achievements: number;
    }) => {
        // Scoring formula (max 100 points)
        const actionsScore = Math.min(data.totalActions * 5, 30); // Max 30 points
        const resolutionScore = Math.min(data.resolvedActions * 10, 25); // Max 25 points
        const supportScore = Math.min((data.supportGiven + data.supportReceived), 20); // Max 20 points
        const achievementScore = data.achievements * 8.33; // Max 25 points (3 achievements)

        return Math.round(actionsScore + resolutionScore + supportScore + achievementScore);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Getting Started';
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 max-w-6xl">
                <Card>
                    <CardContent className="py-12 text-center">
                        Loading analytics...
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Button>

            <div>
                <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
                <p className="text-muted-foreground">
                    Track your civic engagement and community impact
                </p>
            </div>

            {/* Civic Health Score */}
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-500" />
                        Your Civic Health Score
                    </CardTitle>
                    <CardDescription>
                        A measure of your civic engagement and community impact
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="flex items-baseline gap-3">
                                <span className={`text-6xl font-bold ${getScoreColor(stats.civicHealthScore)}`}>
                                    {stats.civicHealthScore}
                                </span>
                                <span className="text-2xl text-muted-foreground">/100</span>
                            </div>
                            <Badge variant="outline" className="mt-2">
                                {getScoreLabel(stats.civicHealthScore)}
                            </Badge>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                            <p>Top {stats.civicHealthScore >= 80 ? '10' : stats.civicHealthScore >= 50 ? '25' : '50'}%</p>
                            <p>in your area</p>
                        </div>
                    </div>
                    <Progress value={stats.civicHealthScore} className="h-3" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats.totalActions}</p>
                            <p className="text-xs text-muted-foreground">Actions Taken</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{stats.resolvedActions}</p>
                            <p className="text-xs text-muted-foreground">Resolved</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats.supportGiven}</p>
                            <p className="text-xs text-muted-foreground">Support Given</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats.supportReceived}</p>
                            <p className="text-xs text-muted-foreground">Support Received</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for different analytics */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Total Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats.totalActions}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Issues reported
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Active
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-yellow-600">{stats.activeActions}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    In progress
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Resolved
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">{stats.resolvedActions}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Completed
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Community Engagement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">Support Given</p>
                                    <p className="text-sm text-muted-foreground">
                                        Issues you've supported in your community
                                    </p>
                                </div>
                                <div className="text-2xl font-bold">{stats.supportGiven}</div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">Support Received</p>
                                    <p className="text-sm text-muted-foreground">
                                        Community members supporting your issues
                                    </p>
                                </div>
                                <div className="text-2xl font-bold">{stats.supportReceived}</div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Achievements Tab */}
                <TabsContent value="achievements" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="w-5 h-5" />
                                Your Achievements
                            </CardTitle>
                            <CardDescription>
                                Badges earned for civic participation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {achievements.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No achievements yet</p>
                                    <p className="text-sm">Report your first issue to start earning badges!</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {achievements.map((achievement) => (
                                        <div
                                            key={achievement.achievement_type}
                                            className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Award className="w-8 h-8 text-yellow-600" />
                                                <div>
                                                    <h3 className="font-semibold">{achievement.achievement_name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {achievement.achievement_description}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Earned {new Date(achievement.earned_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Categories Tab */}
                <TabsContent value="categories" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Issues by Category
                            </CardTitle>
                            <CardDescription>
                                Breakdown of your reported issues
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {categoryStats.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No data yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {categoryStats.map((cat) => (
                                        <div key={cat.category}>
                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <p className="font-semibold capitalize">{cat.category}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {cat.resolved} of {cat.count} resolved
                                                    </p>
                                                </div>
                                                <Badge variant="outline">{cat.count} issues</Badge>
                                            </div>
                                            <Progress
                                                value={(cat.resolved / cat.count) * 100}
                                                className="h-2"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Analytics;
