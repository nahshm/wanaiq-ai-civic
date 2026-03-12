import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Check } from 'lucide-react';
import { Community } from '@/types';

interface CommunityCardProps {
  community: Community;
  onToggleFollow: (communityId: string) => void;
  showDescription?: boolean;
}

export const CommunityCard = ({ community, onToggleFollow, showDescription = true }: CommunityCardProps) => {
  const getCategoryColor = (category: Community['category']) => {
    switch (category) {
      case 'governance': return 'bg-civic-blue/10 text-civic-blue border-civic-blue/20';
      case 'accountability': return 'bg-civic-red/10 text-civic-red border-civic-red/20';
      case 'civic-education': return 'bg-civic-green/10 text-civic-green border-civic-green/20';
      case 'discussion': return 'bg-civic-orange/10 text-civic-orange border-civic-orange/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{community.displayName}</CardTitle>
            <Badge variant="outline" className={`mt-1 ${getCategoryColor(community.category)}`}>
              {community.category.replace('-', ' ')}
            </Badge>
          </div>
          <Button
            variant={community.isFollowing ? "secondary" : "default"}
            size="sm"
            onClick={() => onToggleFollow(community.id)}
            className="ml-2"
          >
            {community.isFollowing ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Following
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Follow
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showDescription && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {community.description}
          </p>
        )}
        <div className="flex items-center text-xs text-muted-foreground">
          <Users className="w-4 h-4 mr-1" />
          {community.memberCount.toLocaleString()} members
        </div>
      </CardContent>
    </Card>
  );
};