import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CommunityProfile } from '@/types/index';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, ShieldCheck } from 'lucide-react';

interface CommunityGuideModalProps {
    community: CommunityProfile;
    trigger: React.ReactNode;
}

export const CommunityGuideModal = ({ community, trigger }: CommunityGuideModalProps) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-lg p-0 overflow-hidden gap-0">
                <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                            Welcome to c/{community.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="text-muted-foreground space-y-4 mb-8 text-sm sm:text-base leading-relaxed">
                        <p>
                            Hi {user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.username || 'there'}, we're glad you're here!
                        </p>
                        <p>
                            To keep our community safe and productive, please remember to be respectful, 
                            focus on civic topics relevant to <strong>c/{community.name}</strong>, and avoid any NSFW or harmful content.
                        </p>
                        <ul className="text-left mt-4 space-y-3">
                            <li className="flex gap-2 items-start">
                                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <span>No hate speech or harassment.</span>
                            </li>
                            <li className="flex gap-2 items-start">
                                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <span>Stay on topic for this community.</span>
                            </li>
                            <li className="flex gap-2 items-start">
                                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <span>Respect everyone's privacy.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="w-full flex gap-3">
                        <Button 
                            className="flex-1 rounded-full font-medium" 
                            onClick={() => setIsOpen(false)}
                        >
                            I understand
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
