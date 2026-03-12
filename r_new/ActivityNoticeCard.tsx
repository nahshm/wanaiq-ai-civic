/**
 * @fileoverview Activity Notice Card Component
 * @module components/feed
 * 
 * Displays user actions like community joins, project verifications,
 * and other civic activities in the unified feed.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Shield,
  Star,
  UserPlus,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityType } from '@/lib/activityLogger';

// ============================================================================
// TYPES
// ============================================================================

interface ActivityNotice {
  id: string;
  activity_type: ActivityType;
  user_id: string;
  username?: string;
  avatar_url?: string;
  target_id?: string;
  target_type?: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface ActivityNoticeCardProps {
  activity: ActivityNotice;
  onClick?: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get activity verb for display
 */
function getActivityVerb(type: ActivityType): string {
  const verbs: Record<ActivityType, string> = {
    post_created: 'created a post',
    project_submitted: 'submitted a project',
    project_verified: 'verified',
    promise_tracked: 'started tracking',
    promise_updated: 'updated',
    quest_completed: 'completed',
    community_joined: 'joined',
    community_created: 'created',
    clip_uploaded: 'uploaded',
    issue_reported: 'reported an issue in',
    official_claimed: 'claimed position',
    achievement_earned: 'earned',
    comment_created: 'commented on',
    vote_cast: 'voted on'
  };

  return verbs[type] || 'performed an action';
}

/**
 * Get activity icon
 */
function getActivityIcon(type: ActivityType) {
  const icons: Record<ActivityType, React.ElementType> = {
    post_created: AlertCircle,
    project_submitted: Building2,
    project_verified: CheckCircle,
    promise_tracked: Star,
    promise_updated: Star,
    quest_completed: Star,
    community_joined: Users,
    community_created: Users,
    clip_uploaded: AlertCircle,
    issue_reported: AlertCircle,
    official_claimed: Shield,
    achievement_earned: Star,
    comment_created: AlertCircle,
    vote_cast: AlertCircle
  };

  return icons[type] || AlertCircle;
}

/**
 * Get target URL from activity
 */
function getTargetUrl(activity: ActivityNotice): string {
  const { target_type, target_id } = activity;

  if (!target_type || !target_id) return '#';

  const urlMap: Record<string, (id: string) => string> = {
    post: (id) => `/post/${id}`,
    project: (id) => `/p/${id}`,
    promise: (id) => `/pr/${id}`,
    community: (id) => `/c/${id}`,
    clip: (id) => `/civic-clips/${id}`,
    issue: (id) => `/dashboard/report/${id}`,
    official: (id) => `/g/${id}`,
    quest: (id) => `/quests/${id}`,
    achievement: () => `/profile?tab=achievements`
  };

  const urlBuilder = urlMap[target_type];
  return urlBuilder ? urlBuilder(target_id) : '#';
}

/**
 * Get target display name from metadata
 */
function getTargetName(activity: ActivityNotice): string {
  const { activity_type, metadata } = activity;

  const nameMap: Record<string, string> = {
    community_joined: metadata.community_name,
    community_created: metadata.community_name,
    project_submitted: metadata.name,
    project_verified: metadata.project_name,
    promise_tracked: metadata.promise_title,
    clip_uploaded: metadata.title,
    issue_reported: metadata.location || metadata.issue_type,
    official_claimed: metadata.position_title,
    quest_completed: metadata.quest_title,
    achievement_earned: metadata.achievement_name
  };

  return nameMap[activity_type] || 'something';
}

/**
 * Get activity color theme
 */
function getActivityTheme(type: ActivityType) {
  const themes: Record<string, string> = {
    community: 'border-blue-500/20 bg-blue-500/5',
    project: 'border-civic-green/20 bg-civic-green/5',
    verification: 'border-emerald-500/20 bg-emerald-500/5',
    official: 'border-amber-500/20 bg-amber-500/5',
    achievement: 'border-purple-500/20 bg-purple-500/5',
    default: 'border-border bg-muted/30'
  };

  if (type.includes('community')) return themes.community;
  if (type.includes('project')) return themes.project;
  if (type.includes('verified')) return themes.verification;
  if (type.includes('official')) return themes.official;
  if (type.includes('achievement') || type.includes('quest')) return themes.achievement;

  return themes.default;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActivityNoticeCard({ activity, onClick }: ActivityNoticeCardProps) {
  const Icon = getActivityIcon(activity.activity_type);
  const verb = getActivityVerb(activity.activity_type);
  const targetName = getTargetName(activity);
  const targetUrl = getTargetUrl(activity);
  const theme = getActivityTheme(activity.activity_type);

  return (
    <Card 
      className={`border-dashed hover:border-solid transition-all cursor-pointer ${theme}`}
      onClick={onClick}
    >
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          {/* User avatar */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={activity.avatar_url} />
            <AvatarFallback>
              {activity.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Activity content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <Link 
                to={`/u/${activity.username}`} 
                className="font-semibold hover:underline"
              >
                {activity.username || 'Someone'}
              </Link>
              {' '}{verb}{' '}
              {targetUrl !== '#' ? (
                <Link 
                  to={targetUrl} 
                  className="font-semibold hover:underline text-civic-green"
                >
                  {targetName}
                </Link>
              ) : (
                <span className="font-semibold">{targetName}</span>
              )}
            </p>

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>

            {/* Additional metadata if relevant */}
            {activity.metadata.location && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 {activity.metadata.location}
              </p>
            )}
          </div>

          {/* Activity type icon */}
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Special variant for high-impact activities (official claims, major verifications)
 */
export function HighlightedActivityCard({ activity }: ActivityNoticeCardProps) {
  const isHighImpact = 
    activity.activity_type === 'official_claimed' ||
    activity.activity_type === 'community_created' ||
    activity.activity_type === 'project_verified';

  if (!isHighImpact) {
    return <ActivityNoticeCard activity={activity} />;
  }

  return (
    <Card className="border-2 border-civic-green bg-gradient-to-br from-civic-green/5 to-background">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-civic-green/10 border-2 border-civic-green flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-civic-green" />
          </div>

          <div className="flex-1">
            <Badge variant="secondary" className="mb-2 bg-civic-green/10 text-civic-green">
              🎉 Important Update
            </Badge>
            <p className="text-sm font-medium mb-1">
              <Link 
                to={`/u/${activity.username}`} 
                className="font-bold hover:underline"
              >
                {activity.username}
              </Link>
              {' '}{getActivityVerb(activity.activity_type)}{' '}
              <span className="font-bold">{getTargetName(activity)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
