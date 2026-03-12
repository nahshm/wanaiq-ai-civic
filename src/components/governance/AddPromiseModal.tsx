import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Target, Loader2, Calendar, Sparkles } from 'lucide-react';
import { PROMISE_CATEGORIES } from './officeConstants';

interface AddPromiseModalProps {
    isOpen: boolean;
    onClose: () => void;
    officeHolderId: string;
    userId: string;
    onPromiseAdded: () => void;
}

export function AddPromiseModal({
    isOpen,
    onClose,
    officeHolderId,
    userId,
    onPromiseAdded,
}: AddPromiseModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [deadline, setDeadline] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim() || !category) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create the promise
            const { data: promise, error } = await supabase
                .from('office_promises')
                .insert({
                    office_holder_id: officeHolderId,
                    title: title.trim(),
                    description: description.trim(),
                    category,
                    deadline: deadline ? new Date(deadline).toISOString() : null,
                    status: 'pending',
                    progress: 0,
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Log activity (fire & forget)
            try {
                await supabase.from('office_activity_log').insert({
                    office_holder_id: officeHolderId,
                    activity_type: 'promise_created',
                    title: 'Made a New Promise',
                    description: `Promised: "${title.trim()}"`,
                    reference_id: promise.id,
                    reference_type: 'promise',
                    created_by: userId
                });
            } catch (logErr) {
                console.error('Failed to log activity:', logErr);
                // Don't block success
            }

            toast.success('Promise published successfully! Citizens can now track your progress.');
            onPromiseAdded();
            handleReset();
            onClose();
        } catch (error: any) {
            console.error('Error adding promise:', error);
            toast.error(error.message || 'Failed to add promise');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setTitle('');
        setDescription('');
        setCategory('');
        setDeadline('');
    };

    // Calculate minimum deadline date (tomorrow)
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    const minDateStr = minDate.toISOString().split('T')[0];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                            <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Make a Public Promise</DialogTitle>
                            <DialogDescription className="mt-0.5">
                                Commit to something and let citizens track your progress
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="promise-title" className="text-sm font-medium">
                            Promise Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="promise-title"
                            placeholder="e.g., Build 5 new schools in the constituency"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={120}
                            className="h-11"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {title.length}/120
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="promise-description" className="text-sm font-medium">
                            Detailed Description <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="promise-description"
                            placeholder="Describe what you promise to do, how you'll achieve it, and what citizens can expect..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            maxLength={1000}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {description.length}/1000
                        </p>
                    </div>

                    {/* Category & Deadline Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Category <span className="text-destructive">*</span>
                            </Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROMISE_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="promise-deadline" className="text-sm font-medium">
                                Target Deadline
                            </Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="promise-deadline"
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    min={minDateStr}
                                    className="h-11 pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Trust Notice */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-medium text-foreground">Transparency matters.</span>{' '}
                            This promise will be visible to all citizens. Your progress will be publicly tracked
                            and contribute to your accountability score.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !description.trim() || !category}
                            className="min-w-[140px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                'Publish Promise'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
