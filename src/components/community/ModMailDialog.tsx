import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ModMailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    communityName: string;
}

export const ModMailDialog = ({ isOpen, onClose, communityId, communityName }: ModMailDialogProps) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            // 1. Create the thread
            const { data: thread, error: threadError } = await supabase
                .from('mod_mail_threads')
                .insert({
                    community_id: communityId,
                    user_id: user.id,
                    subject: subject,
                    status: 'open'
                })
                .select()
                .single();

            if (threadError) throw threadError;

            // 2. Create the first message
            const { error: messageError } = await supabase
                .from('mod_mail_messages')
                .insert({
                    thread_id: thread.id,
                    sender_id: user.id,
                    content: message,
                    is_internal: false
                });

            if (messageError) throw messageError;

            toast({
                title: "Message Sent",
                description: "Your message has been sent to the moderators.",
            });
            onClose();
            setSubject('');
            setMessage('');
        } catch (error) {
            console.error('Error sending mod mail:', error);
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Message Mods of r/{communityName}</DialogTitle>
                    <DialogDescription>
                        Start a private conversation with the moderators.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="What is this regarding?"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            className="min-h-[150px]"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
