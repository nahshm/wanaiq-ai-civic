import React, { useState } from 'react';
import { Post } from '@/types';
import { PostCard } from '@/components/posts/PostCard';
import { CreatePostInput } from '@/components/community/CreatePostInput';
import { Card, CardContent } from '@/components/ui/card';
import LeadersGrid from './LeadersGrid';
import ProjectsGrid from './ProjectsGrid';
import PromisesGrid from './PromisesGrid';
import ForumChannel from './ForumChannel';
import { GovernmentProject } from '@/types';
import { ChannelChatWindow } from '@/components/chat/ChannelChatWindow';
import { SectionErrorBoundary } from '@/components/community/CommunityErrorBoundary';
import { FeedSortBar } from '@/components/feed/FeedSortBar';
import { UnifiedFeedItem, UnifiedFeedItemSkeleton } from '@/components/feed/UnifiedFeedItem';
import { EmptyFeedState } from '@/components/feed/EmptyFeedState';
import { useUnifiedFeed } from '@/hooks/useUnifiedFeed';
import { useAuth } from '@/contexts/AuthContext';
import { useInView } from 'react-intersection-observer';
import { Video, Mic } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChannelContentProps {
    channelId: string;
    levelType: 'COUNTY' | 'CONSTITUENCY' | 'WARD' | 'COMMUNITY';
    locationValue: string;
    posts: Post[];
    projects: GovernmentProject[];
    postsLoading: boolean;
    projectsLoading: boolean;
    isAdmin?: boolean;
    communityId?: string;
    channel?: {
        id: string;
        name: string;
        type: string;
        category: string;
        is_locked?: boolean;
    };
}

/** Community Feed using the unified feed RPC */
const CommunityUnifiedFeed: React.FC<{ communityId: string; communityName?: string }> = ({ communityId, communityName }) => {
    const { user } = useAuth();
    const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('new');
    const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');

    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useUnifiedFeed({
        userId: user?.id,
        communityId,
        sortBy,
        limit: 15,
    });

    const { ref: loadMoreRef } = useInView({
        onChange: (inView) => {
            if (inView && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
    });

    const feedItems = data?.pages.flat() ?? [];

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                <CreatePostInput communityId={communityId} communityName={communityName} />
                <FeedSortBar
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
                <div className="mt-2 space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            <UnifiedFeedItemSkeleton />
                            <UnifiedFeedItemSkeleton />
                            <UnifiedFeedItemSkeleton />
                        </div>
                    ) : feedItems.length > 0 ? (
                        <>
                            {feedItems.map(item => (
                                <UnifiedFeedItem key={item.id} item={item} />
                            ))}
                            <div ref={loadMoreRef}>
                                {isFetchingNextPage && <UnifiedFeedItemSkeleton />}
                                {!hasNextPage && feedItems.length > 0 && (
                                    <p className="text-center text-muted-foreground text-sm py-8">
                                        You've reached the end
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <EmptyFeedState />
                    )}
                </div>
            </div>
        </div>
    );
};

/** Baraza Coming Soon placeholder */
const BarazaPlaceholder: React.FC<{ channelName: string }> = ({ channelName }) => (
    <div className="flex flex-col items-center justify-center p-12 h-full min-h-[400px]">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Video className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Baraza — Coming Soon</h2>
        <p className="text-muted-foreground text-center max-w-md mb-4">
            Live audio & video community gatherings are being built. 
            Soon you'll be able to host and join real-time civic discussions here.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mic className="w-4 h-4" />
            <span>Voice & Video Rooms</span>
        </div>
    </div>
);

const ChannelContent: React.FC<ChannelContentProps> = ({
    channelId,
    levelType,
    locationValue,
    posts,
    projects,
    postsLoading,
    projectsLoading,
    isAdmin = false,
    communityId,
    channel
}) => {
    // Early return if channel data hasn't loaded yet
    if (!channel && channelId) {
        return (
            <div className="flex items-center justify-center p-8 h-full">
                <div className="text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading channel...</span>
                </div>
            </div>
        );
    }

    // 1. MONITORING CHANNELS (Grid Views) — wrapped in scroll container
    if (channel?.category === 'MONITORING' || ['our-leaders', 'projects-watch', 'promises-watch'].includes(channel?.name || '')) {
        if (channel?.name === 'our-leaders') {
            if (levelType === 'COMMUNITY') {
            return <ScrollArea className="flex-1"><div className="p-8 text-center text-muted-foreground">Global Identity features are only available for geographic communities (County/Constituency/Ward).</div></ScrollArea>;
            }
            return (
                <ScrollArea className="flex-1">
                    <SectionErrorBoundary section="Leaders Grid">
                        <LeadersGrid levelType={levelType} locationValue={locationValue} communityId={communityId} />
                    </SectionErrorBoundary>
                </ScrollArea>
            );
        }
        if (channel?.name === 'projects-watch') {
            return (
                <ScrollArea className="flex-1">
                    <SectionErrorBoundary section="Projects Watch">
                        <ProjectsGrid projects={projects} loading={projectsLoading} />
                    </SectionErrorBoundary>
                </ScrollArea>
            );
        }
        if (channel?.name === 'promises-watch') {
            if (levelType === 'COMMUNITY') return null;
            return (
                <ScrollArea className="flex-1">
                    <SectionErrorBoundary section="Promises Watch">
                        <PromisesGrid levelType={levelType} locationValue={locationValue} />
                    </SectionErrorBoundary>
                </ScrollArea>
            );
        }
    }

    // 2. FORUM CHANNELS (Thread-based discussions)
    if (channel?.type === 'forum') {
        return (
            <ForumChannel
                channelId={channel.id}
                channelName={channel.name}
                communityId={communityId || ''}
            />
        );
    }

    // 3. VIDEO CHANNELS (Baraza — Coming Soon)
    if (channel?.type === 'video') {
        return <ScrollArea className="flex-1"><BarazaPlaceholder channelName={channel.name} /></ScrollArea>;
    }

    // 4. CHAT CHANNELS (Text/Voice/Announcement)
    if (channel?.type === 'text' || channel?.type === 'announcement' || channel?.type === 'voice' || channel?.type === 'chat') {
        const isReadOnly = channel.type === 'announcement' && !isAdmin;
        return (
            <ChannelChatWindow
                channelId={channel.id}
                channelName={channel.name}
                isReadOnly={isReadOnly}
            />
        );
    }

    // 5. FEED CHANNELS — Use unified feed with sort/infinite scroll
    if (channel?.type === 'feed' && communityId) {
        return <ScrollArea className="flex-1"><CommunityUnifiedFeed communityId={communityId} communityName={channel?.name} /></ScrollArea>;
    }

    // 6. FALLBACK: POST FEED (Legacy)
    return (
        <ScrollArea className="flex-1">
            <div className="p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    <CreatePostInput />
                    <div className="mt-4 space-y-4">
                        {postsLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Card key={i} className="animate-pulse">
                                        <CardContent className="p-6">
                                            <div className="h-32 bg-muted rounded" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : posts.length > 0 ? (
                            posts.map((post) => (
                                <PostCard key={post.id} post={post} onVote={() => { }} />
                            ))
                        ) : (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <p className="text-muted-foreground">
                                        No posts yet in this channel. Be the first to post!
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
};

export default ChannelContent;
