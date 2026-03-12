/**
 * Selective Column Fetching Constants
 * 
 * Use these instead of select('*') to reduce bandwidth by ~40-60%
 * 
 * Usage:
 * ```tsx
 * import { SELECT_FIELDS } from '@/lib/select-fields';
 * 
 * const { data } = await supabase
 *   .from('posts')
 *   .select(SELECT_FIELDS.POST_LIST)  // Instead of select('*')
 * ```
 */

// ==========================================
// POSTS
// ==========================================

/** Minimal fields for post listings/feeds */
export const POST_LIST = 'id,title,author_id,created_at,upvotes,downvotes,comment_count,community_id,tags,content_sensitivity' as const;

/** Full post data for detail view */
export const POST_DETAIL = 'id,title,content,author_id,created_at,updated_at,upvotes,downvotes,comment_count,community_id,official_id,tags,content_sensitivity,is_ngo_verified,link_url,link_title,link_description,link_image' as const;

/** Post with author info */
export const POST_WITH_AUTHOR = `
  ${POST_LIST},
  profiles!posts_author_id_fkey (id, username, display_name, avatar_url, is_verified, role)
` as const;

/** Post with author and community */
export const POST_WITH_RELATIONS = `
  ${POST_LIST},
  profiles!posts_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
  communities!posts_community_id_fkey (id, name, display_name, avatar_url, member_count, category)
` as const;

/** Full post with all relations (for detail page) */
export const POST_FULL = `
  ${POST_DETAIL},
  profiles!posts_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
  communities!posts_community_id_fkey (id, name, display_name, description, avatar_url, member_count, category),
  officials!posts_official_id_fkey (id, name, position),
  post_media!post_media_post_id_fkey (id, file_path, file_type)
` as const;

// ==========================================
// PROFILES
// ==========================================

/** Minimal profile for cards/avatars */
export const PROFILE_CARD = 'id,username,avatar_url,role,is_verified' as const;

/** Profile with display name */
export const PROFILE_LIST = 'id,username,display_name,avatar_url,role,is_verified' as const;

/** Full profile for profile pages */
export const PROFILE_FULL = 'id,username,display_name,avatar_url,banner_url,bio,role,is_verified,county,constituency,ward,persona,created_at,onboarding_completed' as const;

/** Profile with stats */
export const PROFILE_WITH_STATS = `
  ${PROFILE_FULL},
  karma,
  post_karma,
  comment_karma
` as const;

// ==========================================
// COMMUNITIES
// ==========================================

/** Minimal community for cards/lists - FIXED: Using actual DB columns */
export const COMMUNITY_CARD = 'id,name,display_name,category' as const;

/** Community list with description */
export const COMMUNITY_LIST = 'id,name,display_name,description,avatar_url,banner_url,member_count,category,created_at' as const;

/** Full community for detail pages */
export const COMMUNITY_FULL = `
  id,
  name,
  display_name,
  description,
  avatar_url,
  banner_url,
  member_count,
  category,
  created_at
` as const;

// ==========================================
// COMMENTS
// ==========================================

/** Minimal comment for listings */
export const COMMENT_LIST = 'id,content,author_id,post_id,parent_id,created_at,upvotes,downvotes' as const;

/** Comment with author */
export const COMMENT_WITH_AUTHOR = `
  ${COMMENT_LIST},
  profiles!comments_author_id_fkey (${PROFILE_CARD})
` as const;

// ==========================================
// CHANNELS
// ==========================================

/** Channel list */
export const CHANNEL_LIST = 'id,name,description,channel_type,category,member_count,is_private' as const;

/** Full channel */
export const CHANNEL_FULL = `
  ${CHANNEL_LIST},
  created_at,
  created_by,
  community_id
` as const;

// ==========================================
// NOTIFICATIONS
// NOTE: notifications table is not yet created in DB. These constants are
// placeholders for when the table is implemented.
// ==========================================

/** Notification minimal */
export const NOTIFICATION_LIST = 'id,type,content,is_read,created_at,actor_id,target_type,target_id' as const;

/** Notification with actor */
export const NOTIFICATION_WITH_ACTOR = `
  ${NOTIFICATION_LIST},
  profiles!notifications_actor_id_fkey (${PROFILE_CARD})
` as const;

// ==========================================
// VOTES
// ==========================================

/** Vote minimal */
export const VOTE_MINIMAL = 'user_id,post_id,vote_type' as const;

// ==========================================
// HELPERS
// ==========================================

/**
 * Backward compatible object for easier migration
 */
export const SELECT_FIELDS = {
  // Posts
  POST_LIST,
  POST_DETAIL,
  POST_WITH_AUTHOR,
  POST_WITH_RELATIONS,
  POST_FULL,

  // Profiles
  PROFILE_CARD,
  PROFILE_LIST,
  PROFILE_FULL,
  PROFILE_WITH_STATS,

  // Communities
  COMMUNITY_CARD,
  COMMUNITY_LIST,
  COMMUNITY_FULL,

  // Comments
  COMMENT_LIST,
  COMMENT_WITH_AUTHOR,

  // Channels
  CHANNEL_LIST,
  CHANNEL_FULL,

  // Notifications
  NOTIFICATION_LIST,
  NOTIFICATION_WITH_ACTOR,

  // Votes
  VOTE_MINIMAL,
} as const;

/** Default export for convenience */
export default SELECT_FIELDS;
