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
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, FileEdit, TrendingUp } from 'lucide-react';
import { PROJECT_STATUS_OPTIONS, getProgressColor } from './officeConstants';

interface UpdateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: {
        id: string;
        title: string;
        status: string | null;
        progress_percentage: number | null;
    };
    officeHolderId: string;
    userId: string;
    onProjectUpdated: () => void;
}

const UPDATE_TYPES = [
    { value: 'progress', label: '📊 Progress Update' },
    { value: 'milestone', label: '🎯 Milestone Reached' },
    { value: 'delay', label: '⚠️ Challenge / Delay' },
    { value: 'issue', label: '🚨 Issue Reported' },
    { value: 'completion', label: '✅ Project Completed' },
];

export function UpdateProjectModal({
    isOpen,
    onClose,
    project,
    officeHolderId,
    userId,
    onProjectUpdated,
}: UpdateProjectModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateType, setUpdateType] = useState('progress');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [newStatus, setNewStatus] = useState(project.status || 'in_progress');
    const [newProgress, setNewProgress] = useState(project.progress_percentage || 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsSubmitting(true);

        try {
            // 1. Insert project update (maps to actual project_updates schema)
            const { error: updateErr } = await supabase
                .from('project_updates')
                .insert({
                    project_id: project.id,
                    update_type: updateType,
                    title: title.trim(),
                    description: description.trim() || `${updateType} update — Progress: ${newProgress}%`,
                    created_by: userId,
                } as any);

            if (updateErr) throw updateErr;

            // 2. Update the project itself (progress_percentage lives on government_projects)
            const projectUpdate: any = {
                progress_percentage: newProgress,
                status: newStatus,
                updated_at: new Date().toISOString(),
            };

            if (updateType === 'completion') {
                projectUpdate.actual_completion_date = new Date().toISOString().split('T')[0];
                projectUpdate.progress_percentage = 100;
                projectUpdate.status = 'completed';
            }

            const { error: projErr } = await supabase
                .from('government_projects')
                .update(projectUpdate)
                .eq('id', project.id);

            if (projErr) throw projErr;

            // 3. Log activity (non-blocking — table may not exist yet)
            try {
                await supabase.from('office_activity_log' as any).insert({
                    office_holder_id: officeHolderId,
                    activity_type: 'project_updated',
                    title: `Updated project: ${project.title}`,
                    description: `${title.trim()} — Progress: ${newProgress}%`,
                    reference_id: project.id,
                    reference_type: 'project',
                    created_by: userId,
                    metadata: { update_type: updateType, progress: newProgress, status: newStatus },
                });
            } catch {
                // Activity log table may not exist yet — ignore
            }

            toast.success('Project updated successfully!');
            onProjectUpdated();
            handleClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setUpdateType('progress');
        setTitle('');
        setDescription('');
        setNewStatus(project.status || 'in_progress');
        setNewProgress(project.progress_percentage || 0);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileEdit className="h-5 w-5 text-primary" />
                        Update Project
                    </DialogTitle>
                    <DialogDescription className="truncate">
                        {project.title}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Update Type</Label>
                        <Select value={updateType} onValueChange={setUpdateType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {UPDATE_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="update-title">Update Title *</Label>
                        <Input
                            id="update-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Phase 1 foundation work completed"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="update-desc">Details</Label>
                        <Textarea
                            id="update-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what has been accomplished or any challenges..."
                            className="min-h-[80px] resize-none"
                            maxLength={1000}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>New Status</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROJECT_STATUS_OPTIONS.map(s => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.icon} {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                                <span>Progress</span>
                                <span className="text-xs font-mono text-muted-foreground">{newProgress}%</span>
                            </Label>
                            <Slider
                                value={[newProgress]}
                                onValueChange={(v) => setNewProgress(v[0])}
                                max={100}
                                step={5}
                                className="mt-2"
                            />
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${getProgressColor(newProgress)}`}
                                    style={{ width: `${newProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" disabled={!title.trim() || isSubmitting} className="w-full">
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <TrendingUp className="h-4 w-4 mr-2" />
                        )}
                        Post Update
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default UpdateProjectModal;
