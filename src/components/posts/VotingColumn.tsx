import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Bookmark, Share2, Flag, ExternalLink } from 'lucide-react';
import { Post } from '@/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';

interface VotingColumnProps {
  post: Post;
  onVote: (postId: string, vote: 'up' | 'down') => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export function VotingColumn({ post, onVote, isSaved, onToggleSave }: VotingColumnProps) {
  const { toast } = useToast();
  const voteScore = post.upvotes - post.downvotes;

  const formatVoteCount = (count: number) => {
    if (Math.abs(count) >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(count) >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleShare = () => {
    const url = window.location.href;
    copyToClipboard(url, 'Link copied to clipboard!');
  };

  const handleReport = () => {
    toast({
      title: 'Report submitted',
      description: 'Thank you for helping keep our community safe.',
    });
  };

  return (
    <div className="flex flex-col items-center space-y-1.5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-3 shadow-lg shadow-black/5 dark:shadow-black/20">
      {/* Upvote Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onVote(post.id, 'up')}
        className={`h-12 w-12 rounded-xl transition-all duration-200 ${
          post.userVote === 'up'
            ? 'text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/40 shadow-sm'
            : 'hover:text-green-600 hover:bg-green-50/80 dark:hover:bg-green-900/20'
        }`}
        aria-label="Upvote post"
      >
        <ArrowUp className="w-7 h-7" strokeWidth={2.5} />
      </Button>

      {/* Vote Count */}
      <span className={`font-bold text-xl px-2.5 py-1 ${
        voteScore > 0 ? 'text-green-600' : voteScore < 0 ? 'text-red-600' : 'text-muted-foreground'
      }`}>
        {formatVoteCount(voteScore)}
      </span>

      {/* Downvote Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onVote(post.id, 'down')}
        className={`h-12 w-12 rounded-xl transition-all duration-200 ${
          post.userVote === 'down'
            ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/40 shadow-sm'
            : 'hover:text-red-600 hover:bg-red-50/80 dark:hover:bg-red-900/20'
        }`}
        aria-label="Downvote post"
      >
        <ArrowDown className="w-7 h-7" strokeWidth={2.5} />
      </Button>

      {/* Elegant Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />

      {/* Save Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSave}
        className={`h-11 w-11 rounded-xl transition-all duration-200 ${
          isSaved
            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 shadow-sm'
            : 'hover:text-blue-600 hover:bg-blue-50/80 dark:hover:bg-blue-900/20'
        }`}
        title={isSaved ? 'Unsave post' : 'Save post'}
      >
        <Bookmark className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} strokeWidth={2} />
      </Button>

      {/* Share Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleShare}
        className="h-11 w-11 rounded-xl hover:text-primary hover:bg-accent/80 transition-all duration-200"
        title="Share post"
      >
        <Share2 className="w-5 h-5" strokeWidth={2} />
      </Button>

      {/* External Link Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.open(window.location.href, '_blank')}
        className="h-11 w-11 rounded-xl hover:text-primary hover:bg-accent/80 transition-all duration-200"
        title="Open in new tab"
      >
        <ExternalLink className="w-5 h-5" strokeWidth={2} />
      </Button>

      {/* Report Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleReport}
        className="h-11 w-11 rounded-xl hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        title="Report post"
      >
        <Flag className="w-5 h-5" strokeWidth={2} />
      </Button>
    </div>
  );
}
