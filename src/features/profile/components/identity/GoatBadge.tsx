import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Crown, Zap, Star, Shield, Swords, Info, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoatBadgeProps {
    level: number;
    title: string;
    xp?: number;
    showLevel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

// ─── Tier colours ────────────────────────────────────────────────────────────
const getTierColor = (level: number): string => {
    if (level >= 40) return 'from-amber-500 to-orange-500';     // National Hero
    if (level >= 30) return 'from-purple-500 to-pink-500';      // Regional Legend
    if (level >= 20) return 'from-blue-500 to-cyan-500';        // County Crusader
    if (level >= 10) return 'from-green-500 to-emerald-500';    // Constituency Champion
    if (level >= 5)  return 'from-teal-500 to-green-500';       // Ward Guardian
    return 'from-gray-500 to-slate-500';                        // Street Monitor
};

// ─── Tier icons ───────────────────────────────────────────────────────────────
const getTierIcon = (level: number) => {
    if (level >= 40) return <Crown className="w-4 h-4" />;
    if (level >= 30) return <Swords className="w-4 h-4" />;
    if (level >= 20) return <Shield className="w-4 h-4" />;
    if (level >= 10) return <Star className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
};

const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
};

// ─── XP guide items ───────────────────────────────────────────────────────────
const XP_GUIDE = [
    {
        icon: <TrendingUp className="w-3.5 h-3.5 text-orange-500" />,
        label: 'Civic Actions',
        desc: 'Report issues, track resolutions in your ward',
    },
    {
        icon: <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
        label: 'Resolution Rate',
        desc: 'Higher % of your reports that get resolved',
    },
    {
        icon: <Users className="w-3.5 h-3.5 text-blue-500" />,
        label: 'Community',
        desc: 'Post, comment, vote and engage in communities',
    },
    {
        icon: <Clock className="w-3.5 h-3.5 text-purple-500" />,
        label: 'Reliability',
        desc: 'Consistent participation, no spam, good standing',
    },
];

const TIER_GUIDE = [
    { range: '1–4',   title: 'Street Monitor',           color: 'bg-gray-400' },
    { range: '5–9',   title: 'Ward Guardian',             color: 'bg-teal-500' },
    { range: '10–19', title: 'Constituency Champion',     color: 'bg-green-500' },
    { range: '20–29', title: 'County Crusader',           color: 'bg-blue-500' },
    { range: '30–39', title: 'Regional Legend',           color: 'bg-purple-500' },
    { range: '40+',   title: 'National Hero',             color: 'bg-amber-500' },
];

/**
 * CivicRankBadge — displays a user's Civic Rank with tier-appropriate styling
 * and a "How to earn XP" tooltip on hover.
 */
export const GoatBadge: React.FC<GoatBadgeProps> = ({
    level,
    title,
    xp,
    showLevel = true,
    size = 'md',
    className,
}) => {
    const tierGradient = getTierColor(level);
    const tierIcon = getTierIcon(level);

    const badge = (
        <Badge
            variant="outline"
            className={cn(
                'border-0 text-white font-semibold shadow-lg cursor-default',
                `bg-gradient-to-r ${tierGradient}`,
                sizeClasses[size],
                'flex items-center gap-1.5',
                className
            )}
        >
            {tierIcon}
            {showLevel && (
                <span className="font-bold">LVL {level}</span>
            )}
            <span className="font-normal opacity-90">•</span>
            <span>{title}</span>
        </Badge>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1">
                    {badge}
                    <Info className="w-3 h-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity" />
                </span>
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                align="start"
                className="w-72 p-0 overflow-hidden shadow-xl border border-border/60"
            >
                {/* Header */}
                <div className={cn('px-4 py-3 bg-gradient-to-r text-white', tierGradient)}>
                    <div className="flex items-center gap-2">
                        {tierIcon}
                        <div>
                            <p className="font-bold text-sm leading-none">Civic Rank — {title}</p>
                            <p className="text-[11px] opacity-80 mt-0.5">
                                Level {level}{xp !== undefined ? ` · ${xp.toLocaleString()} XP earned` : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Earning guide */}
                <div className="px-4 py-3 space-y-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        How to earn XP
                    </p>
                    <div className="space-y-2">
                        {XP_GUIDE.map(({ icon, label, desc }) => (
                            <div key={label} className="flex items-start gap-2">
                                <span className="mt-0.5 shrink-0">{icon}</span>
                                <div>
                                    <p className="text-xs font-semibold text-foreground leading-none">{label}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tier ladder */}
                    <div className="pt-2 border-t border-border/50">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Rank Tiers
                        </p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            {TIER_GUIDE.map(({ range, title: t, color }) => (
                                <div key={range} className="flex items-center gap-1.5">
                                    <span className={cn('w-2 h-2 rounded-full shrink-0', color)} />
                                    <span className={cn(
                                        'text-[10px]',
                                        t === title ? 'font-bold text-foreground' : 'text-muted-foreground'
                                    )}>
                                        {range} · {t}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
};

export default GoatBadge;
