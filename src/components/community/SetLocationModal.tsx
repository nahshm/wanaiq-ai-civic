import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight } from 'lucide-react';

interface SetLocationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Modal prompting user to set their location to access community features
 * Redirects to onboarding flow for location setup
 */
export const SetLocationModal: React.FC<SetLocationModalProps> = ({ open, onOpenChange }) => {
    const navigate = useNavigate();

    const handleSetLocation = () => {
        onOpenChange(false);
        // Navigate to onboarding settings page for location setup
        navigate('/settings?tab=location');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10">
                        <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center">Set Your Location</DialogTitle>
                    <DialogDescription className="text-center">
                        To access your community features, please set your county, constituency, and ward in your profile settings.
                        This helps us show you relevant local discussions and connect you with your community.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button onClick={handleSetLocation} className="w-full">
                        Set Location Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full"
                    >
                        Maybe Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
