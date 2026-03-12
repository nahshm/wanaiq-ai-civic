import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreatePollDialogProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    onPollCreated: () => void;
}

export const CreatePollDialog: React.FC<CreatePollDialogProps> = ({
    isOpen,
    onClose,
    communityId,
    onPollCreated,
}) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(['', '']); // Start with 2 empty options
    const [days, setDays] = useState('7'); // Default 7 days
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 10) {
            setOptions([...options, '']);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const validOptions = options.filter(o => o.trim() !== '');
        if (validOptions.length < 2) {
            toast({
                title: 'Error',
                description: 'You need at least 2 valid options.',
                variant: 'destructive',
            });
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(days));

            const { error } = await supabase
                .from('community_polls')
                .insert({
                    community_id: communityId,
                    question,
                    options: validOptions,
                    expires_at: expiresAt.toISOString(),
                    created_by: user.id,
                });

            if (error) throw error;

            toast({
                title: 'Poll created',
                description: 'Your poll is now live.',
            });

            onPollCreated();
            onClose();
            // Reset
            setQuestion('');
            setOptions(['', '']);
            setDays('7');
        } catch (error: any) {
            console.error('Error creating poll:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create poll',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Poll</DialogTitle>
                    <DialogDescription>
                        Ask the community a question.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="question">Question</Label>
                        <Textarea
                            id="question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. Should we host a meetup?"
                            required
                            className="resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Options</Label>
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    required
                                />
                                {options.length > 2 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeOption(index)}
                                        className="text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {options.length < 10 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOption}
                                className="w-full mt-2 border-dashed"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Option
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration (Days)</Label>
                        <Input
                            id="duration"
                            type="number"
                            min="1"
                            max="30"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !question}>
                            {loading ? 'Creating...' : 'Create Poll'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
