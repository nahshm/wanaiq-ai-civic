import { Button } from '@/components/ui/button';
import { Star, Check, Plus } from 'lucide-react';
import { Community } from '@/types';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CommunityListItemProps {
    community: Community;
    onToggleFollow: (communityId: string) => void;
    onToggleFavorite?: (communityId: string) => void;
}

export const CommunityListItem = ({ community, onToggleFollow, onToggleFavorite }: CommunityListItemProps) => {
    return (
        <div className="flex items-center justify-between py-4 px-2 hover:bg-accent/50 rounded-lg transition-colors group">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <Link to={`/c/${community.name}`} className="flex-shrink-0">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={community.avatarUrl} alt={community.displayName} />
                        <AvatarFallback>{community.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex flex-col min-w-0">
                    <Link to={`/c/${community.name}`} className="font-semibold hover:underline truncate">
                        c/{community.name}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate pr-4">
                        {community.description}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className={`text-muted-foreground hover:text-yellow-500 ${community.isFavorite ? 'text-yellow-500' : ''}`}
                    onClick={() => onToggleFavorite?.(community.id)}
                >
                    <Star className={`h-5 w-5 ${community.isFavorite ? 'fill-current' : ''}`} />
                </Button>

                <Button
                    variant={community.isFollowing ? "outline" : "default"}
                    size="sm"
                    onClick={() => onToggleFollow(community.id)}
                    className="min-w-[80px] rounded-full"
                >
                    {community.isFollowing ? (
                        "Joined"
                    ) : (
                        "Join"
                    )}
                </Button>
            </div>
        </div>
    );
};
