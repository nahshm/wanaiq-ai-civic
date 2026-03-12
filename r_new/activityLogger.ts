/**
 * @fileoverview Activity Logger Service
 * @module lib/activityLogger
 * 
 * Central service for logging all user actions to the unified activity feed.
 * This creates the "National Town Hall" experience where all civic actions
 * are visible and trackable.
 * 
 * Usage:
 * ```typescript
 * import { logActivity, ActivityType } from '@/lib/activityLogger';
 * 
 * // After user creates a post
 * await logActivity({
 *   userId: user.id,
 *   type: 'post_created',
 *   targetId: post.id,
 *   targetType: 'post',
 *   metadata: { title: post.title, community: post.community_id }
 * });
 * ```
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

/**
 * All possible activity types in the platform
 * Must match the activity_type_enum in the database
 */
export type ActivityType =
  | 'post_created'
  | 'project_submitted'
  | 'project_verified'
  | 'promise_tracked'
  | 'promise_updated'
  | 'quest_completed'
  | 'community_joined'
  | 'community_created'
  | 'clip_uploaded'
  | 'issue_reported'
  | 'official_claimed'
  | 'achievement_earned'
  | 'comment_created'
  | 'vote_cast';

/**
 * Target types for activities
 */
export type TargetType =
  | 'post'
  | 'project'
  | 'promise'
  | 'community'
  | 'clip'
  | 'issue'
  | 'official'
  | 'comment'
  | 'quest'
  | 'achievement';

/**
 * Activity log parameters
 */
export interface LogActivityParams {
  userId: string;
  type: ActivityType;
  targetId?: string;
  targetType?: TargetType;
  metadata?: Record<string, any>;
  isPublic?: boolean;
}

/**
 * Activity record from database
 */
export interface FeedActivity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  target_id: string | null;
  target_type: TargetType | null;
  metadata: Record<string, any>;
  is_public: boolean;
  created_at: string;
}

// ============================================================================
// ACTIVITY LOGGER
// ============================================================================

/**
 * Log a user activity to the unified feed
 * 
 * @param params - Activity parameters
 * @returns Activity ID if successful
 * @throws Error if logging fails
 * 
 * @example
 * ```typescript
 * const activityId = await logActivity({
 *   userId: user.id,
 *   type: 'post_created',
 *   targetId: post.id,
 *   targetType: 'post',
 *   metadata: { title: post.title }
 * });
 * ```
 */
export async function logActivity(params: LogActivityParams): Promise<string> {
  const {
    userId,
    type,
    targetId = null,
    targetType = null,
    metadata = {},
    isPublic = true
  } = params;

  try {
    const { data, error } = await supabase
      .from('feed_activities')
      .insert({
        user_id: userId,
        activity_type: type,
        target_id: targetId,
        target_type: targetType,
        metadata,
        is_public: isPublic
      })
      .select('id')
      .single();

    if (error) {
      console.error('[ActivityLogger] Failed to log activity:', error);
      throw new Error(`Failed to log ${type} activity: ${error.message}`);
    }

    console.log(`[ActivityLogger] ✅ Logged ${type} activity:`, data.id);
    return data.id;
  } catch (error) {
    console.error('[ActivityLogger] Error logging activity:', error);
    throw error;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS FOR COMMON ACTIVITIES
// ============================================================================

/**
 * Log post creation activity
 */
export async function logPostCreated(
  userId: string,
  postId: string,
  metadata: { title: string; communityId?: string; contentType?: string }
): Promise<string> {
  return logActivity({
    userId,
    type: 'post_created',
    targetId: postId,
    targetType: 'post',
    metadata: {
      title: metadata.title,
      community_id: metadata.communityId,
      content_type: metadata.contentType
    }
  });
}

/**
 * Log project submission activity
 */
export async function logProjectSubmitted(
  userId: string,
  projectId: string,
  metadata: { name: string; location: string; county?: string }
): Promise<string> {
  return logActivity({
    userId,
    type: 'project_submitted',
    targetId: projectId,
    targetType: 'project',
    metadata: {
      name: metadata.name,
      location: metadata.location,
      county: metadata.county
    }
  });
}

/**
 * Log project verification activity
 */
export async function logProjectVerified(
  userId: string,
  projectId: string,
  metadata: { projectName: string; verificationType: string }
): Promise<string> {
  return logActivity({
    userId,
    type: 'project_verified',
    targetId: projectId,
    targetType: 'project',
    metadata: {
      project_name: metadata.projectName,
      verification_type: metadata.verificationType
    }
  });
}

/**
 * Log community join activity
 */
export async function logCommunityJoined(
  userId: string,
  communityId: string,
  metadata: { communityName: string }
): Promise<string> {
  return logActivity({
    userId,
    type: 'community_joined',
    targetId: communityId,
    targetType: 'community',
    metadata: {
      community_name: metadata.communityName
    }
  });
}

/**
 * Log community creation activity
 */
export async function logCommunityCreated(
  userId: string,
  communityId: string,
  metadata: { communityName: string; category?: string }
): Promise<string> {
  return logActivity({
    userId,
    type: 'community_created',
    targetId: communityId,
    targetType: 'community',
    metadata: {
      community_name: metadata.communityName,
      category: metadata.category
    }
  });
}

/**
 * Log promise tracking activity
 */
export async function logPromiseTracked(
  userId: string,
  promiseId: string,
  metadata: { promiseTitle: string; officialName?: string }
): Promise<string> {
  return logActivity({
    userId,
    type: 'promise_tracked',
    targetId: promiseId,
    targetType: 'promise',
    metadata: {
      promise_title: metadata.promiseTitle,
      official_name: metadata.officialName
    }
  });
}

/**
 * Log civic clip upload activity
 */
export async function logClipUploaded(
  userId: string,
  clipId: string,
  metadata: { title: string; duration?: number }
): Promise<string> {
  return logActivity({
    userId,
    type: 'clip_uploaded',
    targetId: clipId,
    targetType: 'clip',
    metadata: {
      title: metadata.title,
      duration: metadata.duration
    }
  });
}

/**
 * Log issue report activity
 */
export async function logIssueReported(
  userId: string,
  issueId: string,
  metadata: { issueType: string; location: string; severity?: string }
): Promise<string> {
  return logActivity({
    userId,
    type: 'issue_reported',
    targetId: issueId,
    targetType: 'issue',
    metadata: {
      issue_type: metadata.issueType,
      location: metadata.location,
      severity: metadata.severity
    }
  });
}

/**
 * Log official position claim activity
 */
export async function logOfficialClaimed(
  userId: string,
  positionId: string,
  metadata: { positionTitle: string; level: string }
): Promise<string> {
  return logActivity({
    userId,
    type: 'official_claimed',
    targetId: positionId,
    targetType: 'official',
    metadata: {
      position_title: metadata.positionTitle,
      level: metadata.level
    }
  });
}

/**
 * Log quest completion activity
 */
export async function logQuestCompleted(
  userId: string,
  questId: string,
  metadata: { questTitle: string; reward?: number }
): Promise<string> {
  return logActivity({
    userId,
    type: 'quest_completed',
    targetId: questId,
    targetType: 'quest',
    metadata: {
      quest_title: metadata.questTitle,
      reward: metadata.reward
    }
  });
}

/**
 * Log achievement earned activity
 */
export async function logAchievementEarned(
  userId: string,
  achievementId: string,
  metadata: { achievementName: string; tier?: string }
): Promise<string> {
  return logActivity({
    userId,
    type: 'achievement_earned',
    targetId: achievementId,
    targetType: 'achievement',
    metadata: {
      achievement_name: metadata.achievementName,
      tier: metadata.tier
    }
  });
}

// ============================================================================
// BATCH ACTIVITY LOGGING
// ============================================================================

/**
 * Log multiple activities at once (for bulk operations)
 * 
 * @example
 * ```typescript
 * await logActivitiesBatch([
 *   { userId: user.id, type: 'post_created', targetId: post1.id },
 *   { userId: user.id, type: 'post_created', targetId: post2.id }
 * ]);
 * ```
 */
export async function logActivitiesBatch(
  activities: LogActivityParams[]
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('feed_activities')
      .insert(
        activities.map(activity => ({
          user_id: activity.userId,
          activity_type: activity.type,
          target_id: activity.targetId || null,
          target_type: activity.targetType || null,
          metadata: activity.metadata || {},
          is_public: activity.isPublic ?? true
        }))
      )
      .select('id');

    if (error) {
      console.error('[ActivityLogger] Failed to log batch activities:', error);
      throw new Error(`Failed to log batch activities: ${error.message}`);
    }

    console.log(`[ActivityLogger] ✅ Logged ${data.length} activities`);
    return data.map(d => d.id);
  } catch (error) {
    console.error('[ActivityLogger] Error logging batch activities:', error);
    throw error;
  }
}

// ============================================================================
// ACTIVITY RETRIEVAL
// ============================================================================

/**
 * Get a user's activity timeline
 */
export async function getUserActivities(
  userId: string,
  limit = 50
): Promise<FeedActivity[]> {
  const { data, error } = await supabase
    .from('feed_activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ActivityLogger] Failed to fetch user activities:', error);
    throw new Error(`Failed to fetch user activities: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all public activities (for admin/moderation)
 */
export async function getPublicActivities(limit = 100): Promise<FeedActivity[]> {
  const { data, error } = await supabase
    .from('feed_activities')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ActivityLogger] Failed to fetch public activities:', error);
    throw new Error(`Failed to fetch public activities: ${error.message}`);
  }

  return data || [];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get human-readable activity description
 */
export function getActivityDescription(activity: FeedActivity): string {
  const typeDescriptions: Record<ActivityType, string> = {
    post_created: 'created a post',
    project_submitted: 'submitted a project',
    project_verified: 'verified a project',
    promise_tracked: 'tracked a promise',
    promise_updated: 'updated a promise',
    quest_completed: 'completed a quest',
    community_joined: 'joined a community',
    community_created: 'created a community',
    clip_uploaded: 'uploaded a civic clip',
    issue_reported: 'reported an issue',
    official_claimed: 'claimed an official position',
    achievement_earned: 'earned an achievement',
    comment_created: 'commented',
    vote_cast: 'voted'
  };

  return typeDescriptions[activity.activity_type] || 'performed an action';
}

/**
 * Get target URL for an activity
 */
export function getActivityTargetUrl(activity: FeedActivity): string {
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
    comment: (id) => `/post/${id}`, // Navigate to parent post
    quest: (id) => `/quests/${id}`,
    achievement: (id) => `/profile?tab=achievements`
  };

  const urlBuilder = urlMap[target_type];
  return urlBuilder ? urlBuilder(target_id) : '#';
}

/**
 * Check if user can see activity (for privacy filtering)
 */
export function canUserSeeActivity(
  activity: FeedActivity,
  currentUserId?: string
): boolean {
  // Public activities visible to all
  if (activity.is_public) return true;

  // Private activities only visible to owner
  return currentUserId === activity.user_id;
}
