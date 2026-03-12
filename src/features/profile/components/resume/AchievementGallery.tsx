import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Medal, Trophy, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AchievementGalleryProps {
    userId: string;
}

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({ userId }) => {
    // Fetch achievements
    const { data: achievements, isLoading: loadingAchievements } = useQuery({
        queryKey: ['resume-achievements', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_achievements')
                .select('*')
                .eq('user_id', userId)
                .order('earned_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
    });

    // Fetch badges 
    const { data: badges, isLoading: loadingBadges } = useQuery({
        queryKey: ['resume-badges', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_badges')
                .select(`
                    id, 
                    awarded_at,
                    badges (
                        id, 
                        name, 
                        description, 
                        icon, 
                        tier, 
                        category,
                        points_reward
                    )
                `)
                .eq('user_id', userId)
                .order('awarded_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
    });

    const isLoading = loadingAchievements || loadingBadges;
    const hasItems = (achievements && achievements.length > 0) || (badges && badges.length > 0);

    const getTierColor = (tier: string) => {
        switch (tier?.toLowerCase()) {
            case 'platinum': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400';
            case 'gold': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400';
            case 'silver': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300';
            case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400';
            default: return 'bg-primary/10 text-primary border-primary/20';
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Achievements & Badges</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!hasItems) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Achievement Gallery
                </CardTitle>
                <CardDescription>
                    Recognitions earned through community impact and engagement
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <Tabs defaultValue="badges">
                    <TabsList className="mb-4 bg-muted/50">
                        <TabsTrigger value="badges" className="text-xs">Badges ({badges?.length || 0})</TabsTrigger>
                        <TabsTrigger value="achievements" className="text-xs">Milestones ({achievements?.length || 0})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="badges" className="mt-0">
                        {badges?.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">No badges earned yet.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {badges?.map((userBadge) => {
                                    const badge = userBadge.badges as any; // typing workaround
                                    if (!badge) return null;
                                    
                                    return (
                                        <div 
                                            key={userBadge.id} 
                                            className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-transform hover:scale-105 ${getTierColor(badge.tier)}`}
                                        >
                                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-background/50 backdrop-blur shadow-sm">
                                                <span className="text-2xl">{badge.icon || '🏅'}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm leading-tight">{badge.name}</h4>
                                                <p className="text-[10px] opacity-80 mt-1 line-clamp-2">{badge.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="achievements" className="mt-0">
                        {achievements?.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">No milestones reached yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {achievements?.map((achievement) => (
                                    <div key={achievement.id} className="flex items-start gap-4 p-3 rounded-lg border border-border/50 bg-muted/20">
                                        <div className="mt-0.5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Star className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm">{achievement.achievement_name}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Unlocked on {new Date(achievement.earned_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};
