import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Step1_Topic } from './steps/Step1_Topic';
import { Step2_NameDescription } from './steps/Step2_NameDescription';
import { Step3_CommunityType } from './steps/Step3_CommunityType';
import { CommunityPreview } from './CommunityPreview';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CommunityData {
    name: string;
    description: string;
    category: string;
    visibility_type: 'public' | 'restricted' | 'private';
    is_mature: boolean;
    banner_url: string;
    avatar_url: string;
}

const INITIAL_DATA: CommunityData = {
    name: '',
    description: '',
    category: '',
    visibility_type: 'public',
    is_mature: false,
    banner_url: '',
    avatar_url: '',
};

const MAX_STEPS = 3;

interface CreateCommunityWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateCommunityWizard = ({ isOpen, onClose }: CreateCommunityWizardProps) => {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [data, setData] = useState<CommunityData>(INITIAL_DATA);

    const canProceed = () => {
        if (step === 1) return !!data.category;
        if (step === 2) return !!data.name.trim() && !!data.description.trim();
        return true;
    };

    const handleNext = () => {
        if (!canProceed()) {
            const messages: Record<number, { title: string; description: string }> = {
                1: { title: 'Topic required', description: 'Please select a topic for your community' },
                2: { title: 'Details required', description: 'Please enter a name and description' },
            };
            const msg = messages[step];
            if (msg) toast({ ...msg, variant: 'destructive' });
            return;
        }
        if (step < MAX_STEPS) setStep(s => s + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
    };

    const handleCreate = async () => {
        if (!user) {
            authModal.open('login');
            return;
        }

        setIsCreating(true);
        try {
            const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            const { data: communityId, error } = await supabase
                .rpc('create_community_ratelimited', {
                    p_name: slug,
                    p_display_name: data.name,
                    p_description: data.description,
                    p_category: data.category,
                    p_visibility_type: data.visibility_type,
                    p_is_mature: data.is_mature,
                });

            if (error) throw error;
            if (!communityId) throw new Error('Rate limit exceeded. Please try again later.');

            toast({ title: 'Success!', description: `c/${data.name} has been created` });
            handleClose();
            navigate(`/community/${slug}`);
        } catch (error: any) {
            console.error('Error creating community:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create community',
                variant: 'destructive'
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (isCreating) return;
        onClose();
        setTimeout(() => {
            setStep(1);
            setData(INITIAL_DATA);
        }, 300);
    };

    const showPreview = step === 2 && (data.name || data.description);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
                <DialogTitle className="sr-only">Create Community</DialogTitle>
                <DialogDescription className="sr-only">
                    Create a new community in 3 steps
                </DialogDescription>

                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 z-50 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex flex-col max-h-[80vh]">
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className={cn(
                            step === 2 && showPreview ? "grid grid-cols-[1fr_200px] gap-5" : ""
                        )}>
                            <div>
                                {step === 1 && (
                                    <Step1_Topic
                                        value={data.category}
                                        onChange={(category) => setData(prev => ({ ...prev, category }))}
                                    />
                                )}
                                {step === 2 && (
                                    <Step2_NameDescription
                                        data={data}
                                        onChange={setData}
                                    />
                                )}
                                {step === 3 && (
                                    <Step3_CommunityType
                                        value={data.visibility_type}
                                        isMature={data.is_mature}
                                        onChange={(type) => setData(prev => ({ ...prev, visibility_type: type }))}
                                        onMatureChange={(mature) => setData(prev => ({ ...prev, is_mature: mature }))}
                                    />
                                )}
                            </div>

                            {step === 2 && showPreview && (
                                <div className="hidden sm:block">
                                    <CommunityPreview data={data} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t px-6 py-4">
                        <div className="flex items-center justify-between">
                            {/* Step dots */}
                            <div className="flex gap-1.5">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-colors",
                                            i === step ? "bg-primary" :
                                                i < step ? "bg-primary/50" : "bg-muted-foreground/25"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={step === 1 ? handleClose : handleBack}
                                    disabled={isCreating}
                                    size="sm"
                                >
                                    {step === 1 ? 'Cancel' : 'Back'}
                                </Button>
                                {step < MAX_STEPS ? (
                                    <Button
                                        onClick={handleNext}
                                        disabled={!canProceed() || isCreating}
                                        size="sm"
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleCreate}
                                        disabled={isCreating}
                                        size="sm"
                                    >
                                        {isCreating ? 'Creating...' : 'Create Community'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
