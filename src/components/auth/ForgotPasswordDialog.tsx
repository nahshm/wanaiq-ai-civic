import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ForgotPasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                setError(error.message);
            } else {
                setEmailSent(true);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setEmailSent(false);
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        {emailSent
                            ? "We've sent you a password reset link"
                            : 'Enter your email to receive a password reset link'}
                    </DialogDescription>
                </DialogHeader>

                {emailSent ? (
                    <div className="space-y-4">
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Check your email for a link to reset your password. If it doesn't appear within a few
                                minutes, check your spam folder.
                            </AlertDescription>
                        </Alert>
                        <p className="text-sm text-muted-foreground">
                            Sent reset link to: <strong>{email}</strong>
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="pl-10"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading || !email}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {emailSent && (
                    <DialogFooter>
                        <Button onClick={handleClose} className="w-full">
                            Done
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};
