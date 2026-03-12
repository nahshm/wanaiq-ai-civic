/**
 * @fileoverview Unified Feed Item Component
 * Routes feed items to the appropriate card type for the National Town Hall feed.
 */

import React from 'react';
import { PostCard } from '@/components/posts/PostCard';
import { ProjectFeedCard } from '@/components/feed/ProjectFeedCard';
import { PromiseFeedCard } from '@/components/feed/PromiseFeedCard';
import { ClipPreviewCard } from '@/components/feed/ClipPreviewCard';
import { ActivityNoticeCard } from '@/components/feed/ActivityNoticeCard';

// ============================================================================
// TYPES
// ============================================================================

export type FeedItemType =
  | 'post'
  | 'project'
  | 'promise'
  | 'clip'
  | 'post_created'
  | 'project_submitted'
  | 'project_verified'
  | 'promise_tracked'
  | 'community_joined'
  | 'community_created'
  | 'clip_uploaded'
  | 'issue_reported'
  | 'official_claimed'
  | 'achievement_earned'
  | 'quest_completed';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  user_id: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  data: any;
}

interface UnifiedFeedItemProps {
  item: FeedItem;
  onInteraction?: () => void;
  isMember?: boolean;
  onJoinCommunity?: (communityId: string, communityName: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

// Types that are noise / redundant with their primary card equivalents
const HIDDEN_TYPES = new Set(['post_created', 'comment_created', 'vote_cast']);

export function UnifiedFeedItem({ item, onInteraction, isMember, onJoinCommunity }: UnifiedFeedItemProps) {
  if (HIDDEN_TYPES.has(item.type)) return null;

  // Standard post content
  if (item.type === 'post') {
    const postData = {
      ...item.data,
      author: {
        id: item.user_id,
        username: item.username,
        displayName: item.username,
        avatar: item.avatar_url,
        isVerified: false,
        officialPosition: null
      },
      community: item.data.community_id ? {
        id: item.data.community_id,
        name: item.data.community_name,
        avatarUrl: item.data.community_icon || item.data.avatar_url,
        displayName: item.data.community_display_name || item.data.community_name,
        memberCount: 0
      } : undefined,
      createdAt: item.created_at,
      upvotes: item.data.upvotes || item.data.upvote_count || 0,
      downvotes: item.data.downvotes || item.data.downvote_count || 0,
      commentCount: item.data.comment_count || 0,
      userVote: item.data.user_vote || null,
      tags: item.data.tags || [],
      media: item.data.media || [],
      link_url: item.data.link_url || null,
      link_title: item.data.link_title || null,
      link_description: item.data.link_description || null,
      link_image: item.data.link_image || null,
    };

    return (
      <PostCard
        post={postData}
        onVote={onInteraction}
        isMember={isMember}
        onJoinCommunity={onJoinCommunity}
      />
    );
  }

  // Project submission
  if (item.type === 'project' || item.type === 'project_submitted') {
    return (
      <ProjectFeedCard
        project={item.data}
        onClick={onInteraction}
      />
    );
  }

  // Promise tracking/updates
  if (item.type === 'promise' || item.type === 'promise_tracked') {
    return (
      <PromiseFeedCard
        promise={item.data}
        onClick={onInteraction}
      />
    );
  }

  // Civic Clip video content
  if (item.type === 'clip' || item.type === 'clip_uploaded') {
    return (
      <ClipPreviewCard
        clip={item.data}
        onClick={onInteraction}
      />
    );
  }

  // Activity notices (high-value civic events)
  const activityTypes: FeedItemType[] = [
    'project_verified',
    'community_created',
    'community_joined',
    'official_claimed',
    'issue_reported',
    'achievement_earned',
    'quest_completed',
  ];

  if (activityTypes.includes(item.type)) {
    return (
      <ActivityNoticeCard
        activity={{
          ...item.data,
          activity_type: item.type,
          username: item.username,
          avatar_url: item.avatar_url
        }}
        onClick={onInteraction}
      />
    );
  }

  console.warn('[UnifiedFeedItem] Unknown feed item type:', item.type);
  return null;
}

/**
 * Feed item skeleton loader
 */
export function UnifiedFeedItemSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-muted rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-32 mb-2" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    </div>
  );
}
