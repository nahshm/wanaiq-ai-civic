import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Star, Award, Shield, Flame, Zap, Crown, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Trophy/Badge definitions
const TROPHY_CONFIG: Record<string, {
    name: string;
    description: string;
    icon: React.ReactNode;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    color: string;
    bgGradient: string;
}> = {
    early_adopter: {
        name: 'Early Adopter',
        description: 'Joined WanaIQ in its early days',
        icon: <Zap className="w-5 h-5" />,
        rarity: 'rare',
        color: 'text-yellow-500',
        bgGradient: 'from-yellow-500/20 to-orange-500/20',
    },
    election_watchdog: {
        name: 'Election Watchdog',
        description: 'Monitored elections for transparency',
        icon: <Shield className="w-5 h-5" />,
        rarity: 'epic',
        color: 'text-purple-500',
        bgGradient: 'from-purple-500/20 to-pink-500/20',
    },
    townhall_host: {
        name: 'Townhall Host',
        description: 'Hosted a community townhall event',
        icon: <Crown className="w-5 h-5" />,
        rarity: 'epic',
        color: 'text-blue-500',
        bgGradient: 'from-blue-500/20 to-cyan-500/20',
    },
    first_report: {
        name: 'First Report',
        description: 'Submitted your first civic report',
        icon: <Medal className="w-5 h-5" />,
        rarity: 'common',
        color: 'text-green-500',
        bgGradient: 'from-green-500/20 to-emerald-500/20',
    },
    streak_7: {
        name: 'Week Warrior',
        description: '7-day active streak',
        icon: <Flame className="w-5 h-5" />,
        rarity: 'uncommon',
        color: 'text-orange-500',
        bgGradient: 'from-orange-500/20 to-red-500/20',
    },
    streak_30: {
        name: 'Monthly Master',
        description: '30-day active streak',
        icon: <Flame className="w-5 h-5" />,
        rarity: 'rare',
        color: 'text-red-500',
        bgGradient: 'from-red-500/20 to-pink-500/20',
    },
    verified_reporter: {
        name: 'Verified Reporter',
        description: '10 verified civic reports',
        icon: <Star className="w-5 h-5" />,
        rarity: 'rare',
        color: 'text-cyan-500',
        bgGradient: 'from-cyan-500/20 to-blue-500/20',
    },
    community_champion: {
        name: 'Community Champion',
        description: 'Top contributor in your ward',
        icon: <Award className="w-5 h-5" />,
        rarity: 'legendary',
        color: 'text-amber-500',
        bgGradient: 'from-amber-500/20 to-yellow-500/20',
    },
};

const RARITY_STYLES: Record<string, { border: string; glow: string }> = {
    common: { border: 'border-gray-400/50', glow: '' },
    uncommon: { border: 'border-green-500/50', glow: '' },
    rare: { border: 'border-blue-500/50', glow: 'shadow-blue-500/20' },
    epic: { border: 'border-purple-500/50', glow: 'shadow-purple-500/30' },
    legendary: { border: 'border-amber-500/50', glow: 'shadow-amber-500/40 animate-pulse' },
};

interface TrophyItemProps {
    trophyType: string;
    earnedAt?: string;
}

const TrophyItem: React.FC<TrophyItemProps> = ({ trophyType, earnedAt }) => {
    const config = TROPHY_CONFIG[trophyType];
    if (!config) return null;

    const rarityStyle = RARITY_STYLES[config.rarity];

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    'relative flex flex-col items-center justify-center p-3 rounded-xl border-2',
                    'bg-gradient-to-br transition-all hover:scale-105 cursor-pointer',
                    config.bgGradient,
                    rarityStyle.border,
                    config.rarity === 'legendary' && 'ring-2 ring-amber-500/30',
                    config.rarity !== 'common' && `shadow-lg ${rarityStyle.glow}`
                )}>
                    {/* Rarity indicator */}
                    <div className={cn(
                        'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                        config.rarity === 'legendary' && 'bg-amber-500 animate-pulse',
                        config.rarity === 'epic' && 'bg-purple-500',
                        config.rarity === 'rare' && 'bg-blue-500',
                        config.rarity === 'uncommon' && 'bg-green-500',
                        config.rarity === 'common' && 'bg-gray-400',
                    )} />

                    {/* Icon */}
                    <div className={cn('mb-1', config.color)}>
                        {config.icon}
                    </div>

                    {/* Name */}
                    <span className="text-xs font-medium text-center leading-tight">
                        {config.name}
                    </span>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg', config.bgGradient, config.color)}>
                        {config.icon}
                    </div>
                    <div>
                        <p className="font-semibold">{config.name}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                        <p className="text-[10px] mt-1 capitalize text-muted-foreground">
                            {config.rarity} • {earnedAt ? new Date(earnedAt).toLocaleDateString() : 'Just now'}
                        </p>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
};

interface TrophyCaseProps {
    userId: string;
    className?: string;
}

/**
 * TrophyCase - Glass-shelf style achievement badge display
 */
const TrophyCaseContent: React.FC<TrophyCaseProps> = ({
    userId,
    className,
}) => {
    // Fetch user badges
    const { data: badges, isLoading } = useQuery({
        queryKey: ['user-trophies', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_badges')
                .select('*, badge:badges(*)')
                .eq('user_id', userId)
                .order('awarded_at', { ascending: false });

            if (error) throw error;

            // Map to trophy format
            return (data || []).map(ub => ({
                type: ub.badge?.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
                earnedAt: ub.awarded_at,
            }));
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-20" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Use demo badges if no real badges
    const displayBadges = badges && badges.length > 0
        ? badges
        : [
            { type: 'early_adopter', earnedAt: new Date().toISOString() },
            { type: 'first_report', earnedAt: new Date().toISOString() },
        ];

    return (
        <Card className={cn(
            // Glass shelf effect
            'bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-sm',
            className
        )}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Trophy Case
                </CardTitle>
            </CardHeader>
            <CardContent>
                {displayBadges.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No trophies earned yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {displayBadges.map((badge, index) => (
                            <TrophyItem
                                key={`${badge.type}-${index}`}
                                trophyType={badge.type}
                                earnedAt={badge.earnedAt}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Wrap with Error Boundary
export const TrophyCase: React.FC<TrophyCaseProps> = (props) => (
    <ErrorBoundary componentName="TrophyCase">
        <TrophyCaseContent {...props} />
    </ErrorBoundary>
);

export default TrophyCase;
