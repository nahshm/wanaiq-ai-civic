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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Quote } from 'lucide-react';

interface AnswerQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: {
        id: string;
        question: string;
        asked_by: string;
        asked_at: string;
    };
    userId: string;
    officeHolderId: string;
    onAnswered: () => void;
}

export function AnswerQuestionModal({
    isOpen,
    onClose,
    question,
    userId,
    officeHolderId,
    onAnswered,
}: AnswerQuestionModalProps) {
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!answer.trim()) {
            toast.error('Please write your answer');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Submit answer
            const { error } = await supabase
                .from('office_questions')
                .update({
                    answer: answer.trim(),
                    answered_at: new Date().toISOString(),
                    answered_by: userId,
                })
                .eq('id', question.id);

            if (error) throw error;

            // 2. Log activity (fire & forget)
            try {
                await supabase.from('office_activity_log').insert({
                    office_holder_id: officeHolderId,
                    activity_type: 'question_answered',
                    title: 'Answered a Question',
                    description: `Answered: "${question.question.substring(0, 60)}${question.question.length > 60 ? '...' : ''}"`,
                    reference_id: question.id,
                    reference_type: 'question',
                    created_by: userId
                });
            } catch (logErr) {
                console.error('Failed to log activity:', logErr);
            }

            toast.success('Answer published! The citizen has been notified.');
            onAnswered();
            setAnswer('');
            onClose();
        } catch (error: any) {
            console.error('Error answering question:', error);
            toast.error(error.message || 'Failed to submit answer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
                            <MessageSquare className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Answer Question</DialogTitle>
                            <DialogDescription className="mt-0.5">
                                Your answer will be publicly visible
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Original Question */}
                <div className="rounded-lg bg-muted/50 p-4 border-l-4 border-primary/30">
                    <div className="flex items-start gap-2">
                        <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium leading-relaxed">{question.question}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Asked by <span className="font-medium">{question.asked_by}</span>{' '}
                                on {new Date(question.asked_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="answer" className="text-sm font-medium">
                            Your Answer <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="answer"
                            placeholder="Provide a clear and helpful response..."
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            rows={5}
                            maxLength={2000}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {answer.length}/2000
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
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
                            disabled={isSubmitting || !answer.trim()}
                            className="min-w-[140px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                'Publish Answer'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
