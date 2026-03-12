import React from 'react';
import { Link } from 'react-router-dom';
import { buildProfileLink } from '@/lib/profile-links';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CommunityModerator } from '@/types/index';
import { Shield, Mail, Crown } from 'lucide-react';

interface ModeratorsListModalProps {
    moderators: CommunityModerator[];
    communityName: string;
    trigger?: React.ReactNode;
}

export const ModeratorsListModal: React.FC<ModeratorsListModalProps> = ({
    moderators,
    communityName,
    trigger,
}) => {
    // Sort: admins first, then moderators
    const sortedMods = [...moderators].sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return 0;
    });

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="text-xs text-primary hover:underline">
                        View All Moderators
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        c/{communityName} Moderators
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {sortedMods.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                            No moderators yet
                        </p>
                    ) : (
                        sortedMods.map((mod: any) => (
                            <div
                                key={mod.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={mod.profiles?.avatar_url || undefined} />
                                        <AvatarFallback className="text-sm">
                                            {mod.profiles?.display_name?.charAt(0) ||
                                                mod.profiles?.username?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <a
                                            href={buildProfileLink({ username: mod.profiles?.username ?? '', is_verified: mod.profiles?.is_verified, official_position: mod.profiles?.official_position })}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            u/{mod.profiles?.username}
                                        </a>
                                        {mod.profiles?.display_name && (
                                            <p className="text-xs text-muted-foreground">
                                                {mod.profiles.display_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {mod.role === 'admin' ? (
                                        <Badge variant="default" className="gap-1">
                                            <Crown className="w-3 h-3" />
                                            Admin
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="gap-1">
                                            <Shield className="w-3 h-3" />
                                            Mod
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-4 border-t text-center text-sm text-muted-foreground">
                    {moderators.filter((m: any) => m.role === 'admin').length} admins, {' '}
                    {moderators.filter((m: any) => m.role === 'moderator').length} moderators
                </div>
            </DialogContent>
        </Dialog>
    );
};
