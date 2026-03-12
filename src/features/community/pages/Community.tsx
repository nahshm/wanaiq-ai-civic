import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CommunityProfile } from '@/types/index';

// New optimized hooks
import { useCommunity } from '@/hooks/useCommunity';
import { useGeographicCommunities } from '@/hooks/useGeographicCommunities';
import { useJoinedCommunities } from '@/hooks/useJoinedCommunities';
import { useChannelContent } from '@/hooks/useChannelContent';
import { useQueryClient } from '@tanstack/react-query';

// Components
import { CommunitySidebar } from '@/components/community/CommunitySidebar';
import { SectionErrorBoundary } from '@/components/community/CommunityErrorBoundary';
import { ScrollArea } from '@/components/ui/scroll-area';
import LevelSelector from '@/components/community/discord/LevelSelector';
import ChannelList from '@/components/community/discord/ChannelList';
import ChannelContent from '@/components/community/discord/ChannelContent';
import { CreateChannelDialog } from '@/components/community/discord/CreateChannelDialog';
import { CommunityEventsWidget } from '@/components/community/events/CommunityEventsWidget';
import { CommunityPollsWidget } from '@/components/community/polls/CommunityPollsWidget';
import { CommunitySetupReminder } from '@/components/community/CommunitySetupReminder';
import { PlatformTour } from '@/components/community/PlatformTour';
import { CommunitySettingsDialog } from '@/components/community/CommunitySettingsDialog';
import { Menu, X, Loader2 } from 'lucide-react'; // Original lucide-react import

// Loading skeleton component
const CommunityLoadingSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
      <div className="h-20 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);

// Not found component
const CommunityNotFound = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Community not found</h1>
      <p className="text-gray-600">The community you're looking for doesn't exist.</p>
    </div>
  </div>
);

// Error state component
const CommunityErrorState = ({ error, onRetry }: { error: any; onRetry: () => void }) => (
  <div className="container mx-auto px-4 py-8">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4 text-destructive">Failed to load community</h1>
      <p className="text-muted-foreground mb-4">
        {error?.message || 'An error occurred while loading the community'}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Try Again
      </button>
    </div>
  </div>
);

const Community = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State for UI interactions
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);

  // Local channels for optimistic updates when new channel created
  const [newChannels, setNewChannels] = useState<any[]>([]);

  // Data fetching with new optimized hooks
  const {
    community,
    moderators,
    rules,
    flairs,
    channels,
    isMember,
    isModerator,
    isAdmin,
    isLoading,
    error,
    refetch,
  } = useCommunity(communityName);

  const { geoCommunities } = useGeographicCommunities();
  const { joinedCommunities } = useJoinedCommunities(geoCommunities);

  // Combine fetched channels with optimistically added ones
  const allChannels = useMemo(() => {
    const combined = [...channels, ...newChannels];
    // Dedupe by id
    const seen = new Set<string>();
    return combined.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [channels, newChannels]);

  // Find active channel from combined list
  const activeChannel = useMemo(() =>
    allChannels.find(c => c.id === activeChannelId),
    [allChannels, activeChannelId]
  );

  // Memoize community object for useChannelContent to prevent undefined communityId
  const channelContentCommunity = useMemo(() => {
    if (!community?.id) return undefined;
    return {
      id: community.id,
      locationType: community.locationType,
      locationValue: community.locationValue
    };
  }, [community?.id, community?.locationType, community?.locationValue]);

  // Fetch channel-specific content
  const { posts, projects } = useChannelContent(
    community?.id,
    activeChannel,
    channelContentCommunity
  );

  // Track if we've set the initial channel (using ref to avoid re-renders)
  const hasSetInitialChannel = useRef(false);

  // Set default active channel when channels load
  // Priority: feed/posts channels first (user content), then text channels, then announcements
  React.useEffect(() => {
    if (allChannels.length > 0 && !activeChannelId && !hasSetInitialChannel.current) {
      const defaultChannel =
        // First priority: feed-type channels (user posts)
        allChannels.find((c: any) => c.type === 'feed') ||
        allChannels.find((c: any) => c.name === 'posts' || c.name === 'feed') ||
        // Second priority: text channels
        allChannels.find((c: any) => c.type === 'text') ||
        allChannels.find((c: any) => c.name === 'general-chat' || c.name === 'general') ||
        // Third priority: announcements
        allChannels.find((c: any) => c.type === 'announcement') ||
        // Fallback: first channel
        allChannels[0];
      if (defaultChannel) {
        hasSetInitialChannel.current = true;
        setActiveChannelId(defaultChannel.id);
      }
    }
  }, [allChannels.length, activeChannelId]);

  // Reset the ref when community changes + CLEAR CACHE
  React.useEffect(() => {
    hasSetInitialChannel.current = false;
    setActiveChannelId('');
    setNewChannels([]);

    // Clear all channel-related queries for clean slate
    queryClient.removeQueries({ queryKey: ['channelPosts'] });
    queryClient.removeQueries({ queryKey: ['channelProjects'] });
    queryClient.removeQueries({ queryKey: ['channelMembers'] });
  }, [communityName, queryClient]);

  // Build levels for navigation
  const primaryLevels = useMemo(() => [
    {
      id: 'county',
      name: geoCommunities.county?.displayName || 'County',
      type: 'COUNTY' as const,
      avatarUrl: geoCommunities.county?.avatarUrl,
      communitySlug: geoCommunities.county?.name,
      isActive: community?.id === geoCommunities.county?.id
    },
    {
      id: 'constituency',
      name: geoCommunities.constituency?.displayName || 'Constituency',
      type: 'CONSTITUENCY' as const,
      avatarUrl: geoCommunities.constituency?.avatarUrl,
      communitySlug: geoCommunities.constituency?.name,
      isActive: community?.id === geoCommunities.constituency?.id
    },
    {
      id: 'ward',
      name: geoCommunities.ward?.displayName || 'Ward',
      type: 'WARD' as const,
      avatarUrl: geoCommunities.ward?.avatarUrl,
      communitySlug: geoCommunities.ward?.name,
      isActive: community?.id === geoCommunities.ward?.id
    },
  ], [geoCommunities, community?.id]);

  const secondaryLevels = useMemo(() =>
    joinedCommunities.map(c => ({
      id: c.id,
      name: c.displayName,
      type: 'COMMUNITY' as const,
      avatarUrl: c.avatarUrl,
      communitySlug: c.name,
      isActive: community?.id === c.id
    })),
    [joinedCommunities, community?.id]
  );

  const levels = useMemo(() => [
    ...primaryLevels.filter(l => l.communitySlug),
    ...(secondaryLevels.length > 0 ? [{ type: 'SEPARATOR' as const, id: 'sep-1', name: '', isActive: false }] : []),
    ...secondaryLevels
  ], [primaryLevels, secondaryLevels]);

  const currentLevel = useMemo(() => {
    // Try to find active level from primary/secondary levels
    const activeLevel = [...primaryLevels, ...secondaryLevels].find(l => l.isActive);
    if (activeLevel) return activeLevel;

    // For non-logged-in users OR when viewing a geographic community directly
    if (community?.locationType) {
      const typeMap: Record<string, 'COUNTY' | 'CONSTITUENCY' | 'WARD'> = {
        'county': 'COUNTY',
        'constituency': 'CONSTITUENCY',
        'ward': 'WARD'
      };
      return {
        name: community.locationValue || community.displayName || 'Community',
        type: typeMap[community.locationType] || 'COMMUNITY' as const
      };
    }

    // Final fallback
    return { name: community?.displayName || 'Community', type: 'COMMUNITY' as const };
  }, [primaryLevels, secondaryLevels, community]);

  // Handle new channel creation (optimistic update)
  const handleChannelCreated = useCallback((newChannel: any) => {
    setNewChannels(prev => [...prev, {
      id: newChannel.id,
      name: newChannel.name,
      category: newChannel.type === 'announcement' ? 'INFO' : 'ENGAGEMENT',
      type: newChannel.type
    }]);
    // Refetch to sync with server
    refetch();
  }, [refetch]);

  // Render states
  if (isLoading) {
    return <CommunityLoadingSkeleton />;
  }

  if (error) {
    return <CommunityErrorState error={error} onRetry={() => refetch()} />;
  }

  if (!community) {
    return <CommunityNotFound />;
  }

  return (
    <div className="h-full bg-background overflow-hidden">
      <div className="flex h-full w-full overflow-hidden bg-background relative min-h-0">

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="absolute inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Left Navigation (Level Rail + Channel List) */}
        <div className={`
          flex h-full min-h-0 transition-transform duration-300 ease-in-out bg-background
          md:relative md:translate-x-0 md:flex-shrink-0 md:z-0
          absolute inset-y-0 left-0 z-40 shadow-2xl md:shadow-none
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          max-w-[300px] md:max-w-none
        `}>
          {/* Level Selector Rail */}
          <LevelSelector levels={levels} />

          {/* Channel List */}
          <ChannelList
            channels={allChannels}
            activeChannel={activeChannelId}
            onChange={(channelId) => {
              setActiveChannelId(channelId);
              setMobileMenuOpen(false);
            }}
            levelName={currentLevel.name}
            isAdmin={isAdmin}
            isTierCommunity={community?.type === 'location'}
            onAddChannel={() => setCreateChannelOpen(true)}
          />
        </div>

        {/* Main Content Area - overflow-hidden so child components manage their own scroll */}
        <div data-tour="tour-main-content" className="flex-1 flex flex-col overflow-hidden bg-background min-h-0 min-w-0">
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h2 className="font-bold text-foreground flex items-center gap-2">
              {activeChannelId === 'virtual-events' ? (
                <><span>📅</span> Upcoming Events</>
              ) : activeChannelId === 'virtual-polls' ? (
                <><span>📊</span> Active Polls</>
              ) : (
                `#${allChannels.find(c => c.id === activeChannelId)?.name || 'channel'}`
              )}
            </h2>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Admin/Mod Setup Reminder */}
          <CommunitySetupReminder
            communityId={community.id}
            hasAvatar={!!community.avatarUrl}
            hasBanner={!!community.bannerUrl}
            hasRules={rules.length > 0}
            isAdmin={isAdmin}
            isModerator={isModerator}
            onUpdateNow={() => settingsTriggerRef.current?.click()}
          />

          {/* Channel Content */}
          {activeChannelId && !activeChannel && !activeChannelId.startsWith('virtual-') ? (
            <div className="flex items-center justify-center p-8 h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                <span className="text-sm text-muted-foreground">Loading channel...</span>
              </div>
            </div>
          ) : activeChannelId === 'virtual-events' ? (
            <ScrollArea className="flex-1">
              <div className="p-4 md:p-8 max-w-3xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">📅 Upcoming Events</h2>
                  <p className="text-muted-foreground">Join or schedule civic events in your community.</p>
                </div>
                <CommunityEventsWidget communityId={community.id} community={community} isAdmin={isAdmin} />
              </div>
            </ScrollArea>
          ) : activeChannelId === 'virtual-polls' ? (
            <ScrollArea className="flex-1">
              <div className="p-4 md:p-8 max-w-3xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">📊 Active Polls</h2>
                  <p className="text-muted-foreground">Have your voice heard on important civic matters.</p>
                </div>
                <CommunityPollsWidget communityId={community.id} community={community} isAdmin={isAdmin} />
              </div>
            </ScrollArea>
          ) : (
            <ChannelContent
              channelId={activeChannelId}
              channel={activeChannel}
              levelType={currentLevel.type}
              locationValue={currentLevel.name}
              communityId={community.id}
              posts={posts}
              projects={projects}
              postsLoading={false}
              projectsLoading={false}
              isAdmin={isAdmin}
            />
          )}
        </div>

        {/* Right Sidebar - Fixed + Responsive */}
        <aside data-tour="tour-sidebar" className="hidden xl:block xl:w-80 2xl:w-96 flex-shrink-0">
          <div className="fixed top-16 right-0 xl:w-80 2xl:w-96 h-[calc(100vh-4rem)] border-l border-sidebar-border bg-sidebar-background">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4 sm:space-y-6">
              <SectionErrorBoundary section="Community Sidebar">
                <CommunitySidebar
                  community={community}
                  rules={rules}
                  moderators={moderators}
                  flairs={flairs}
                  isAdmin={isAdmin}
                />
              </SectionErrorBoundary>
              </div>
            </ScrollArea>
          </div>
        </aside>
      </div>

      {/* Create Channel Dialog */}
      {community && (
        <CreateChannelDialog
          isOpen={createChannelOpen}
          onClose={() => setCreateChannelOpen(false)}
          communityId={community.id}
          onChannelCreated={handleChannelCreated}
          isTierCommunity={community.type === 'location'}
        />
      )}

      {/* Settings Dialog (opened from setup reminder) */}
      {community && (
        <CommunitySettingsDialog
          community={community}
          onUpdate={() => refetch()}
          trigger={
            <button ref={settingsTriggerRef} data-tour="tour-settings" className="hidden" aria-hidden="true" />
          }
        />
      )}

      {/* Platform Navigation Tour */}
      <PlatformTour
        communityId={community.id}
        isAdmin={isAdmin}
        isModerator={isModerator}
        userId={user?.id}
      />
    </div>
  );
};

export default Community;
