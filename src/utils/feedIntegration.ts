/**
 * Feed Integration Utilities
 * Handles mixing of special cards (Quest, Accountability) into the main feed
 */

import { Post } from '@/types/index';
import { Quest, AccountabilityUpdate, FeedItem, FeedPost, FeedQuestCard, FeedAccountabilityCard } from '@/types/feed';

// Re-export types for backward compatibility
export type { FeedItem, FeedPost, FeedQuestCard, FeedAccountabilityCard };

// Configuration for card placement frequency
const FEED_CONFIG = {
  QUEST_CARD_FREQUENCY: 7, // Show quest card every 7 posts
  ACCOUNTABILITY_FREQUENCY: 10, // Show accountability card every 10 posts
  MAX_QUEST_CARDS_PER_FEED: 5,
  MAX_ACCOUNTABILITY_CARDS_PER_FEED: 3,
};

/**
 * Integrate special cards into the feed algorithmically
 * @param posts - Array of regular posts
 * @param quests - Available quest cards
 * @param accountabilityUpdates - Available accountability updates
 * @returns Mixed feed with posts and special cards
 */
export function integrateFeedCards(
  posts: Post[],
  quests: Quest[] = [],
  accountabilityUpdates: AccountabilityUpdate[] = []
): FeedItem[] {
  const result: FeedItem[] = [];
  let questIndex = 0;
  let accountabilityIndex = 0;

  posts.forEach((post, index) => {
    // Add the regular post
    result.push({
      id: post.id,
      type: 'post',
      data: post,
    });

    // Insert Quest card at specified frequency
    if (
      (index + 1) % FEED_CONFIG.QUEST_CARD_FREQUENCY === 0 &&
      questIndex < Math.min(quests.length, FEED_CONFIG.MAX_QUEST_CARDS_PER_FEED)
    ) {
      result.push({
        id: `quest-${quests[questIndex].id}`,
        type: 'quest',
        data: quests[questIndex],
      });
      questIndex++;
    }

    // Insert Accountability card at specified frequency
    if (
      (index + 1) % FEED_CONFIG.ACCOUNTABILITY_FREQUENCY === 0 &&
      accountabilityIndex < Math.min(accountabilityUpdates.length, FEED_CONFIG.MAX_ACCOUNTABILITY_CARDS_PER_FEED)
    ) {
      result.push({
        id: `accountability-${accountabilityUpdates[accountabilityIndex].id}`,
        type: 'accountability',
        data: accountabilityUpdates[accountabilityIndex],
      });
      accountabilityIndex++;
    }
  });

  return result;
}

/**
 * Get relevant quests for the current user
 * Prioritizes quests from joined communities and user's activity patterns
 */
export function getRelevantQuests(
  allQuests: Quest[],
  userCommunities: string[] = [],
  userActivity: { category?: string } = {}
): Quest[] {
  return allQuests
    .filter((quest) => {
      // Filter out completed quests
      if (quest.userProgress?.status === 'completed') return false;
      
      // Prioritize quests from user's communities
      if (quest.available_in_community && userCommunities.includes(quest.available_in_community)) {
        return true;
      }

      // Match user's activity category
      if (userActivity.category && quest.category === userActivity.category) {
        return true;
      }

      return true; // Include all others
    })
    .sort((a, b) => {
      // Sort: In-progress first, then community quests, then by XP reward
      if (a.userProgress?.status === 'in_progress' && b.userProgress?.status !== 'in_progress') return -1;
      if (b.userProgress?.status === 'in_progress' && a.userProgress?.status !== 'in_progress') return 1;
      
      const aInCommunity = userCommunities.includes(a.available_in_community);
      const bInCommunity = userCommunities.includes(b.available_in_community);
      
      if (aInCommunity && !bInCommunity) return -1;
      if (bInCommunity && !aInCommunity) return 1;
      
      return b.points - a.points;
    })
    .slice(0, FEED_CONFIG.MAX_QUEST_CARDS_PER_FEED);
}

/**
 * Get relevant accountability updates
 * Prioritizes updates from tracked promises and user's geographic area
 */
export function getRelevantAccountabilityUpdates(
  allUpdates: AccountabilityUpdate[],
  trackedPromises: string[] = [],
  userLocation?: string
): AccountabilityUpdate[] {
  return allUpdates
    .filter((update) => {
      // Always show tracked items
      if (trackedPromises.includes(update.id)) return true;

      // Show items from user's location
      if (userLocation && update.community === userLocation) return true;

      // Show completed items (achievements)
      if (update.status === 'completed') return true;

      return false;
    })
    .sort((a, b) => {
      // Sort: Tracked first, then completed, then recent
      const aTracked = trackedPromises.includes(a.id);
      const bTracked = trackedPromises.includes(b.id);
      
      if (aTracked && !bTracked) return -1;
      if (bTracked && !aTracked) return 1;
      
      if (a.status === 'completed' && b.status !== 'completed') return -1;
      if (b.status === 'completed' && a.status !== 'completed') return 1;
      
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    })
    .slice(0, FEED_CONFIG.MAX_ACCOUNTABILITY_CARDS_PER_FEED);
}

/**
 * Example usage:
 * 
 * const feedItems = integrateFeedCards(
 *   posts,
 *   getRelevantQuests(quests, userCommunities, userActivity),
 *   getRelevantAccountabilityUpdates(updates, trackedPromises, userLocation)
 * );
 * 
 * feedItems.map((item) => {
 *   switch (item.type) {
 *     case 'post':
 *       return <PostCard key={item.id} post={item.data} />;
 *     case 'quest':
 *       return <QuestCard key={item.id} quest={item.data} />;
 *     case 'accountability':
 *       return <AccountabilityCard key={item.id} update={item.data} />;
 *   }
 * });
 */
