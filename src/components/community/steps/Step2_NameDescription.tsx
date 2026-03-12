import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const MAX_NAME_LENGTH = 21;
const MAX_DESC_LENGTH = 500;

interface Step2Props {
    data: {
        name: string;
        description: string;
    };
    onChange: (data: any) => void;
}

export const Step2_NameDescription = ({ data, onChange }: Step2Props) => {
    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-xl font-bold mb-1">Tell us about your community</h2>
                <p className="text-muted-foreground text-sm">
                    A name and description help people understand what your community is all about.
                </p>
            </div>

            {/* Community Name */}
            <div className="space-y-1.5">
                <label htmlFor="community-name" className="text-sm font-medium">
                    Community name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                        c/
                    </span>
                    <Input
                        id="community-name"
                        value={data.name}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z0-9 _]/g, '');
                            if (value.length <= MAX_NAME_LENGTH) {
                                onChange({ ...data, name: value });
                            }
                        }}
                        maxLength={MAX_NAME_LENGTH}
                        className="pl-7 h-11 bg-muted/50 border-border"
                        placeholder="Business Art"
                    />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                    {data.name.length}/{MAX_NAME_LENGTH}
                </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <label htmlFor="community-desc" className="text-sm font-medium">
                    Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                    id="community-desc"
                    value={data.description}
                    onChange={(e) => onChange({ ...data, description: e.target.value })}
                    maxLength={MAX_DESC_LENGTH}
                    rows={5}
                    className="resize-none bg-muted/50 border-border"
                    placeholder="What is your community about?"
                />
                <p className="text-xs text-muted-foreground text-right">
                    {data.description.length}/{MAX_DESC_LENGTH}
                </p>
            </div>
        </div>
    );
};
