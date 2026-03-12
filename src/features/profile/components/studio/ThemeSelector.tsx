import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Theme {
    id: string;
    name: string;
    premium: boolean;
    preview: string;
}

interface ThemeSelectorProps {
    themes: Theme[];
    selectedTheme: string;
    onSelect: (themeId: string) => void;
    canUsePremium: boolean;
    className?: string;
}

/**
 * ThemeSelector - Grid of theme options with premium indicators
 */
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
    themes,
    selectedTheme,
    onSelect,
    canUsePremium,
    className,
}) => {
    const freeThemes = themes.filter(t => !t.premium);
    const premiumThemes = themes.filter(t => t.premium);

    return (
        <div className={cn('space-y-4', className)}>
            {/* Free Themes */}
            <div>
                <h4 className="text-sm font-medium mb-2">Free Themes</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {freeThemes.map(theme => (
                        <ThemeCard
                            key={theme.id}
                            theme={theme}
                            isSelected={selectedTheme === theme.id}
                            isLocked={false}
                            onSelect={() => onSelect(theme.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Premium Themes */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium">Premium Themes</h4>
                    <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-500">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Premium
                    </Badge>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {premiumThemes.map(theme => (
                        <ThemeCard
                            key={theme.id}
                            theme={theme}
                            isSelected={selectedTheme === theme.id}
                            isLocked={!canUsePremium}
                            onSelect={() => canUsePremium && onSelect(theme.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

interface ThemeCardProps {
    theme: Theme;
    isSelected: boolean;
    isLocked: boolean;
    onSelect: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
    theme,
    isSelected,
    isLocked,
    onSelect,
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                onClick={onSelect}
                disabled={isLocked}
                className={cn(
                    'relative h-16 rounded-lg border-2 transition-all overflow-hidden',
                    theme.preview,
                    isSelected && 'ring-2 ring-primary ring-offset-2',
                    isLocked && 'opacity-50 cursor-not-allowed',
                    !isLocked && 'hover:scale-105 cursor-pointer',
                )}
            >
                {/* Selection indicator */}
                {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Check className="w-6 h-6 text-white" />
                    </div>
                )}

                {/* Lock indicator */}
                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock className="w-5 h-5 text-white" />
                    </div>
                )}

                {/* Theme name */}
                <span className="absolute bottom-1 left-1 right-1 text-[10px] text-white text-center font-medium drop-shadow-lg truncate">
                    {theme.name}
                </span>
            </button>
        </TooltipTrigger>
        <TooltipContent>
            <p>{theme.name}</p>
            {isLocked && <p className="text-xs text-muted-foreground">Requires premium</p>}
        </TooltipContent>
    </Tooltip>
);

export default ThemeSelector;
