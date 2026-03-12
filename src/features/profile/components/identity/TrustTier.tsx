import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BadgeCheck, ShieldCheck, Home, User, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TrustTierType = 'resident' | 'verified_resident' | 'verified_user' | 'verified_official';

interface TrustTierProps {
    tier: TrustTierType;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

// Tier configurations
const tierConfig: Record<TrustTierType, {
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
}> = {
    resident: {
        label: 'Resident',
        shortLabel: 'Resident',
        description: 'Standard platform user',
        icon: <User className="w-4 h-4" />,
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
    },
    verified_resident: {
        label: 'Verified Resident',
        shortLabel: 'Verified',
        description: 'Location verified through ID or utility bill',
        icon: <Home className="w-4 h-4" />,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
    },
    verified_user: {
        label: 'Verified User',
        shortLabel: 'Verified',
        description: 'Identity verified through official documents',
        icon: <BadgeCheck className="w-4 h-4" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
    },
    verified_official: {
        label: 'Verified Official',
        shortLabel: 'Official',
        description: 'Government official with verified credentials',
        icon: <Landmark className="w-4 h-4" />,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
    },
};

const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
};

/**
 * TrustTier - Displays user's verification/trust level
 * Visual hierarchy: Resident < Verified Resident < Verified User < Verified Official
 */
export const TrustTier: React.FC<TrustTierProps> = ({
    tier,
    size = 'md',
    showLabel = true,
    className,
}) => {
    const config = tierConfig[tier];

    const badge = (
        <Badge
            variant="outline"
            className={cn(
                'flex items-center gap-1.5 font-medium',
                config.bgColor,
                config.borderColor,
                config.color,
                sizeClasses[size],
                tier === 'verified_official' && 'shadow-sm shadow-purple-500/20',
                className
            )}
        >
            {config.icon}
            {showLabel && (
                <span>{size === 'sm' ? config.shortLabel : config.label}</span>
            )}
        </Badge>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex">
                    {badge}
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <div className="flex items-center gap-2">
                    <ShieldCheck className={cn('w-5 h-5', config.color)} />
                    <div>
                        <p className="font-semibold">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                            {config.description}
                        </p>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
};

export default TrustTier;
