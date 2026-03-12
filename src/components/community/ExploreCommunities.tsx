import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Community } from '@/types';
import { ExploreCommunityCard } from './ExploreCommunityCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ExploreCommunitiesProps {
  communities: Community[];
  onToggleFollow: (communityId: string) => void;
}

const CATEGORIES = [
  'All',
  'Governance',
  'Accountability',
  'Civic Education',
  'Discussion',
  'Education',
  'Healthcare',
  'Infrastructure',
  'Environment',
  'Security',
  'Economic Empowerment',
  'Youth',
  'Women Rights',
  'NGO',
  'Community Org',
  'Sports',
] as const;

const categoryMap: Record<string, string> = {
  governance: 'Governance',
  accountability: 'Accountability',
  'civic-education': 'Civic Education',
  discussion: 'Discussion',
  education: 'Education',
  healthcare: 'Healthcare',
  infrastructure: 'Infrastructure',
  environment: 'Environment',
  security: 'Security',
  'economic-empowerment': 'Economic Empowerment',
  youth: 'Youth',
  'women-rights': 'Women Rights',
  ngo: 'NGO',
  'community-org': 'Community Org',
  sports: 'Sports',
};

const SECTION_SIZE = 6;

export const ExploreCommunities = ({ communities, onToggleFollow }: ExploreCommunitiesProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [recommendedExpanded, setRecommendedExpanded] = useState(false);
  const [geographicExpanded, setGeographicExpanded] = useState(false);
  const [interestExpanded, setInterestExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getDisplayCategory = (cat: string) => categoryMap[cat] || 'Discussion';

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return communities;
    return communities.filter(c => getDisplayCategory(c.category) === selectedCategory);
  }, [communities, selectedCategory]);

  // Split into geographic and interest communities
  const geographic = useMemo(() => filtered.filter(c => c.type === 'location'), [filtered]);
  const interest = useMemo(() => filtered.filter(c => c.type !== 'location'), [filtered]);

  // Recommended: mix of not-yet-followed interest communities
  const recommended = useMemo(() => {
    const notFollowed = interest.filter(c => !c.isFollowing);
    return notFollowed.length > 0 ? notFollowed : interest;
  }, [interest]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const renderSection = (
    title: string,
    items: Community[],
    expanded: boolean,
    setExpanded: (v: boolean) => void,
  ) => {
    if (items.length === 0) return null;
    const visible = expanded ? items : items.slice(0, SECTION_SIZE);

    return (
      <div className="mb-10">
        <h2 className="text-base font-bold text-foreground mb-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map(community => (
            <ExploreCommunityCard
              key={community.id}
              community={community}
              onToggleFollow={onToggleFollow}
            />
          ))}
        </div>
        {items.length > SECTION_SIZE && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-6 text-xs font-semibold"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : 'Show more'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-extrabold text-foreground mb-5">Explore Communities</h1>

      {/* Category pills with scroll */}
      <div className="relative mb-8">
        <button
          onClick={() => scrollCategories('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-sm border border-border hidden md:flex items-center justify-center"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-0 md:px-7 pb-2"
        >
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === category
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-foreground border-border hover:bg-muted'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <button
          onClick={() => scrollCategories('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-sm border border-border hidden md:flex items-center justify-center"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-border mb-8" />

      {/* Recommended for you */}
      {renderSection('Recommended for you', recommended, recommendedExpanded, setRecommendedExpanded)}

      {/* Geographic communities */}
      {renderSection(
        'Your local communities',
        geographic,
        geographicExpanded,
        setGeographicExpanded,
      )}

      {/* Interest-based communities */}
      {renderSection(
        'Interest communities',
        interest,
        interestExpanded,
        setInterestExpanded,
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No communities found in this category.</p>
        </div>
      )}
    </div>
  );
};
