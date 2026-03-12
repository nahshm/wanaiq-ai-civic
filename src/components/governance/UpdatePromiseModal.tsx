import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, TrendingUp, CheckCircle, AlertTriangle, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UpdatePromiseModalProps {
    isOpen: boolean;
    onClose: () => void;
    promise: {
        id: string;
        title: string;
        status: string;
        progress: number;
        description: string;
    };
    officeHolderId: string;
    userId: string;
    onPromiseUpdated: () => void;
}

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Not Started', icon: '⏳', color: 'bg-gray-100 text-gray-700' },
    { value: 'in_progress', label: 'In Progress', icon: '🔄', color: 'bg-blue-100 text-blue-700' },
    { value: 'completed', label: 'Completed', icon: '✅', color: 'bg-green-100 text-green-700' },
    { value: 'failed', label: 'Could Not Fulfill', icon: '❌', color: 'bg-red-100 text-red-700' },
];

export function UpdatePromiseModal({
    isOpen,
    onClose,
    promise,
    officeHolderId,
    userId,
    onPromiseUpdated,
}: UpdatePromiseModalProps) {
    const [status, setStatus] = useState(promise.status);
    const [progress, setProgress] = useState(promise.progress);
    const [updateNote, setUpdateNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const updateData: any = {
                status,
                progress: status === 'completed' ? 100 : status === 'failed' ? progress : progress,
            };

            if (status === 'completed') {
                updateData.completed_at = new Date().toISOString();
            } else {
                updateData.completed_at = null;
            }

            // Update description with note if provided
            if (updateNote.trim()) {
                updateData.description = `${promise.description}\n\n---\n📝 **Update (${new Date().toLocaleDateString()}):** ${updateNote.trim()}`;
            }

            const { error } = await supabase
                .from('office_promises')
                .update(updateData)
                .eq('id', promise.id);

            if (error) throw error;

            // 2. Log activity (fire & forget)
            try {
                let activityTitle = 'Updated a Promise';
                if (status === 'completed') activityTitle = 'Fulfilled a Promise! 🎉';
                else if (status === 'failed') activityTitle = 'Promise Update';

                await supabase.from('office_activity_log').insert({
                    office_holder_id: officeHolderId,
                    activity_type: 'promise_updated',
                    title: activityTitle,
                    description: updateNote.trim() || `Status updated to ${status.replace('_', ' ')} (Progress: ${updateData.progress}%)`,
                    reference_id: promise.id,
                    reference_type: 'promise',
                    created_by: userId
                });
            } catch (logErr) {
                console.error('Failed to log activity:', logErr);
            }

            toast.success(
                status === 'completed'
                    ? '🎉 Promise marked as completed!'
                    : 'Promise updated successfully!'
            );
            onPromiseUpdated();
            onClose();
        } catch (error: any) {
            console.error('Error updating promise:', error);
            toast.error(error.message || 'Failed to update promise');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                            <Pencil className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Update Progress</DialogTitle>
                            <DialogDescription className="mt-0.5 line-clamp-1">
                                {promise.title}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {/* Status */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        <span className="flex items-center gap-2">
                                            <span>{opt.icon}</span>
                                            <span>{opt.label}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Progress Slider */}
                    {status !== 'completed' && status !== 'failed' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Progress</Label>
                                <Badge variant="outline" className="tabular-nums font-mono">
                                    {progress}%
                                </Badge>
                            </div>
                            <Slider
                                value={[progress]}
                                onValueChange={([val]) => setProgress(val)}
                                max={100}
                                step={5}
                                className="py-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Not started</span>
                                <span>Halfway</span>
                                <span>Done</span>
                            </div>
                        </div>
                    )}

                    {/* Completion / Failure Message */}
                    {status === 'completed' && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-200">
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                            <p className="text-sm text-green-800">
                                Progress will be set to 100%. Citizens will see this promise as fulfilled.
                            </p>
                        </div>
                    )}

                    {status === 'failed' && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-200">
                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                            <p className="text-sm text-red-800">
                                Please add an explanation below for transparency. Citizens deserve to know why.
                            </p>
                        </div>
                    )}

                    {/* Update Note */}
                    <div className="space-y-2">
                        <Label htmlFor="update-note" className="text-sm font-medium">
                            Update Note {status === 'failed' && <span className="text-destructive">*</span>}
                        </Label>
                        <Textarea
                            id="update-note"
                            placeholder={
                                status === 'completed'
                                    ? 'Share what was achieved and the impact...'
                                    : status === 'failed'
                                        ? 'Explain why this promise could not be fulfilled...'
                                        : 'Share what progress has been made...'
                            }
                            value={updateNote}
                            onChange={(e) => setUpdateNote(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
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
                            disabled={isSubmitting || (status === 'failed' && !updateNote.trim())}
                            className="min-w-[140px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Save Update
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
