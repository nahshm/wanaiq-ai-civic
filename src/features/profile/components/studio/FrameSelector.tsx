import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FrameAnimation {
    id: string | null;
    name: string;
    premium: boolean;
    description: string;
}

interface FrameSelectorProps {
    frames: FrameAnimation[];
    selectedFrame: string | null;
    onSelect: (frameId: string | null) => void;
    canUsePremium: boolean;
    className?: string;
}

// Frame animation preview styles
const getFramePreviewStyle = (frameId: string | null): string => {
    switch (frameId) {
        case 'ballot_spin':
            return 'ring-4 ring-blue-500 animate-pulse';
        case 'flag_wave':
            return 'ring-4 ring-green-500 ring-offset-red-500 ring-offset-2';
        case 'stars_glow':
            return 'ring-4 ring-yellow-500 shadow-lg shadow-yellow-500/50';
        case 'civic_pulse':
            return 'ring-4 ring-purple-500 animate-pulse';
        case 'verified_shine':
            return 'ring-4 ring-blue-400 shadow-lg shadow-blue-400/50';
        default:
            return 'ring-2 ring-border';
    }
};

/**
 * FrameSelector - Avatar frame animation picker
 */
export const FrameSelector: React.FC<FrameSelectorProps> = ({
    frames,
    selectedFrame,
    onSelect,
    canUsePremium,
    className,
}) => {
    const freeFrames = frames.filter(f => !f.premium);
    const premiumFrames = frames.filter(f => f.premium);

    return (
        <div className={cn('space-y-4', className)}>
            {/* Free Frames */}
            <div>
                <h4 className="text-sm font-medium mb-3">Free Frames</h4>
                <div className="flex flex-wrap gap-4">
                    {freeFrames.map(frame => (
                        <FrameCard
                            key={frame.id || 'none'}
                            frame={frame}
                            isSelected={selectedFrame === frame.id}
                            isLocked={false}
                            onSelect={() => onSelect(frame.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Premium Frames */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-medium">Premium Frames</h4>
                    <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-500">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Premium
                    </Badge>
                </div>
                <div className="flex flex-wrap gap-4">
                    {premiumFrames.map(frame => (
                        <FrameCard
                            key={frame.id}
                            frame={frame}
                            isSelected={selectedFrame === frame.id}
                            isLocked={!canUsePremium}
                            onSelect={() => canUsePremium && onSelect(frame.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

interface FrameCardProps {
    frame: FrameAnimation;
    isSelected: boolean;
    isLocked: boolean;
    onSelect: () => void;
}

const FrameCard: React.FC<FrameCardProps> = ({
    frame,
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
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                    isSelected && 'bg-primary/10 border-primary',
                    isLocked && 'opacity-50 cursor-not-allowed',
                    !isLocked && 'hover:bg-muted cursor-pointer',
                )}
            >
                {/* Avatar preview with frame */}
                <div className="relative">
                    <Avatar className={cn(
                        'w-12 h-12',
                        getFramePreviewStyle(frame.id)
                    )}>
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            U
                        </AvatarFallback>
                    </Avatar>

                    {/* Selection indicator */}
                    {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                    )}

                    {/* Lock indicator */}
                    {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                            <Lock className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>

                {/* Frame name */}
                <span className="text-xs font-medium text-center">
                    {frame.name}
                </span>
            </button>
        </TooltipTrigger>
        <TooltipContent>
            <p className="font-medium">{frame.name}</p>
            <p className="text-xs text-muted-foreground">{frame.description}</p>
            {isLocked && <p className="text-xs text-amber-500 mt-1">Requires premium</p>}
        </TooltipContent>
    </Tooltip>
);

export default FrameSelector;
