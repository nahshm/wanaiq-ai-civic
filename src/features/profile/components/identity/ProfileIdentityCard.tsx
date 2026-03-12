import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Calendar, MapPin, Trophy, Award, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { GoatBadge } from './GoatBadge';
import { TrustTier, TrustTierType } from './TrustTier';
import { useCivicImpact } from '../../hooks/useCivicImpact';
import { VerifiedBadge, OfficialPositionBadge } from '@/components/ui/verified-badge';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface ProfileIdentityCardProps {
    userId: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    isVerified?: boolean;
    officialPosition?: string;
    location?: string;
    joinDate?: Date;
    frameAnimation?: string;
    accentColor?: string;
    className?: string;
}

// Skeleton loader
const IdentityCardSkeleton: React.FC = () => (
    <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-700" />
        <CardContent className="relative -mt-16 pb-4">
            <div className="flex gap-4">
                <Skeleton className="w-28 h-28 rounded-xl flex-shrink-0" />
                <div className="flex-1 pt-8 space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        </CardContent>
    </Card>
);

// Error state
const IdentityCardError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <Card className="overflow-hidden border-destructive/50">
        <CardContent className="py-6 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Failed to load profile</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
            </Button>
        </CardContent>
    </Card>
);

// Frame animation styles
const getFrameStyle = (animation?: string): string => {
    switch (animation) {
        case 'ballot_spin':
            return 'ring-4 ring-blue-500 animate-pulse';
        case 'flag_wave':
            return 'ring-4 ring-green-500 ring-offset-red-500 ring-offset-2';
        case 'stars_glow':
            return 'ring-4 ring-yellow-500 shadow-lg shadow-yellow-500/50';
        case 'civic_pulse':
            return 'ring-4 ring-purple-500 animate-pulse';
        case 'verified_shine':
            return 'ring-4 ring-blue-400 shadow-lg shadow-blue-400/50';
        default:
            return 'ring-2 ring-background';
    }
};

// Get impact color
const getImpactColor = (rating: number): string => {
    if (rating >= 80) return 'text-green-500 bg-green-500/10';
    if (rating >= 60) return 'text-blue-500 bg-blue-500/10';
    if (rating >= 40) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-orange-500 bg-orange-500/10';
};

/**
 * ProfileIdentityCard - Compact trading card style identity display
 * Redesigned to minimize whitespace and maximize information density
 */
const ProfileIdentityCardContent: React.FC<ProfileIdentityCardProps> = ({
    userId,
    username,
    displayName,
    avatarUrl,
    bannerUrl,
    isVerified,
    officialPosition,
    location,
    joinDate,
    frameAnimation,
    accentColor = '#3B82F6',
    className,
}) => {
    const {
        impactScore,
        isLoading,
        isError,
        refetch,
        getXpProgress,
    } = useCivicImpact({ userId });

    if (isLoading) return <IdentityCardSkeleton />;
    if (isError) return <IdentityCardError onRetry={refetch} />;

    const xpProgress = getXpProgress();
    const trustTier: TrustTierType = impactScore?.trustTier ||
        (isVerified && officialPosition ? 'verified_official' :
            isVerified ? 'verified_user' : 'resident');

    const impactRating = impactScore?.impactRating || 0;

    // Get grade from rating
    const getGrade = (rating: number): string => {
        if (rating >= 90) return 'A+';
        if (rating >= 80) return 'A';
        if (rating >= 70) return 'B+';
        if (rating >= 60) return 'B';
        if (rating >= 50) return 'C';
        if (rating >= 40) return 'D';
        return 'F';
    };

    const getPercentile = (rating: number): string => {
        if (rating >= 90) return 'Top 1%';
        if (rating >= 80) return 'Top 5%';
        if (rating >= 70) return 'Top 15%';
        if (rating >= 60) return 'Top 30%';
        if (rating >= 50) return 'Top 50%';
        return 'Rising';
    };

    return (
        <Card className={cn('overflow-hidden', className)}>
            {/* Compact Banner */}
            <div
                className="h-20 bg-cover bg-center"
                style={{
                    backgroundImage: bannerUrl
                        ? `url(${bannerUrl})`
                        : `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
                }}
            />

            {/* Main Content - Responsive Layout */}
            <CardContent className="relative px-4 py-3">
                <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
                    {/* Avatar - Overlapping Banner */}
                    <Avatar className={cn(
                        'w-20 h-20 -mt-12 border-4 border-background shadow-md flex-shrink-0',
                        getFrameStyle(frameAnimation)
                    )}>
                        <AvatarImage src={avatarUrl} alt={displayName || username} className="object-cover" />
                        <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/5">
                            {(displayName || username)?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    {/* Middle: User Info */}
                    <div className="flex-1 min-w-0">
                        {/* Name Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold truncate">{displayName || username}</h2>
                            {isVerified && <VerifiedBadge size="sm" positionTitle={officialPosition} />}
                        </div>

                        {/* Username + Join Date */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5 flex-wrap">
                            <span>@{username}</span>
                            {joinDate && (
                                <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Official Position Badge */}
                        {officialPosition && (
                            <div className="mt-2">
                                <OfficialPositionBadge position={officialPosition} />
                            </div>
                        )}

                        {/* Civic Rank + XP Progress */}
                        <div className="mt-2 space-y-1">
                            <GoatBadge
                                level={impactScore?.goatLevel || 1}
                                title={impactScore?.goatTitle || 'Street Monitor'}
                                size="sm"
                            />
                            <div className="max-w-[200px]">
                                <Progress value={getXpProgress().percent} className="h-1" />
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {getXpProgress().current}/{getXpProgress().required} XP to next level
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Impact Rating Card - Stacks below on mobile */}
                    <div className="w-full md:w-auto md:flex-shrink-0 relative overflow-hidden rounded-lg p-3 md:min-w-[160px] shadow-lg shadow-primary/20 ring-1 ring-border">
                        {/* Animated gradient background - theme aware */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
                            style={{
                                backgroundSize: '200% 200%',
                                animation: 'gradient-shift 8s ease infinite',
                            }}
                        />
                        {/* Subtle shimmer overlay */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                                backgroundSize: '200% 200%',
                                animation: 'shimmer 3s ease-in-out infinite',
                            }}
                        />
                        {/* Content */}
                        <div className="relative z-10">
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-medium mb-1.5">Impact Rating</p>
                            <div className="flex items-end justify-between mb-2">
                                {/* Grade */}
                                <span
                                    className="text-4xl font-black text-foreground leading-none select-none"
                                    style={{
                                        textShadow: '0 0 15px rgba(59,130,246,0.5), 0 2px 4px rgba(0,0,0,0.3)',
                                        filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.2))',
                                    }}
                                >{getGrade(impactRating)}</span>
                                <div className="text-right ml-2">
                                    <div className="text-[10px] font-bold text-primary uppercase">Lvl {impactScore?.goatLevel || 1}</div>
                                    <div className="text-[9px] text-muted-foreground">{getPercentile(impactRating)}</div>
                                </div>
                            </div>
                            {/* Progress bar */}
                            <Progress value={impactRating} className="h-1.5 mb-1.5" />
                            {/* XP and Goal */}
                            <div className="flex justify-between items-center text-[9px] text-muted-foreground/80">
                                <span className="text-primary font-medium">{impactScore?.goatXp || 0} XP</span>
                                <span className="text-right uppercase tracking-wide text-[8px]">
                                    {impactScore?.goatTitle || 'Next Level'}
                                </span>
                            </div>
                        </div>
                        {/* CSS Keyframes via style tag */}
                        <style>{`
                            @keyframes gradient-shift {
                                0%, 100% { background-position: 0% 50%; }
                                50% { background-position: 100% 50%; }
                            }
                            @keyframes shimmer {
                                0% { background-position: -200% 0; }
                                100% { background-position: 200% 0; }
                            }
                        `}</style>
                    </div>
                </div>

                {/* Bottom Stats - Compact */}
                {impactScore && (
                    <div className="flex items-center gap-4 mt-3 pt-2 border-t text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" />
                            <strong className="text-foreground">{impactScore.actionsScore}</strong> Actions
                        </span>
                        <span className="flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5" />
                            <strong className="text-foreground">{impactScore.resolutionScore}</strong> Resolved
                        </span>
                        <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <strong className="text-foreground">{impactScore.communityScore}</strong> Community
                        </span>
                        <TrustTier tier={trustTier} size="sm" showLabel={false} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Wrap with Error Boundary
export const ProfileIdentityCard: React.FC<ProfileIdentityCardProps> = (props) => (
    <ErrorBoundary componentName="ProfileIdentityCard">
        <ProfileIdentityCardContent {...props} />
    </ErrorBoundary>
);

export default ProfileIdentityCard;
