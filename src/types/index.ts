export interface Community {
  id: string;
  name: string;
  displayName: string;
  description: string;
  descriptionHtml?: string;
  memberCount: number;
  category: 'governance' | 'civic-education' | 'accountability' | 'discussion' | 'education' | 'healthcare' | 'infrastructure' | 'environment' | 'security' | 'economic-empowerment' | 'youth' | 'women-rights' | 'ngo' | 'community-org' | 'sports';
  type?: 'location' | 'interest';
  locationType?: 'ward' | 'constituency' | 'county' | 'national';
  locationValue?: string;
  isFollowing?: boolean;
  isFavorite?: boolean;
  sensitivityLevel?: 'public' | 'moderated' | 'private';
  allowPostFlairs?: boolean;
  allowUserFlairs?: boolean;
  avatarUrl?: string;
  bannerUrl?: string;
  themeColor?: string;
  sidebarContent?: string;
  submissionRules?: string;
  isNsfw?: boolean;
  minimumKarmaToPost?: number;
  autoModerate?: boolean;
  moderators?: CommunityModerator[];
  rules?: CommunityRule[];
  flairs?: CommunityFlair[];
}

export interface CommunityModerator {
  id: string;
  communityId: string;
  userId: string;
  role: 'moderator' | 'admin';
  permissions: {
    canDelete: boolean;
    canBan: boolean;
    canApprove: boolean;
    canFlair: boolean;
  };
  addedBy?: string;
  addedAt: Date;
  user?: User;
}

export interface CommunityRule {
  id: string;
  communityId: string;
  title: string;
  description: string;
  priority: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityFlair {
  id: string;
  communityId: string;
  name: string;
  textColor: string;
  backgroundColor: string;
  flairType: 'post' | 'user';
  isEnabled: boolean;
  createdBy?: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  community?: Community;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  userVote?: 'up' | 'down' | null;
  tags: string[];
  media?: PostMedia[];
  flair?: CommunityFlair;
  contentSensitivity: 'public' | 'sensitive' | 'crisis';
  isNgoVerified?: boolean;
  link_url?: string | null;
  link_title?: string | null;
  link_description?: string | null;
  link_image?: string | null;
}

export interface PostMedia {
  id: string;
  post_id: string;
  file_path: string;
  filename: string;
  file_type: string;
  file_size: number;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
  post?: {
    id: string;
    title: string;
    community?: {
      name: string;
    };
  };
  parentId?: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  replies?: Comment[];
  depth: number;
  isCollapsed: boolean;
  moderationStatus: 'pending' | 'approved' | 'removed';
  // New ama comment enhancements
  flair?: CommentFlair;
  awards?: CommentAward[];
  karma?: number;
  toxicityScore?: number;
  factCheckStatus?: 'unverified' | 'verified' | 'disputed' | 'debunked';
  factCheckerId?: string;
  isOfficialResponse?: boolean;
  referencedPromiseId?: string;
  referencedProjectId?: string;
  media?: CommentMedia[];
  moderatorId?: string;
  moderationReason?: string;
  moderationTimestamp?: Date;
  isDeleted?: boolean;
}

export interface CommentFlair {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  color: string;
  backgroundColor: string;
  icon?: string;
  category: 'civic' | 'discussion' | 'moderation' | 'fact-check';
  isEnabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentAward {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color: string;
  backgroundColor: string;
  points: number;
  category: 'civic' | 'helpful' | 'insightful' | 'creative';
  isEnabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  // Assignment-specific fields
  assignedBy?: User;
  assignedAt?: Date;
}

export interface CommentMedia {
  id: string;
  commentId: string;
  filePath: string;
  filename: string;
  fileType: string;
  fileSize?: number;
  uploadedAt: Date;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bannerUrl?: string;
  isVerified?: boolean;
  officialPosition?: string; // Title of government position if verified official
  officialPositionId?: string; // Reference to government_positions
  role?: 'citizen' | 'official' | 'expert' | 'journalist' | 'admin';
  karma?: number;
  postKarma?: number;
  commentKarma?: number;
  location?: string;

  // Geographic location fields
  county?: string;
  constituency?: string;
  ward?: string;

  website?: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  expertise?: string[];
  bio?: string;
  badges?: string[];
  isPrivate?: boolean;
  activityStats?: {
    postsCreated: number;
    commentsCreated: number;
    upvotesGiven: number;
    upvotesReceived: number;
    joinDate: Date;
  };
  lastActivity?: Date;
  // Additional fields for sidebar stats
  followersCount?: number;
  contributionsCount?: number;
  redditAge?: string;
  activeIn?: string;
  goldEarned?: number;
}

export interface UserProfile extends User {
  createdAt?: Date;
  onboardingCompleted?: boolean;
  privacySettings?: UserPrivacySettings;
  activityLog?: UserActivity[];
}

export interface UserPrivacySettings {
  id: string;
  userId: string;
  profileVisibility: 'public' | 'friends' | 'private';
  activityVisibility: 'public' | 'friends' | 'private';
  contactVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowMessages: 'everyone' | 'friends' | 'nobody';
  dataSharing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  activityType: 'post_created' | 'comment_created' | 'post_upvoted' | 'comment_upvoted' | 'community_joined' | 'profile_updated';
  entityId?: string;
  entityType?: 'post' | 'comment' | 'community';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CommunityProfile extends Community {
  moderators: CommunityModerator[];
  rules: CommunityRule[];
  flairs: CommunityFlair[];
  recentPosts?: Post[];
  memberStats?: {
    totalMembers: number;
    activeMembers: number;
    newMembersToday: number;
  };
}

// Government Accountability Types
export interface Official {
  id: string;
  name: string;
  position: string;
  level: string;
  constituency?: string;
  county?: string;
  party?: string;
  photo_url?: string;
  contact_info?: any;
  created_at?: string;
  updated_at?: string;
}

export interface DevelopmentPromise {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'completed' | 'ongoing' | 'not_started' | 'cancelled';
  budget_allocated?: number;
  budget_used?: number;
  funding_source?: string;
  contractor?: string;
  progress_percentage: number;
  location?: string;
  beneficiaries_count?: number;
  official_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface GovernmentProject {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget_allocated?: number;
  budget_used?: number;
  funding_source?: string;
  funding_type?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  county?: string;
  constituency?: string;
  ward?: string;
  planned_start_date?: string;
  actual_start_date?: string;
  planned_completion_date?: string;
  actual_completion_date?: string;
  progress_percentage: number;
  completion_notes?: string;
  official_id?: string;
  lead_contractor_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  last_updated_by?: string;
  contractors?: ProjectContractor[];
  updates?: ProjectUpdate[];
  // New user-generated content fields
  is_verified?: boolean;
  media_urls?: string[];
  documents_urls?: string[];
  community_confidence?: number;
}

export interface Contractor {
  id: string;
  name: string;
  registration_number?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
  company_type?: string;
  specialization?: string[];
  years_experience?: number;
  total_projects_completed?: number;
  average_rating?: number;
  total_ratings?: number;
  is_verified?: boolean;
  verification_date?: string;
  blacklisted?: boolean;
  blacklist_reason?: string;
  created_at?: string;
  updated_at?: string;
  ratings?: ContractorRating[];
}

export interface ProjectContractor {
  id: string;
  project_id: string;
  contractor_id: string;
  role?: string;
  contract_value?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  performance_rating?: number;
  notes?: string;
  created_at?: string;
  contractor?: Contractor;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  reporter_id?: string;
  reporter_name?: string;
  reporter_contact?: string;
  update_type: 'progress' | 'issue' | 'completion' | 'quality_concern' | 'delay';
  title: string;
  description: string;
  photos?: string[];
  videos?: string[];
  documents?: string[];
  latitude?: number;
  longitude?: number;
  location_description?: string;
  status: 'pending' | 'verified' | 'rejected' | 'resolved';
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  upvotes?: number;
  downvotes?: number;
  community_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PromiseVerification {
  id: string;
  promise_id: string;
  verifier_id?: string;
  verifier_name?: string;
  verification_type: 'progress_update' | 'completion_evidence' | 'issue_report';
  title: string;
  description: string;
  photos?: string[];
  videos?: string[];
  documents?: string[];
  claimed_progress?: number;
  actual_progress?: number;
  issues_identified?: string;
  upvotes?: number;
  downvotes?: number;
  community_confidence?: number;
  status: 'pending' | 'verified' | 'disputed' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContractorRating {
  id: string;
  contractor_id: string;
  project_id?: string;
  rater_id?: string;
  rater_name?: string;
  overall_rating: number;
  quality_rating?: number;
  timeliness_rating?: number;
  communication_rating?: number;
  professionalism_rating?: number;
  review_text?: string;
  recommend?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OfficialWithPromises extends Official {
  promises: DevelopmentPromise[];
  completedPromises: number;
  totalPromises: number;
}

export interface ProjectWithContractors extends GovernmentProject {
  contractors: ProjectContractor[];
  updates: ProjectUpdate[];
  official?: Official;
}

// ============================================================
// VERIFICATION & SENTIMENT TYPES (from r_kenya-clone)
// ============================================================

export type VerificationStatus = 'VERIFIED' | 'DISPUTED' | 'DEBUNKED' | 'PENDING';

export interface Verification {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'project' | 'promise';
  status: VerificationStatus;
  truthScore: number; // 0 to 100
  totalVotes: number;
  breakdown: {
    true: number;
    misleading: number;
    outdated: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationVote {
  id: string;
  verificationId: string;
  userId: string;
  voteType: 'true' | 'misleading' | 'outdated';
  createdAt: Date;
}

export interface Sentiment {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'project' | 'promise';
  positive: number;
  neutral: number;
  negative: number;
  updatedAt: Date;
}

export interface SentimentVote {
  id: string;
  sentimentId: string;
  userId: string;
  sentimentType: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
}

// ============================================================
// USER-GENERATED CONTENT TYPES
// ============================================================

export interface CivicProject {
  id: string;
  title: string;
  description: string;
  status: 'PROPOSED' | 'STALLED' | 'ACTIVE' | 'COMPLETED';
  budget: string;
  location: string;
  imageUrl?: string;
  submittedBy: User;
  wardId?: string;
  constituencyId?: string;
  countyId?: string;
  isVerified: boolean;
  verification?: Verification;
  sentiment?: Sentiment;
  createdAt: Date;
  lastUpdated: Date;
}

export interface CampaignPromise {
  id: string;
  title: string;
  description: string;
  politicianId: string;
  politicianName: string;
  status: 'KEPT' | 'BROKEN' | 'IN_PROGRESS' | 'COMPROMISED';
  submittedBy: User;
  verification?: Verification;
  sentiment?: Sentiment;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAction {
  id: string;
  userId: string;
  actionType: 'JOIN_COMMUNITY' | 'VERIFY_POST' | 'VOTE_POLL' | 'SUBMIT_REPORT' |
  'ATTEND_EVENT' | 'CREATE_PROJECT' | 'CREATE_PROMISE' | 'CAST_VERIFICATION_VOTE';
  description: string;
  targetId?: string;
  targetName?: string;
  targetType?: string;
  createdAt: Date;
}

// ============================================================
// ENHANCED POST & COMMENT TYPES WITH VERIFICATION
// ============================================================

export interface PostWithVerification extends Post {
  verification?: Verification;
  sentiment?: Sentiment;
}

export interface CommentWithVerification extends Comment {
  verification?: Verification;
  sentiment?: Sentiment;
}

// ============================================================
// COMMUNITY FORUM TYPES (Discord-style)
// ============================================================

export type HierarchyType = 'COUNTY' | 'CONSTITUENCY' | 'WARD';

export interface Leader {
  id: string;
  name: string;
  role: string;
  party: string;
  avatarUrl: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  approvalRating?: number;
}

export interface Channel {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE' | 'LEADERS' | 'PROJECTS' | 'PROMISES';
  categoryId: 'INFO' | 'MONITORING' | 'ENGAGEMENT';
  description?: string;
}

export interface CommunityLevel {
  id: string;
  type: HierarchyType;
  name: string;
  icon: string; // Emoji or URL
  leaders: Leader[];
  channels: Channel[];
}

export interface CommunityMessage {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  upvotes: number;
}

