import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Flame,
  TrendingUp,
  Clock,
  Star,
  Filter,
  MoreHorizontal,
  List,
  SquareIcon,
  Check
} from 'lucide-react';

export type FeedFilter = 'all' | 'following' | 'governance' | 'accountability' | 'civic-education' | 'discussion';

interface FeedHeaderProps {
  sortBy: 'hot' | 'new' | 'top' | 'rising';
  onSortChange: (sort: 'hot' | 'new' | 'top' | 'rising') => void;
  viewMode: 'card' | 'compact';
  onViewModeChange: (mode: 'card' | 'compact') => void;
  filterBy?: FeedFilter;
  onFilterChange?: (filter: FeedFilter) => void;
  className?: string;
}

const filterOptions: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'All Communities' },
  { value: 'following', label: 'Following Only' },
  { value: 'governance', label: 'Governance' },
  { value: 'accountability', label: 'Accountability' },
  { value: 'civic-education', label: 'Civic Education' },
  { value: 'discussion', label: 'Discussion' },
];

export const FeedHeader = ({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  filterBy = 'all',
  onFilterChange,
  className
}: FeedHeaderProps) => {

  const sortOptions = [
    { value: 'hot', label: 'Hot', icon: Flame },
    { value: 'new', label: 'New', icon: Clock },
    { value: 'top', label: 'Top', icon: Star },
    { value: 'rising', label: 'Rising', icon: TrendingUp },
  ] as const;

  const getSortIcon = (sort: string) => {
    const option = sortOptions.find(opt => opt.value === sort);
    return option?.icon || Flame;
  };

  const SortIcon = getSortIcon(sortBy);

  return (
    <div className="bg-sidebar-background border-b border-sidebar-border px-4 py-3 sticky top-16 z-40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {/* Sort Buttons with Sliding Underline */}
          <div className="relative flex items-center space-x-1 bg-background rounded-lg p-1 min-w-max">
            {sortOptions.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={sortBy === value ? "default" : "ghost"}
                size="sm"
                onClick={() => onSortChange(value)}
                className={`relative h-8 px-3 transition-all duration-200 ${
                  sortBy === value
                    ? 'text-sidebar-accent-foreground'
                    : 'text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon className={`w-4 h-4 mr-1 transition-colors duration-200 ${
                  sortBy === value ? 'text-civic-green' : ''
                }`} />
                {label}
                {sortBy === value && (
                  <>
                    {/* Sliding underline */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-civic-green to-civic-blue rounded-full animate-slide-in" />
                    {/* Live activity indicator */}
                    {value === 'hot' && (
                      <span className="ml-1.5 flex items-center gap-1 text-[10px] text-civic-orange">
                        <span className="animate-pulse">🔥</span>
                        234
                      </span>
                    )}
                    {value === 'rising' && (
                      <span className="ml-1.5 flex items-center gap-1 text-[10px] text-civic-green">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic-green opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-civic-green"></span>
                        </span>
                      </span>
                    )}
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-background rounded-lg p-1">
            <Button
              variant={viewMode === 'card' ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange('card')}
              className={`h-8 px-2 ${viewMode === 'card'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-muted-foreground hover:text-sidebar-foreground'
                }`}
            >
              <SquareIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'compact' ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange('compact')}
              className={`h-8 px-2 ${viewMode === 'compact'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-muted-foreground hover:text-sidebar-foreground'
                }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${filterBy !== 'all'
                    ? 'text-civic-green'
                    : 'text-sidebar-muted-foreground hover:text-sidebar-foreground'}`}
                >
                  <Filter className="w-4 h-4" />
                  {filterBy !== 'all' && (
                    <span className="ml-1 text-xs">
                      {filterOptions.find(f => f.value === filterBy)?.label}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-sidebar-background border-sidebar-border min-w-[180px]">
                {filterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    className={`text-sidebar-foreground hover:bg-sidebar-accent flex items-center justify-between cursor-pointer ${filterBy === option.value ? 'bg-sidebar-accent/50' : ''
                      }`}
                    onClick={() => onFilterChange?.(option.value)}
                  >
                    {option.label}
                    {filterBy === option.value && <Check className="w-4 h-4 text-civic-green" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-sidebar-muted-foreground hover:text-sidebar-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-sidebar-background border-sidebar-border">
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Hide read posts
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Show NSFW content
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Customize feed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};