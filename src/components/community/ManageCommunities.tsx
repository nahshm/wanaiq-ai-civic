import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Community } from '@/types';
import { CommunityListItem } from './CommunityListItem';

interface ManageCommunitiesProps {
    communities: Community[];
    onToggleFollow: (communityId: string) => void;
    onToggleFavorite?: (communityId: string) => void;
}

export const ManageCommunities = ({ communities, onToggleFollow, onToggleFavorite }: ManageCommunitiesProps) => {
    const [filterQuery, setFilterQuery] = useState('');

    // Filter only joined communities for this view, or show all if that's the intended behavior.
    // Based on "Manage communities", it usually implies communities the user is part of.
    // However, the screenshot shows "All Communities" on the right sidebar, implying this might be a list of all available or just joined.
    // Given the "Joined" button state in the screenshot, it lists communities where some are joined.
    // But usually "Manage" implies managing YOUR communities.
    // Let's assume it lists all communities but highlights joined ones, OR lists joined ones.
    // The screenshot shows "r/AskReddit", "r/europe", etc. with "Joined" buttons.
    // Let's filter based on the query.

    const filteredCommunities = communities.filter(community =>
        community.displayName.toLowerCase().includes(filterQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
        community.name.toLowerCase().includes(filterQuery.toLowerCase())
    );

    const favorites = filteredCommunities.filter(c => c.isFavorite);
    const others = filteredCommunities.filter(c => !c.isFavorite);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-6">Manage communities</h1>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        placeholder="Filter your communities"
                        className="pl-10 bg-background"
                    />
                </div>
            </div>

            <div className="space-y-1">
                {favorites.length > 0 && (
                    <>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-2">
                            Favorites
                        </div>
                        {favorites.map(community => (
                            <CommunityListItem
                                key={community.id}
                                community={community}
                                onToggleFollow={onToggleFollow}
                                onToggleFavorite={onToggleFavorite}
                            />
                        ))}
                        <div className="my-4 border-t" />
                    </>
                )}

                {others.length > 0 && (
                    <>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-2">
                            All Communities
                        </div>
                        {others.map(community => (
                            <CommunityListItem
                                key={community.id}
                                community={community}
                                onToggleFollow={onToggleFollow}
                                onToggleFavorite={onToggleFavorite}
                            />
                        ))}
                    </>
                )}

                {filteredCommunities.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No communities found matching "{filterQuery}"
                    </div>
                )}
            </div>
        </div>
    );
};
