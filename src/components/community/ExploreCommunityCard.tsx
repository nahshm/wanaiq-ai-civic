import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { Community } from '@/types';
import { Link } from 'react-router-dom';

interface ExploreCommunityCardProps {
  community: Community;
  onToggleFollow: (communityId: string) => void;
}

export const ExploreCommunityCard = ({ community, onToggleFollow }: ExploreCommunityCardProps) => {
  const isGeographic = community.type === 'location';
  const initial = (community.displayName || community.name).charAt(0).toUpperCase();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'governance': return 'bg-civic-blue text-primary-foreground';
      case 'accountability': return 'bg-civic-red text-primary-foreground';
      case 'civic-education': return 'bg-civic-green text-primary-foreground';
      default: return 'bg-muted-foreground text-primary-foreground';
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 hover:border-border transition-colors">
      {/* Avatar */}
      <div className="shrink-0">
        {community.avatarUrl ? (
          <img
            src={community.avatarUrl}
            alt={community.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getCategoryColor(community.category)}`}>
            {initial}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/c/${community.name}`}
              className="text-sm font-semibold text-foreground hover:underline truncate block"
            >
              c/{community.displayName || community.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {community.memberCount.toLocaleString()} members
            </p>
          </div>

          {isGeographic ? (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-full text-xs font-semibold h-8 px-4"
              asChild
            >
              <Link to={`/c/${community.name}`}>View</Link>
            </Button>
          ) : community.isFollowing ? (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-full text-xs font-semibold h-8 px-4"
              onClick={() => onToggleFollow(community.id)}
            >
              Joined
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="shrink-0 rounded-full text-xs font-semibold h-8 px-4"
              onClick={() => onToggleFollow(community.id)}
            >
              Join
            </Button>
          )}
        </div>

        {community.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {community.description}
          </p>
        )}
      </div>
    </div>
  );
};
