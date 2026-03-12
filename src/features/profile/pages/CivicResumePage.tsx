import React, { useMemo } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Share2, Settings, Star, MapPin, Calendar, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


// Resume components (kept + reused from existing CivicResumePage)
import { ImpactSummaryCard } from '../components/resume/ImpactSummaryCard';
import { CivicExperienceList } from '../components/resume/CivicExperienceList';
import { SkillsEndorsementPanel } from '../components/resume/SkillsEndorsementPanel';
import { AchievementGallery } from '../components/resume/AchievementGallery';
import { LeaderboardRankCard } from '../components/resume/LeaderboardRankCard';
import { ActiveQuestsPanel } from '../components/resume/ActiveQuestsPanel';

// Profile components (absorbed from ProfileV2)
import { StatsOverview } from '../components/stats/StatsOverview';
import { ExpertiseGrid } from '../components/expertise/ExpertiseGrid';

// Verified badges
import { VerifiedBadge, OfficialPositionBadge, TrustedUserBadge } from '@/components/ui/verified-badge';

/** Prefix context: u=citizen, w=verified/trusted platform user, g=government official */
export type ProfilePrefix = 'u' | 'w' | 'g';

interface UserProfile {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    bio: string | null;
    isVerified: boolean;
    officialPosition: string | null;
    officialPositionId: string | null;
    county: string | null;
    constituency: string | null;
    ward: string | null;
    createdAt: string;
}

// ─── Loading skeleton ────────────────────────────────────────────────────────
const ResumeSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
                <Skeleton className="h-80 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
            </div>
            <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-96 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        </div>
    </div>
);

// ─── Context banner for /w/ trusted users ───────────────────────────────────
const TrustedUserBanner: React.FC<{ displayName: string }> = ({ displayName }) => (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-sky-500/30 bg-sky-500/5 text-sm">
        <BadgeCheck className="w-4 h-4 text-sky-500 flex-shrink-0" />
        <span className="text-sky-700 dark:text-sky-300 font-medium">
            {displayName} is a Trusted Platform Member
        </span>
        <span className="text-muted-foreground text-xs">
            — verified journalist, expert, or community leader
        </span>
    </div>
);

// ─── Context banner for /g/ officials ───────────────────────────────────────
const OfficialBanner: React.FC<{ position: string; displayName: string }> = ({ position, displayName }) => (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-blue-500/30 bg-blue-500/5 text-sm">
        <Star className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-blue-700 dark:text-blue-300 font-medium">
            {displayName}
        </span>
        <OfficialPositionBadge position={position} />
    </div>
);

// ─── Profile header (identity card inline in resume) ────────────────────────
const ResumeIdentityHeader: React.FC<{
    profile: UserProfile;
    prefix: ProfilePrefix;
    isOwnProfile: boolean;
}> = ({ profile, prefix, isOwnProfile }) => {
    const location = [profile.ward, profile.constituency, profile.county].filter(Boolean).join(', ');

    return (
        <div className="flex items-start gap-4 p-1">
            <Avatar className="w-20 h-20 border-4 border-background shadow-lg flex-shrink-0">
                <AvatarImage src={profile.avatarUrl || undefined} alt={profile.displayName} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/5">
                    {profile.displayName?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                {/* Name + badge */}
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold truncate">{profile.displayName}</h1>
                    {prefix === 'g' && profile.isVerified && (
                        <VerifiedBadge size="md" positionTitle={profile.officialPosition || undefined} />
                    )}
                    {prefix === 'w' && profile.isVerified && (
                        <TrustedUserBadge size="md" />
                    )}
                </div>

                {/* Username */}
                <p className="text-muted-foreground text-sm">@{profile.username}</p>

                {/* Bio */}
                {profile.bio && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{profile.bio}</p>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    {location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {location}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                    {prefix === 'w' && <TrustedUserBadge variant="badge" label="Trusted Member" />}
                </div>

                {/* Own profile edit link */}
                {isOwnProfile && (
                    <Button variant="outline" size="sm" className="mt-3 h-7 text-xs gap-1.5" asChild>
                        <Link to="/settings?tab=profile">
                            <Settings className="w-3 h-3" />
                            Edit Profile
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface CivicResumePageProps {
    /** Injected by PrefixRouter: 'u' | 'w' | 'g'. Falls back to URL detection. */
    context?: ProfilePrefix;
}

const CivicResumePage: React.FC<CivicResumePageProps> = ({ context }) => {
    const { username } = useParams<{ username: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Detect prefix from URL path when not injected via prop (e.g. /resume/:username)
    const prefix: ProfilePrefix = useMemo(() => {
        if (context) return context;
        const parts = location.pathname.split('/');
        const pathPrefix = parts[1] as ProfilePrefix;
        if (pathPrefix === 'u' || pathPrefix === 'w' || pathPrefix === 'g') return pathPrefix;
        return 'u'; // default: citizen view
    }, [context, location.pathname]);

    // Derive username from URL — works for both /resume/:username and /:prefix/:username
    const resolvedUsername = useMemo(() => {
        if (username) return username;
        const parts = location.pathname.split('/');
        return parts[2] || null; // /u/alice → parts[2] = 'alice'
    }, [username, location.pathname]);

    // ── Data fetching (React Query, cached 5min) ────────────────────────────
    const {
        data: profile,
        isLoading,
        isError,
        error,
    } = useQuery<UserProfile | null>({
        queryKey: ['civic-resume', resolvedUsername],
        queryFn: async (): Promise<UserProfile | null> => {
            if (!resolvedUsername) return null;

            // Detect UUID pattern
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedUsername);

            let result;
            if (isUuid) {
                // Try profiles.id first
                const { data: direct } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', resolvedUsername)
                    .maybeSingle();

                if (direct) {
                    result = direct;
                } else {
                    // Fallback: look up via office_holders
                    const { data: holder } = await supabase
                        .from('office_holders')
                        .select('user_id')
                        .eq('id', resolvedUsername)
                        .maybeSingle();

                    if (holder?.user_id) {
                        const { data } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', holder.user_id)
                            .maybeSingle();
                        result = data;
                    }
                }
            } else {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', resolvedUsername)
                    .maybeSingle();
                result = data;
            }

            if (!result) return null;

            return {
                id: result.id,
                username: result.username,
                displayName: result.display_name || result.username,
                avatarUrl: result.avatar_url,
                bannerUrl: result.banner_url,
                bio: result.bio,
                isVerified: result.is_verified ?? false,
                officialPosition: result.official_position,
                officialPositionId: result.official_position_id,
                county: result.county,
                constituency: result.constituency,
                ward: result.ward,
                createdAt: result.created_at,
            };
        },
        enabled: !!resolvedUsername,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
    });

    const isOwnProfile = !!(currentUser && profile && currentUser.id === profile.id);

    // Determine the correct canonical prefix for this user
    const correctPrefix: ProfilePrefix = useMemo(() => {
        if (!profile) return 'u';
        if (profile.officialPosition || profile.officialPositionId) return 'g';
        if (profile.isVerified) return 'w';
        return 'u';
    }, [profile]);

    // Auto-correct URL prefix if mismatched (e.g. /g/alice for a non-official)
    // Only redirect if viewing via a prefix route, not /resume/:username
    const usingPrefixRoute = ['u', 'w', 'g'].includes(location.pathname.split('/')[1]);

    React.useEffect(() => {
        if (!profile || !resolvedUsername || !usingPrefixRoute) return;
        if (prefix !== correctPrefix) {
            navigate(`/${correctPrefix}/${resolvedUsername}`, { replace: true });
        }
    }, [profile, prefix, correctPrefix, resolvedUsername, navigate, usingPrefixRoute]);

    // ── Share handler ────────────────────────────────────────────────────────
    const handleShare = async () => {
        if (!profile) return;
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${profile.displayName}'s Civic Resume`,
                    text: `Check out ${profile.displayName}'s civic impact and engagement.`,
                    url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!');
            }
        } catch {
            // User cancelled or API unavailable — silently ignore
        }
    };

    // ── States ───────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <ResumeSkeleton />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="container mx-auto px-4 py-16 text-center max-w-md space-y-4">
                <div className="bg-destructive/10 text-destructive w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold">!</span>
                </div>
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="text-muted-foreground text-sm">
                    {(error as Error)?.message || 'Unable to load this profile right now.'}
                </p>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-16 text-center max-w-md space-y-4">
                <div className="text-6xl">👤</div>
                <h1 className="text-2xl font-bold">User Not Found</h1>
                <p className="text-muted-foreground">
                    We couldn't find a profile for <strong>@{resolvedUsername}</strong>.
                </p>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background pb-12">
            {/* ── Banner ── */}
            <div className="relative h-48 md:h-64 bg-muted overflow-hidden">
                {profile.bannerUrl ? (
                    <img
                        src={profile.bannerUrl}
                        alt="Profile Banner"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                {/* Nav buttons */}
                <div className="absolute top-4 left-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-background/80 backdrop-blur"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                    {isOwnProfile && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-background/80 backdrop-blur"
                            asChild
                        >
                            <Link to="/settings?tab=profile">
                                <Settings className="w-4 h-4 mr-2" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-background/80 backdrop-blur"
                        onClick={handleShare}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                </div>
            </div>

            {/* ── Main content area ── */}
            <div className="container mx-auto px-4 max-w-6xl -mt-24 relative z-10 space-y-4">


                {/* Context banners */}
                {correctPrefix === 'w' && profile.isVerified && (
                    <TrustedUserBanner displayName={profile.displayName} />
                )}
                {correctPrefix === 'g' && profile.officialPosition && (
                    <OfficialBanner position={profile.officialPosition} displayName={profile.displayName} />
                )}

                {/* OFFICIAL SCORECARD — placeholder until new scorecard UI is built */}
                {correctPrefix === 'g' && null}

                {/* ── Two-column layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

                    {/* LEFT: Impact summary + experience + achievements + expertise */}
                    <div className="space-y-4">
                        {/* Impact/stats summary card */}
                        <ImpactSummaryCard profile={profile} isOwnProfile={isOwnProfile} />

                        {/* Civic experience timeline */}
                        <CivicExperienceList userId={profile.id} />

                        {/* Achievement gallery */}
                        <AchievementGallery userId={profile.id} />

                        {/* Expertise grid — always show; editable only for own profile */}
                        <ExpertiseGrid userId={profile.id} />
                    </div>

                    {/* RIGHT: Rank, endorsements, quests, stats */}
                    <div className="space-y-4">
                        {/* Leaderboard rank */}
                        <LeaderboardRankCard userId={profile.id} />

                        {/* Skills endorsements (editable if own profile) */}
                        <SkillsEndorsementPanel
                            userId={profile.id}
                            isOwnProfile={isOwnProfile}
                        />

                        {/* Active quests */}
                        <ActiveQuestsPanel userId={profile.id} />

                        {/* Contribution stats */}
                        <StatsOverview userId={profile.id} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CivicResumePage;
