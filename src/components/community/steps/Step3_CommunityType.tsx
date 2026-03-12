import { Globe, Lock, Eye, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type CommunityType = 'public' | 'restricted' | 'private';

interface Step3Props {
    value: CommunityType;
    isMature: boolean;
    onChange: (value: CommunityType) => void;
    onMatureChange: (value: boolean) => void;
}

const options = [
    {
        value: 'public' as const,
        icon: Globe,
        title: 'Public',
        description: 'Anyone can view, post, and comment to this community'
    },
    {
        value: 'restricted' as const,
        icon: Eye,
        title: 'Restricted',
        description: 'Anyone can view, but only approved users can contribute'
    },
    {
        value: 'private' as const,
        icon: Lock,
        title: 'Private',
        description: 'Only approved users can view and contribute'
    }
];

export const Step3_CommunityType = ({ value, isMature, onChange, onMatureChange }: Step3Props) => {
    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-xl font-bold mb-1">What kind of community is this?</h2>
                <p className="text-muted-foreground text-sm">
                    Decide who can view and contribute in your community. Only public communities show up in search.{' '}
                    <span className="font-semibold">Important:</span> Once set, you will need to submit a request to change your community type.
                </p>
            </div>

            <div className="space-y-2">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "w-full flex items-center gap-3 p-3.5 rounded-lg border transition-all text-left",
                            value === option.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40 hover:bg-muted/50"
                        )}
                    >
                        <option.icon className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">{option.title}</h3>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                        <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            value === option.value ? "border-primary" : "border-muted-foreground/40"
                        )}>
                            {value === option.value && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Mature (18+) Toggle */}
            <div className="flex items-center justify-between p-3.5 border rounded-lg">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <h3 className="font-semibold text-sm">Mature (18+)</h3>
                        <p className="text-xs text-muted-foreground">Users must be over 18 to view and contribute</p>
                    </div>
                </div>
                <Switch
                    checked={isMature}
                    onCheckedChange={onMatureChange}
                    aria-label="Toggle mature content"
                />
            </div>

            <p className="text-xs text-muted-foreground">
                By continuing, you agree to our{' '}
                <span className="underline cursor-pointer font-medium">Community Guidelines</span>{' '}
                and acknowledge that you understand the{' '}
                <span className="underline cursor-pointer font-medium">Platform Rules</span>.
            </p>
        </div>
    );
};
