import { ChevronDown, LayoutGrid, List } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeedSortBarProps {
  sortBy: 'hot' | 'new' | 'top' | 'rising';
  onSortChange: (sort: 'hot' | 'new' | 'top' | 'rising') => void;
  viewMode: 'card' | 'compact';
  onViewModeChange: (mode: 'card' | 'compact') => void;
}

const sortOptions = [
  { value: 'hot', label: 'Best' },
  { value: 'new', label: 'New' },
  { value: 'top', label: 'Top' },
  { value: 'rising', label: 'Rising' },
] as const;

export const FeedSortBar = ({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: FeedSortBarProps) => {
  const currentSort = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];

  return (
    <div className="flex items-center gap-2 py-2 px-1">
      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:bg-muted/50 px-3 py-1.5 rounded-full transition-colors">
          {currentSort.label}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-card border-border min-w-[120px]">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value as any)}
              className={`cursor-pointer ${sortBy === option.value ? 'bg-muted' : ''}`}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Mode Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="p-1.5 hover:bg-muted/50 rounded-full transition-colors">
          {viewMode === 'card' ? (
            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
          ) : (
            <List className="w-4 h-4 text-muted-foreground" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-card border-border min-w-[100px]">
          <DropdownMenuItem
            onClick={() => onViewModeChange('card')}
            className={`cursor-pointer ${viewMode === 'card' ? 'bg-muted' : ''}`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Card
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onViewModeChange('compact')}
            className={`cursor-pointer ${viewMode === 'compact' ? 'bg-muted' : ''}`}
          >
            <List className="w-4 h-4 mr-2" />
            Compact
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
