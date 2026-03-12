import { cn } from '@/lib/utils';
import { communityCategoryGroups } from '@/constants/communityCategories';

interface Step1Props {
    value: string;
    onChange: (value: string) => void;
}

export const Step1_Topic = ({ value, onChange }: Step1Props) => {
    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-xl font-bold mb-1">What will your community be about?</h2>
                <p className="text-muted-foreground text-sm">
                    Choose a topic to help people discover your community.
                </p>
            </div>

            {communityCategoryGroups.map((group) => (
                <div key={group.label} className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                        {group.categories.map((cat) => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => onChange(cat.value)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
                                    value === cat.value
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-background hover:bg-muted text-foreground"
                                )}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
