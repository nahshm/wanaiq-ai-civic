import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Level {
    id: string;
    name: string;
    type: 'COUNTY' | 'CONSTITUENCY' | 'WARD' | 'COMMUNITY' | 'SEPARATOR';
    avatarUrl?: string;
    communitySlug?: string;  // URL slug for navigation
    isActive?: boolean;       // Whether this is the current community
}

interface LevelSelectorProps {
    levels: Level[];
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ levels }) => {
    const navigate = useNavigate();

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleLevelClick = (level: Level) => {
        // Only navigate if community exists and is not already active
        if (level.communitySlug && !level.isActive) {
            navigate(`/c/${level.communitySlug}`);
        }
    };

    return (
        <div data-tour="tour-level-selector" className="w-14 min-w-14 md:w-[60px] bg-sidebar-background flex flex-col border-r border-sidebar-border flex-shrink-0 h-full min-h-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="flex flex-col items-center py-4 space-y-3">
            {levels.map((level) => {
                if (level.type === 'SEPARATOR') {
                    return (
                        <div key={level.id} className="w-8 h-[2px] bg-sidebar-border rounded-full shrink-0 my-1" />
                    );
                }

                const isActive = level.isActive;
                const isDisabled = !level.communitySlug;  // Disabled if community doesn't exist

                return (
                    <div key={level.id} className="relative group flex items-center justify-center w-full shrink-0">
                        <button
                            onClick={() => handleLevelClick(level)}
                            disabled={isDisabled}
                            className={cn(
                                'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 relative overflow-hidden',
                                isActive
                                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-sidebar-background'
                                    : isDisabled
                                        ? 'opacity-40 cursor-not-allowed'
                                        : 'hover:ring-2 hover:ring-sidebar-accent hover:ring-offset-2 hover:ring-offset-sidebar-background cursor-pointer'
                            )}
                            title={level.name}
                        >
                            <Avatar className="w-full h-full">
                                <AvatarImage src={level.avatarUrl} />
                                <AvatarFallback className={cn(
                                    'text-xs font-bold',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-sidebar-accent text-sidebar-accent-foreground'
                                )}>
                                    {getInitials(level.name)}
                                </AvatarFallback>
                            </Avatar>
                        </button>

                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg border border-border">
                            <div className="font-semibold">{level.name}</div>
                            <div className="text-xs text-muted-foreground">{level.type}</div>
                            {isDisabled && <div className="text-xs text-destructive mt-1">Not created</div>}
                            {/* Arrow */}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-popover" />
                        </div>

                        {/* Active Indicator */}
                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                        )}
                    </div>
                );
            })}
            </div>
          </ScrollArea>
        </div>
    );
};

export default LevelSelector;
