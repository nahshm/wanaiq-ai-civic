import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CommunityRule } from '@/types/index';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    Settings, Plus, Pencil, Trash2, GripVertical, Loader2, ChevronUp, ChevronDown
} from 'lucide-react';

interface RulesManageDialogProps {
    communityId: string;
    communityName: string;
    rules: CommunityRule[];
    isAdmin: boolean;
}

export const RulesManageDialog: React.FC<RulesManageDialogProps> = ({
    communityId,
    communityName,
    rules,
    isAdmin,
}) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<CommunityRule | null>(null);
    const [newRuleTitle, setNewRuleTitle] = useState('');
    const [newRuleDescription, setNewRuleDescription] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);

    // Create rule mutation
    const createMutation = useMutation({
        mutationFn: async () => {
            const nextPosition = rules.length > 0
                ? Math.max(...rules.map(r => r.priority || 0)) + 1
                : 0;

            const { error } = await supabase
                .from('community_rules')
                .insert({
                    community_id: communityId,
                    title: newRuleTitle,
                    description: newRuleDescription,
                    priority: nextPosition,
                });
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: 'Rule added', description: 'New rule has been created' });
            queryClient.invalidateQueries({ queryKey: ['community'] });
            setNewRuleTitle('');
            setNewRuleDescription('');
            setIsAddingNew(false);
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to add rule', variant: 'destructive' });
        },
    });

    // Update rule mutation
    const updateMutation = useMutation({
        mutationFn: async (rule: CommunityRule) => {
            const { error } = await supabase
                .from('community_rules')
                .update({ title: rule.title, description: rule.description })
                .eq('id', rule.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: 'Rule updated' });
            queryClient.invalidateQueries({ queryKey: ['community'] });
            setEditingRule(null);
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to update rule', variant: 'destructive' });
        },
    });

    // Delete rule mutation
    const deleteMutation = useMutation({
        mutationFn: async (ruleId: string) => {
            const { error } = await supabase
                .from('community_rules')
                .delete()
                .eq('id', ruleId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: 'Rule deleted' });
            queryClient.invalidateQueries({ queryKey: ['community'] });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to delete rule', variant: 'destructive' });
        },
    });

    // Move rule up/down
    const moveMutation = useMutation({
        mutationFn: async ({ ruleId, direction }: { ruleId: string; direction: 'up' | 'down' }) => {
            const currentIndex = rules.findIndex(r => r.id === ruleId);
            const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

            if (swapIndex < 0 || swapIndex >= rules.length) return;

            const currentRule = rules[currentIndex];
            const swapRule = rules[swapIndex];

            // Swap priorities
            await supabase.from('community_rules').update({ priority: swapRule.priority }).eq('id', currentRule.id);
            await supabase.from('community_rules').update({ priority: currentRule.priority }).eq('id', swapRule.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community'] });
        },
    });

    const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    if (!isAdmin) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Settings className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        Manage Rules for c/{communityName}
                        <Button
                            size="sm"
                            onClick={() => setIsAddingNew(true)}
                            disabled={isAddingNew || isPending}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Rule
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Add new rule form */}
                    {isAddingNew && (
                        <div className="p-3 border rounded-lg space-y-3 bg-muted/30">
                            <div className="space-y-2">
                                <Label>Rule Title *</Label>
                                <Input
                                    value={newRuleTitle}
                                    onChange={(e) => setNewRuleTitle(e.target.value)}
                                    placeholder="No spam"
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description (optional)</Label>
                                <Textarea
                                    value={newRuleDescription}
                                    onChange={(e) => setNewRuleDescription(e.target.value)}
                                    placeholder="Explain the rule..."
                                    disabled={isPending}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddingNew(false)}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => createMutation.mutate()}
                                    disabled={!newRuleTitle.trim() || isPending}
                                >
                                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Existing rules */}
                    {rules.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                            No rules yet. Click "Add Rule" to create one.
                        </p>
                    ) : (
                        rules.map((rule, index) => (
                            <div
                                key={rule.id}
                                className="p-3 border rounded-lg flex items-start gap-3"
                            >
                                <div className="flex flex-col gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => moveMutation.mutate({ ruleId: rule.id, direction: 'up' })}
                                        disabled={index === 0 || isPending}
                                    >
                                        <ChevronUp className="w-3 h-3" />
                                    </Button>
                                    <span className="text-xs text-center font-medium">{index + 1}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => moveMutation.mutate({ ruleId: rule.id, direction: 'down' })}
                                        disabled={index === rules.length - 1 || isPending}
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                    </Button>
                                </div>

                                {editingRule?.id === rule.id ? (
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            value={editingRule.title}
                                            onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
                                            disabled={isPending}
                                        />
                                        <Textarea
                                            value={editingRule.description || ''}
                                            onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                                            disabled={isPending}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setEditingRule(null)}>
                                                Cancel
                                            </Button>
                                            <Button size="sm" onClick={() => updateMutation.mutate(editingRule)}>
                                                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <div className="font-medium">{rule.title}</div>
                                        {rule.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                                        )}
                                    </div>
                                )}

                                {editingRule?.id !== rule.id && (
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setEditingRule(rule)}
                                            disabled={isPending}
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive"
                                            onClick={() => {
                                                if (confirm('Delete this rule?')) {
                                                    deleteMutation.mutate(rule.id);
                                                }
                                            }}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
