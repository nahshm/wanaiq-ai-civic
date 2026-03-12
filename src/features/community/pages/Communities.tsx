import { useCommunityData } from '@/hooks/useCommunityData';
import { ExploreCommunities } from '@/components/community/ExploreCommunities';

const Communities = () => {
  const { communities, toggleCommunityFollow } = useCommunityData();

  return (
    <div className="container mx-auto px-4 py-6">
      <ExploreCommunities
        communities={communities}
        onToggleFollow={toggleCommunityFollow}
      />
    </div>
  );
};

export default Communities;
