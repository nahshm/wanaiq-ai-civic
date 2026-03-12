import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Users, UserPlus, ShieldCheck, Vote, Calendar,
    AlertTriangle, RefreshCw, Crown, Landmark, Building2,
    ChevronDown, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ClaimPositionModal } from '@/components/governance/ClaimPositionModal';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useLeaderPositions, PositionWithHolder } from '@/hooks/useLeaderPositions';
import { buildProfileLink } from '@/lib/profile-links';

interface LeadersGridProps {
    levelType: 'COUNTY' | 'CONSTITUENCY' | 'WARD' | 'COMMUNITY';
    locationValue: string;
    communityId?: string;
}

// --- Authority Tiers ---
const AUTHORITY_TIERS = [
    { label: 'National Leadership', min: 90, max: 100, icon: Crown, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'County Executive', min: 68, max: 89, icon: Crown, color: 'text-primary' },
    { label: 'County Legislators', min: 63, max: 67, icon: Landmark, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Constituency Representatives', min: 55, max: 62, icon: Building2, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Ward Representatives', min: 40, max: 54, icon: Users, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Other Positions', min: 0, max: 39, icon: Users, color: 'text-muted-foreground' },
];

function groupByTier(positions: PositionWithHolder[]) {
    return AUTHORITY_TIERS.map(tier => ({
        ...tier,
        positions: positions.filter(p => p.authority_level >= tier.min && p.authority_level <= tier.max),
    })).filter(tier => tier.positions.length > 0);
}

// --- Skeleton ---
const PositionSkeleton: React.FC = () => (
    <Card className="animate-pulse">
        <CardContent className="p-6">
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 bg-muted rounded" />
                    <div className="h-5 w-32 bg-muted rounded" />
                    <div className="flex gap-2 mt-2">
                        <div className="h-5 w-24 bg-muted rounded" />
                        <div className="h-5 w-28 bg-muted rounded" />
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);

// --- Error State ---
const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Failed to load leaders</h3>
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
            </Button>
        </CardContent>
    </Card>
);

// --- Empty State ---
const EmptyState: React.FC<{ locationValue: string }> = ({ locationValue }) => (
    <div className="p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Leaders Registered Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Government positions for <span className="font-semibold text-foreground">{locationValue}</span> haven't been set up yet. 
            Once positions are defined, elected officials can claim and verify their offices here.
        </p>
        <p className="text-xs text-muted-foreground">
            Are you an elected official? Contact the platform to set up your constituency's governance structure.
        </p>
    </div>
);

// --- Filled Position Card ---
const FilledPositionCard: React.FC<{
    position: PositionWithHolder;
    holder: NonNullable<PositionWithHolder['current_holder']>;
    isPending?: boolean;
}> = ({ position, holder, isPending }) => {
    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' });

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const profileLink = holder.user?.username
        ? buildProfileLink({
            username: holder.user.username,
            is_verified: holder.user.is_verified,
            official_position: holder.user.official_position,
            official_position_id: holder.user.official_position_id,
        })
        : null;

    const cardContent = (
        <Card className={`transition-shadow ${isPending ? 'border-amber-500/40 bg-amber-500/5' : 'hover:shadow-md'} ${profileLink ? 'cursor-pointer hover:ring-1 hover:ring-primary/20' : ''}`}>
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    <Avatar className={`w-14 h-14 border-2 ${isPending ? 'border-amber-500/30 opacity-75' : 'border-primary/20'}`}>
                        <AvatarImage src={holder.user?.avatar_url} />
                        <AvatarFallback className={`font-bold ${isPending ? 'bg-amber-500/10 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                            {getInitials(holder.user?.display_name || 'UN')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-primary font-bold uppercase tracking-wider mb-0.5">
                            {position.title}
                        </p>
                        <h3 className="font-bold text-base truncate">
                            {holder.user?.display_name || 'Unknown'}
                        </h3>
                        {holder.user?.username && (
                            <p className="text-xs text-muted-foreground">@{holder.user.username}</p>
                        )}
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                            {isPending ? (
                                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending Verification
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                    Verified
                                </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(holder.term_start)} – {formatDate(holder.term_end)}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (profileLink) {
        return <Link to={profileLink} className="block no-underline">{cardContent}</Link>;
    }
    return cardContent;
};

// --- Vacant Position Card ---
const VacantPositionCard: React.FC<{
    position: PositionWithHolder;
    onClaimClick: (position: PositionWithHolder) => void;
}> = ({ position, onClaimClick }) => (
    <Card className="border-dashed border-muted-foreground/40 bg-muted/30">
        <CardContent className="p-5">
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                        {position.title}
                    </p>
                    <h3 className="font-bold text-base text-foreground/70">Position Vacant</h3>
                    <div className="flex gap-1.5 mt-2 flex-wrap items-center">
                        <Badge variant="outline" className="text-[10px] border-muted-foreground/40 text-muted-foreground">
                            Awaiting Claim
                        </Badge>
                        {position.next_election_date && (
                            <Badge variant="outline" className="text-[10px]">
                                <Vote className="h-3 w-3 mr-1" />
                                Next: {new Date(position.next_election_date).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                            </Badge>
                        )}
                    </div>
                    <Button size="sm" className="mt-3" onClick={() => onClaimClick(position)}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Claim This Office
                    </Button>
                </div>
            </div>
        </CardContent>
    </Card>
);

// --- Tier Section ---
const TierSection: React.FC<{
    label: string;
    icon: React.ElementType;
    color: string;
    positions: PositionWithHolder[];
    onClaimClick: (position: PositionWithHolder) => void;
    defaultOpen?: boolean;
}> = ({ label, icon: Icon, color, positions, onClaimClick, defaultOpen = true }) => {
    const filled = positions.filter(p => p.current_holder || p.pending_holder).length;

    return (
        <Collapsible defaultOpen={defaultOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-1 group">
                <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="font-semibold text-sm">{label}</span>
                    <span className="text-xs text-muted-foreground">
                        {filled}/{positions.length} filled
                    </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                    {positions.map(position => {
                        if (position.current_holder) {
                            return <FilledPositionCard key={position.id} position={position} holder={position.current_holder} />;
                        }
                        if (position.pending_holder) {
                            return <FilledPositionCard key={position.id} position={position} holder={position.pending_holder} isPending />;
                        }
                        return <VacantPositionCard key={position.id} position={position} onClaimClick={onClaimClick} />;
                    })}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

// --- Main Content ---
const LeadersGridContent: React.FC<LeadersGridProps> = ({ levelType, locationValue, communityId }) => {
    const [claimModalOpen, setClaimModalOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<{
        id: string; title: string; governanceLevel: string; jurisdictionName: string; countryCode: string;
    } | null>(null);

    const { data: positions = [], isLoading, isError, error, refetch } = useLeaderPositions({ levelType, locationValue });

    const tiers = useMemo(() => groupByTier(positions), [positions]);

    const handleClaimClick = (position: PositionWithHolder) => {
        setSelectedPosition({
            id: position.id,
            title: position.title,
            governanceLevel: position.governance_level,
            jurisdictionName: position.jurisdiction_name,
            countryCode: position.country_code,
        });
        setClaimModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-7 w-40 bg-muted rounded animate-pulse mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <PositionSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6">
                <ErrorState message={error instanceof Error ? error.message : 'Unknown error'} onRetry={() => refetch()} />
            </div>
        );
    }

    if (positions.length === 0) {
        return <EmptyState locationValue={locationValue} />;
    }

    const totalFilled = positions.filter(p => p.current_holder).length;
    const totalPending = positions.filter(p => p.pending_holder).length;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    Our Leaders
                </h2>
                <p className="text-muted-foreground text-sm">
                    {totalFilled} verified{totalPending > 0 && `, ${totalPending} pending`} of {positions.length} positions in{' '}
                    <span className="font-semibold text-foreground">{locationValue}</span>
                </p>
            </div>

            <div className="space-y-2">
                {tiers.map(tier => (
                    <TierSection
                        key={tier.label}
                        label={tier.label}
                        icon={tier.icon}
                        color={tier.color}
                        positions={tier.positions}
                        onClaimClick={handleClaimClick}
                    />
                ))}
            </div>

            <ClaimPositionModal
                isOpen={claimModalOpen}
                onClose={() => setClaimModalOpen(false)}
                position={selectedPosition}
                communityId={communityId}
            />
        </div>
    );
};

const LeadersGrid: React.FC<LeadersGridProps> = (props) => (
    <ErrorBoundary componentName="LeadersGrid">
        <LeadersGridContent {...props} />
    </ErrorBoundary>
);

export default LeadersGrid;
