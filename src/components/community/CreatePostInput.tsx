import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Image, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface CreatePostInputProps {
    communityId?: string;
    communityName?: string;
}

export const CreatePostInput = ({ communityId, communityName }: CreatePostInputProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleFocus = () => {
        const params = new URLSearchParams();
        if (communityName) params.set('community', communityName);
        if (communityId) params.set('communityId', communityId);
        const qs = params.toString();
        navigate(`/create${qs ? `?${qs}` : ''}`);
    };

    return (
        <div className="bg-sidebar-background border border-sidebar-border rounded-md p-2 mb-4 flex items-center gap-2">
            <Avatar className="w-8 h-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
            </Avatar>

            <Input
                placeholder="Create Post"
                className="bg-sidebar-accent/50 border-none hover:bg-sidebar-accent hover:border-sidebar-ring transition-colors cursor-text"
                onClick={handleFocus}
                readOnly
            />

            <Button variant="ghost" size="icon" onClick={handleFocus} className="text-sidebar-muted-foreground hover:bg-sidebar-accent">
                <Image className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleFocus} className="text-sidebar-muted-foreground hover:bg-sidebar-accent">
                <LinkIcon className="w-5 h-5" />
            </Button>
        </div>
    );
};
