import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCategoryLabel } from '@/constants/communityCategories';

interface CommunityPreviewProps {
    data: {
        name: string;
        description: string;
        category: string;
        avatar_url: string;
    };
}

export const CommunityPreview = ({ data }: CommunityPreviewProps) => {
    const displayName = data.name || 'communityname';
    const displayDesc = data.description || 'Your community description will appear here...';
    const categoryLabel = getCategoryLabel(data.category);

    return (
        <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    {data.avatar_url ? (
                        <AvatarImage src={data.avatar_url} />
                    ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                            {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    )}
                </Avatar>
                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">c/{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                        1 weekly visitor · 1 weekly contributor
                    </p>
                </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {displayDesc}
            </p>
            {data.category && (
                <p className="text-xs text-muted-foreground">
                    Topic: <span className="font-medium text-foreground">{categoryLabel}</span>
                </p>
            )}
        </div>
    );
};
