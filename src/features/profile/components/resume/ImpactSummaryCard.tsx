import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, Target, ShieldCheck } from 'lucide-react';

interface ImpactSummaryProps {
    profile: any;
    isOwnProfile: boolean;
}

export const ImpactSummaryCard: React.FC<ImpactSummaryProps> = ({ profile, isOwnProfile }) => {
    const { data: scores } = useQuery({
        queryKey: ['civic-scores', profile.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('civic_impact_scores')
                .select('*')
                .eq('user_id', profile.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!profile.id,
    });

    const getRingColor = (tier: string) => {
        switch (tier?.toLowerCase()) {
            case 'platinum': return 'text-purple-500';
            case 'gold': return 'text-yellow-500';
            case 'silver': return 'text-gray-400';
            case 'bronze': return 'text-orange-700';
            default: return 'text-primary';
        }
    };

    return (
        <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm -mt-20 z-20 relative">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                    {/* Avatar & Ring Area */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-background bg-card flex items-center justify-center overflow-hidden z-10 relative">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl text-muted-foreground font-bold">
                                    {profile.displayName?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        
                        {/* Decorative GOAT ring */}
                        <svg className="absolute -inset-2 w-36 h-36 -rotate-90 pointer-events-none z-0">
                            <circle
                                cx="72" cy="72" r="68"
                                className="fill-none stroke-muted/20"
                                strokeWidth="4"
                            />
                            {scores && (
                                <circle
                                    cx="72" cy="72" r="68"
                                    className={`fill-none ${getRingColor(scores.goat_title)} transition-all duration-1000 ease-out`}
                                    strokeWidth="4"
                                    strokeDasharray="427" /* 2 * PI * r */
                                    strokeDashoffset={427 - (427 * (scores.impact_rating || 0)) / 100}
                                    strokeLinecap="round"
                                />
                            )}
                        </svg>

                        {scores?.goat_title && (
                            <div className={`absolute -bottom-2 -right-2 px-3 py-1 text-xs font-bold rounded-full border-2 border-background z-20 shadow-md ${
                                scores.goat_title === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                                scores.goat_title === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                scores.goat_title === 'Silver' ? 'bg-gray-100 text-gray-800' :
                                'bg-orange-100 text-orange-800'
                            }`}>
                                {scores.goat_title}
                            </div>
                        )}
                    </div>

                    {/* Identity Text Content */}
                    <div className="flex-1 space-y-3">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center justify-center sm:justify-start gap-2">
                                {profile.displayName}
                                {profile.isVerified && <ShieldCheck className="w-5 h-5 text-primary" />}
                            </h1>
                            <p className="text-muted-foreground font-mono text-sm">@{profile.username}</p>
                            
                            {profile.officialPosition && (
                                <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {profile.officialPosition}
                                </div>
                            )}
                        </div>

                        {profile.bio && (
                            <p className="text-sm dark:text-zinc-300 max-w-lg">{profile.bio}</p>
                        )}
                        
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground flex-wrap">
                            {(profile.ward || profile.constituency || profile.county) && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                    <Target className="w-3.5 h-3.5" />
                                    {[profile.ward, profile.constituency, profile.county].filter(Boolean).join(', ')}
                                </div>
                            )}
                            {scores?.trust_tier && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {scores.trust_tier}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sub-scores Grid */}
                {scores && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border/50">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3 text-orange-500" /> Actions</span>
                                <span className="font-semibold">{scores.actions_score}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, scores.actions_score)}%` }} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-green-500" /> Resolution</span>
                                <span className="font-semibold">{scores.resolution_score}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, scores.resolution_score)}%` }} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3 text-blue-500" /> Community</span>
                                <span className="font-semibold">{scores.community_score}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, scores.community_score)}%` }} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-purple-500" /> Reliability</span>
                                <span className="font-semibold">{scores.reliability_score}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, scores.reliability_score)}%` }} />
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
