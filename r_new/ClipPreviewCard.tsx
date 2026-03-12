/**
 * @fileoverview Civic Clip Preview Card & Achievement Card
 * @module components/feed
 * 
 * ClipPreviewCard: Video thumbnail card for civic clips in the feed
 * AchievementCard: Quest completion and achievement cards
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, Clock, Trophy, Star, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// CLIP PREVIEW CARD
// ============================================================================

interface CivicClip {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration?: number;
  views?: number;
  created_at: string;
  author_id?: string;
  author_name?: string;
}

interface ClipPreviewCardProps {
  clip: CivicClip;
  onClick?: () => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ClipPreviewCard({ clip, onClick }: ClipPreviewCardProps) {
  return (
    <Card 
      className="overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Video Thumbnail */}
        <div className="relative aspect-video bg-muted">
          {clip.thumbnail_url ? (
            <img 
              src={clip.thumbnail_url} 
              alt={clip.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-all">
              <Play className="h-8 w-8 text-purple-600 ml-1" />
            </div>
          </div>

          {/* Duration badge */}
          {clip.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {formatDuration(clip.duration)}
            </div>
          )}

          {/* Civic Clip badge */}
          <Badge 
            className="absolute top-2 left-2 bg-purple-600/90 hover:bg-purple-600"
          >
            🎥 Civic Clip
          </Badge>
        </div>

        {/* Clip info */}
        <div className="p-4">
          <h3 className="font-semibold mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
            <Link to={`/civic-clips/${clip.id}`}>
              {clip.title}
            </Link>
          </h3>

          {clip.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {clip.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {clip.views !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {clip.views.toLocaleString()}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(clip.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ACHIEVEMENT CARD
// ============================================================================

interface Achievement {
  id: string;
  achievement_type?: 'quest' | 'achievement';
  achievement_name?: string;
  quest_title?: string;
  tier?: string;
  reward?: number;
  description?: string;
  icon?: string;
  created_at: string;
  user_id?: string;
  username?: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
}

function getTierColor(tier?: string) {
  const colors: Record<string, string> = {
    bronze: 'from-amber-700 to-amber-900',
    silver: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-cyan-400 to-blue-600',
    diamond: 'from-purple-400 to-pink-600'
  };
  return colors[tier?.toLowerCase() || ''] || 'from-gray-400 to-gray-600';
}

function getTierIcon(tier?: string) {
  switch (tier?.toLowerCase()) {
    case 'bronze': return '🥉';
    case 'silver': return '🥈';
    case 'gold': return '🥇';
    case 'platinum': return '💎';
    case 'diamond': return '💠';
    default: return '🏆';
  }
}

export function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  const isQuest = achievement.achievement_type === 'quest';
  const title = isQuest ? achievement.quest_title : achievement.achievement_name;
  const tierGradient = getTierColor(achievement.tier);
  const tierIcon = getTierIcon(achievement.tier);

  return (
    <Card 
      className={`overflow-hidden border-2 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br ${tierGradient} bg-opacity-5`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Achievement icon */}
          <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${tierGradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <span className="text-3xl">
              {achievement.icon || tierIcon}
            </span>
          </div>

          {/* Achievement content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`bg-gradient-to-r ${tierGradient} border-0 text-white`}>
                {isQuest ? '🎯 Quest Complete' : '⭐ Achievement'}
              </Badge>
            </div>

            <h3 className="font-bold text-lg mb-1">
              {title || 'New Achievement'}
            </h3>

            {achievement.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {achievement.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <Link 
                  to={`/u/${achievement.username}`}
                  className="font-semibold hover:underline"
                >
                  {achievement.username || 'Someone'}
                </Link>
                {' '}unlocked this{' '}
                {formatDistanceToNow(new Date(achievement.created_at), { addSuffix: true })}
              </div>

              {achievement.reward && (
                <Badge variant="secondary" className="font-bold">
                  +{achievement.reward} pts
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact achievement notification for profile/sidebar
 */
export function AchievementNotification({ achievement }: AchievementCardProps) {
  const tierIcon = getTierIcon(achievement.tier);

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
        <span className="text-xl">{tierIcon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold line-clamp-1">
          {achievement.achievement_name || achievement.quest_title}
        </p>
        <p className="text-xs text-muted-foreground">
          New achievement unlocked!
        </p>
      </div>
      {achievement.reward && (
        <Badge variant="secondary" className="text-xs">
          +{achievement.reward}
        </Badge>
      )}
    </div>
  );
}
