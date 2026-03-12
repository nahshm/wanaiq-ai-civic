import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, MapPin, Star, Shield, Loader2, AlertCircle, Compass, Activity, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MemberCommunity {
    joined_at: string;
    communities: {
        id: string;
        name: string;
        display_name: string | null;
        description: string | null;
        member_count: number | null;
        category: string | null;
        avatar_url: string | null;
        banner_url: string | null;
        type: string | null;
        location_type: string | null;
    };
}

// Tier priority for sorting location communities
const TIER_ORDER: Record<string, number> = { county: 0, constituency: 1, ward: 2 };

export const MyCommunitiesPage = () => {
    const { user, profile } = useAuth();

    const { data: memberCommunities, isLoading, error, refetch } = useQuery({
        queryKey: ['my-communities', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('community_members')
                .select(`
                    joined_at,
                    communities (
                        id, name, display_name, description, member_count,
                        category, avatar_url, banner_url, type, location_type
                    )
                `)
                .eq('user_id', user.id)
                .order('joined_at', { ascending: false });

            if (error) throw error;
            return (data || []) as unknown as MemberCommunity[];
        },
        enabled: !!user?.id,
        retry: 2,
    });

    const { data: moderatedCommunities } = useQuery({
        queryKey: ['moderated-communities', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('community_moderators')
                .select(`communities ( id, name, display_name, description, member_count )`)
                .eq('user_id', user?.id);

            if (error) throw error;
            return data || [];
        },
        enabled: !!user?.id,
    });

    // Split into tier (location) vs interest communities
    const tierCommunities = (memberCommunities || [])
        .filter((m) => m.communities?.type === 'location')
        .sort((a, b) => {
            const aOrder = TIER_ORDER[a.communities?.location_type || ''] ?? 99;
            const bOrder = TIER_ORDER[b.communities?.location_type || ''] ?? 99;
            return aOrder - bOrder;
        });

    const interestCommunities = (memberCommunities || [])
        .filter((m) => m.communities?.type !== 'location');

    const modIds = new Set((moderatedCommunities || []).map((m: any) => m.communities?.id));

    if (isLoading) {
        return (
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load communities</AlertTitle>
                    <AlertDescription>
                        We couldn't load your communities. Please check your connection and try again.
                    </AlertDescription>
                </Alert>
                <div className="mt-4 flex gap-2">
                    <Button onClick={() => refetch()} variant="outline">Retry</Button>
                    <Button asChild variant="default">
                        <Link to="/communities">Browse All Communities</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-5xl mx-auto py-6 px-4 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Communities</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your civic spaces — tap to enter
                    </p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link to="/communities" className="flex items-center gap-1.5">
                        <Compass className="h-4 w-4" />
                        Explore
                    </Link>
                </Button>
            </div>

            {/* Tier Communities — Quick-Switch Tiles */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-semibold">Your Area</h2>
                    <Badge variant="secondary" className="text-xs">{tierCommunities.length}</Badge>
                </div>

                {tierCommunities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {tierCommunities.map((member) => (
                            <CommunityTile
                                key={member.communities.id}
                                community={member.communities}
                                isMod={modIds.has(member.communities.id)}
                                tierLabel={member.communities.location_type || undefined}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                            <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-3">
                                Complete your profile to auto-join location communities
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <Link to="/settings">Set Location</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Interest Communities */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-semibold">Interest Communities</h2>
                    <Badge variant="secondary" className="text-xs">{interestCommunities.length}</Badge>
                </div>

                {interestCommunities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {interestCommunities.map((member) => (
                            <CommunityTile
                                key={member.communities.id}
                                community={member.communities}
                                isMod={modIds.has(member.communities.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                            <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-3">
                                Join communities based on your interests
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <Link to="/communities">Browse Communities</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Moderated Communities */}
            {moderatedCommunities && moderatedCommunities.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-primary" />
                        <h2 className="text-lg font-semibold">You Moderate</h2>
                        <Badge variant="secondary" className="text-xs">{moderatedCommunities.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {moderatedCommunities.map((mod: any) => (
                            <CommunityTile
                                key={mod.communities.id}
                                community={mod.communities}
                                
                                isMod
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

// ─── Reusable Community Tile ────────────────────────────────────
interface CommunityTileProps {
    community: {
        id: string;
        name: string;
        display_name?: string | null;
        description?: string | null;
        member_count?: number | null;
        avatar_url?: string | null;
        location_type?: string | null;
    };
    
    isMod: boolean;
    tierLabel?: string;
}

function CommunityTile({ community, isMod, tierLabel }: CommunityTileProps) {
    const displayName = community.display_name || community.name;

    return (
        <Link to={`/c/${community.name}`}>
            <Card className="hover:border-primary/50 hover:shadow-sm transition-all h-full group">
                <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                        {community.avatar_url && <AvatarImage src={community.avatar_url} alt={displayName} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm truncate">{displayName}</span>
                            {tierLabel && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize shrink-0">
                                    {tierLabel}
                                </Badge>
                            )}
                            {isMod && (
                                <Shield className="h-3 w-3 text-primary shrink-0" />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {(community.member_count || 0).toLocaleString()} members
                        </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </CardContent>
            </Card>
        </Link>
    );
}
