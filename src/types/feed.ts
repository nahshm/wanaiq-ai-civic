/**
 * Feed-specific TypeScript interfaces
 * Used for feed integration and type safety
 */

import { Post } from '@/types/index';

/**
 * Quest interface for gamification system
 */
export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  available_in_community?: string;
  userProgress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress: number;
  };
}

/**
 * Accountability update interface for tracking promises/projects
 */
export interface AccountabilityUpdate {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  community?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Feed item types for mixed content feeds
 */
export interface FeedPost {
  id: string;
  type: 'post';
  data: Post;
}

export interface FeedQuestCard {
  id: string;
  type: 'quest';
  data: Quest;
}

export interface FeedAccountabilityCard {
  id: string;
  type: 'accountability';
  data: AccountabilityUpdate;
}

export type FeedItem = FeedPost | FeedQuestCard | FeedAccountabilityCard;
