import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
    password: string;
    className?: string;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

interface PasswordRequirement {
    label: string;
    met: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
    password,
    className,
}) => {
    const requirements = useMemo<PasswordRequirement[]>(() => [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
        { label: 'Contains number', met: /[0-9]/.test(password) },
    ], [password]);

    const strength: PasswordStrength = useMemo(() => {
        if (password.length === 0) return 'weak';

        const metCount = requirements.filter(r => r.met).length;

        if (metCount <= 2) return 'weak';
        if (metCount === 3) return 'medium';
        return 'strong';
    }, [requirements, password.length]);

    const strengthConfig = {
        weak: { color: 'bg-red-500', bars: 1, text: 'Weak' },
        medium: { color: 'bg-yellow-500', bars: 2, text: 'Good' },
        strong: { color: 'bg-green-500', bars: 3, text: 'Strong' },
    };

    const config = strengthConfig[strength];

    if (!password) return null;

    return (
        <div className={cn('space-y-3', className)}>
            {/* Strength Bars */}
            <div className="space-y-2">
                <div className="flex gap-1.5">
                    {[1, 2, 3].map((bar) => (
                        <div
                            key={bar}
                            className={cn(
                                'h-1.5 flex-1 rounded-full transition-all duration-300',
                                bar <= config.bars ? config.color : 'bg-muted'
                            )}
                        />
                    ))}
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                    Password strength: <span className={cn(
                        strength === 'strong' && 'text-green-600',
                        strength === 'medium' && 'text-yellow-600',
                        strength === 'weak' && 'text-red-600'
                    )}>
                        {config.text}
                    </span>
                </p>
            </div>

            {/* Requirements Checklist */}
            <div className="space-y-1.5">
                {requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        {req.met ? (
                            <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className={cn(
                            'transition-colors',
                            req.met ? 'text-green-600 line-through' : 'text-muted-foreground'
                        )}>
                            {req.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
