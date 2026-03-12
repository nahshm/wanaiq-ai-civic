import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { useGeoLocation, SUPPORTED_COUNTRIES } from '@/hooks/useGeoLocation';
import { ClaimPositionModal } from '@/components/governance/ClaimPositionModal';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { Link } from 'react-router-dom';
import {
  Search, Eye, Share2, MapPin, ShieldCheck, UserPlus,
  Globe, Loader2, ChevronRight, Building2, Landmark, Users
} from 'lucide-react';

const PAGE_SIZE = 24;

/** Build the position-first office URL directly from DB position_code.
 * position_code format = "KE:nairobi:governor" → /office/ke/county/nairobi/governor
 */
function buildOfficeUrl(pos: Pick<PositionWithHolder, 'country_code' | 'governance_level' | 'position_code'>): string {
  const country = pos.country_code.toLowerCase();
  const level = pos.governance_level.toLowerCase();
  // position_code = "KE:nairobi:governor" — take parts after country prefix
  const parts = pos.position_code.split(':');
  // parts[0] = country, parts[1] = jurisdiction slug, parts[2] = role slug
  const jurisdictionSlug = (parts[1] || '').toLowerCase();
  const roleSlug = (parts[2] || '').toLowerCase();
  return `/office/${country}/${level}/${jurisdictionSlug}/${roleSlug}`;
}

// Governance levels with icons
const GOVERNANCE_LEVELS = [
  { value: 'all', label: 'All Levels', icon: Globe },
  { value: 'national', label: 'National', icon: Landmark },
  { value: 'county', label: 'County', icon: Building2 },
  { value: 'constituency', label: 'Constituency', icon: MapPin },
  { value: 'ward', label: 'Ward', icon: Users },
];

interface PositionWithHolder {
  id: string;
  country_code: string;
  governance_level: string;
  jurisdiction_name: string;
  jurisdiction_code: string | null;
  position_code: string;
  title: string;
  term_years: number | null;
  is_elected: boolean | null;
  current_holder: {
    id: string;
    term_start: string;
    term_end: string;
    verification_status: string;
    user?: {
      id: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
}

// Fetch positions with office holders - for infinite query
const fetchPositionsPage = async (
  countryCode: string,
  level: string,
  search: string,
  pageParam: number = 0
): Promise<{ positions: PositionWithHolder[]; nextPage: number | undefined; totalCount: number }> => {
  let query = supabase
    .from('government_positions')
    .select(`
            id,
            country_code,
            governance_level,
            jurisdiction_name,
            jurisdiction_code,
            position_code,
            title,
            term_years,
            is_elected
        `, { count: 'exact' })
    .eq('country_code', countryCode);

  // Filter by governance level
  if (level !== 'all') {
    query = query.eq('governance_level', level);
  }

  // Search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,jurisdiction_name.ilike.%${search}%`);
  }

  // Pagination and ordering
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  query = query
    .order('governance_level', { ascending: true })
    .order('jurisdiction_name', { ascending: true })
    .order('title', { ascending: true })
    .range(from, to);

  const { data: positions, error, count } = await query;

  if (error) throw error;

  // Fetch office holders for these positions
  const positionIds = (positions || []).map(p => p.id);

  interface HolderRow {
    id: string;
    position_id: string;
    user_id: string;
    term_start: string;
    term_end: string;
    verification_status: string;
    user?: { id: string; display_name: string; avatar_url: string | null } | null;
  }

  let holdersData: HolderRow[] = [];
  if (positionIds.length > 0) {
    const { data } = await supabase
      .from('office_holders')
      .select(`
                id,
                position_id,
                user_id,
                term_start,
                term_end,
                verification_status
            `)
      .in('position_id', positionIds)
      .eq('is_active', true);

    holdersData = data || [];

    // Fetch profiles for holders separately
    if (holdersData.length > 0) {
      const userIds = holdersData.map(h => h.user_id).filter(Boolean);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map((profiles || []).map(p => [p.id, p]));
        holdersData = holdersData.map(h => ({
          ...h,
          user: profilesMap.get(h.user_id) || null
        }));
      }
    }
  }

  // Map holders to positions
  const holdersMap = new Map(holdersData.map(h => [h.position_id, h]));

  const positionsWithHolders: PositionWithHolder[] = (positions || []).map(pos => ({
    ...pos,
    current_holder: holdersMap.get(pos.id) || null,
  }));

  const totalCount = count || 0;
  const hasMore = from + positionsWithHolders.length < totalCount;

  return {
    positions: positionsWithHolders,
    nextPage: hasMore ? pageParam + 1 : undefined,
    totalCount,
  };
};

const Officials = () => {
  const navigate = useNavigate();
  const geoLocation = useGeoLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  // Claim Modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    id: string;
    title: string;
    governanceLevel: string;
    jurisdictionName: string;
    countryCode: string;
  } | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const countryCode = geoLocation.countryCode || 'KE';

  // Infinite Query for paginated positions
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['unified-positions', countryCode, selectedLevel, debouncedSearch],
    queryFn: ({ pageParam = 0 }) => fetchPositionsPage(countryCode, selectedLevel, debouncedSearch, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 60 * 1000,
    enabled: !geoLocation.isLoading,
  });

  // Flatten all pages into single array
  const positions = data?.pages.flatMap(page => page.positions) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const getVerificationBadge = (status: string | null) => {
    if (status === 'verified') {
      return (
        <Badge className="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 text-[10px]">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }
    if (status === 'pending') {
      return (
        <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-600 dark:text-yellow-400">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
    return null;
  };

  const getLevelIcon = (level: string) => {
    const found = GOVERNANCE_LEVELS.find(l => l.value === level);
    return found ? found.icon : Globe;
  };

  // Open claim modal with pre-filled position data
  const handleClaimPosition = (position: PositionWithHolder) => {
    setSelectedPosition({
      id: position.id,
      title: position.title,
      governanceLevel: position.governance_level,
      jurisdictionName: position.jurisdiction_name,
      countryCode: position.country_code,
    });
    setClaimModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Government Officials</h1>
            <p className="text-muted-foreground">
              Find and connect with elected representatives
            </p>
          </div>

          {/* Country Selector */}
          <div className="flex items-center gap-2">
            <Select
              value={countryCode}
              onValueChange={(v) => geoLocation.setManualLocation(v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_COUNTRIES.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {geoLocation.source === 'gps' && (
              <Badge variant="outline" className="text-[10px]">
                <MapPin className="h-3 w-3 mr-1" />
                GPS
              </Badge>
            )}
            {geoLocation.source === 'ip' && (
              <Badge variant="outline" className="text-[10px]">
                <Globe className="h-3 w-3 mr-1" />
                Auto
              </Badge>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, position, or jurisdiction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {isFetching && !isFetchingNextPage && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                {geoLocation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <span>Showing {positions.length} of {totalCount} positions</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Governance Level Tabs */}
        <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {GOVERNANCE_LEVELS.map((level) => {
              const Icon = level.icon;
              return (
                <TabsTrigger key={level.value} value={level.value} className="text-xs lg:text-sm flex items-center gap-1">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{level.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedLevel} className="mt-6">
            {isLoading || geoLocation.isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading positions...</span>
              </div>
            ) : positions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Landmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Positions Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? 'No positions match your search criteria.'
                      : `No positions defined for ${geoLocation.country || 'this country'} yet.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {positions.map((position) => {
                    const LevelIcon = getLevelIcon(position.governance_level);
                    const hasHolder = !!position.current_holder;

                    return (
                      <Card
                        key={position.id}
                        className={`hover:shadow-md transition-shadow ${!hasHolder ? 'border-dashed border-muted-foreground/40 bg-muted/30' : ''
                          }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <LevelIcon className="h-3 w-3" />
                            <span className="capitalize">{position.governance_level}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="truncate">{position.jurisdiction_name}</span>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          {hasHolder ? (
                            <div className="flex items-start gap-3">
                              <Avatar className="w-12 h-12 border-2 border-primary/20">
                                <AvatarImage src={position.current_holder?.user?.avatar_url || undefined} />
                                <AvatarFallback>
                                  {getInitials(position.current_holder?.user?.display_name || 'UN')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-primary font-semibold uppercase tracking-wide">
                                  {position.title}
                                </p>
                                <h3 className="font-bold text-base truncate">
                                  {position.current_holder?.user?.display_name || 'Unknown'}
                                </h3>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {getVerificationBadge(position.current_holder?.verification_status || null)}
                                  <Badge variant="outline" className="text-[10px]">
                                    {formatDate(position.current_holder?.term_start || '')} - {formatDate(position.current_holder?.term_end || '')}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center">
                                <UserPlus className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                                  {position.title}
                                </p>
                                <h3 className="font-bold text-base text-foreground/70">
                                  Position Vacant
                                </h3>
                                <Badge variant="outline" className="mt-2 text-[10px] border-muted-foreground/40 text-muted-foreground">
                                  Awaiting Claim
                                </Badge>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 mt-4">
                            {/* Always-visible: View Office Hub */}
                            <Link
                              to={buildOfficeUrl(position)}
                              className="flex-1"
                            >
                              <Button
                                variant={hasHolder ? 'default' : 'outline'}
                                size="sm"
                                className="w-full"
                              >
                                <Landmark className="w-4 h-4 mr-1" />
                                View Office
                              </Button>
                            </Link>

                            {/* Secondary: View holder profile (only if claimed) */}
                            {hasHolder && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/g/${position.current_holder!.user!.id}`)}
                                title="View holder's profile"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Claim (vacant only) */}
                            {!hasHolder && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleClaimPosition(position)}
                                title="Claim this position"
                              >
                                <UserPlus className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Share */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const url = `${window.location.origin}${buildOfficeUrl(position)}`;
                                copyToClipboard(url, 'Office link copied!');
                              }}
                              title="Copy office link"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Load More */}
                {hasNextPage && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Load More (${totalCount - positions.length} remaining)`
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Claim Position Modal */}
      <ClaimPositionModal
        isOpen={claimModalOpen}
        onClose={() => {
          setClaimModalOpen(false);
          setSelectedPosition(null);
        }}
        position={selectedPosition}
        communityId={undefined} // No community context from Officials page
      />
    </div>
  );
};

export default Officials;
