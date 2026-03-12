import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface AdministrativeDivisionManagerProps {
    countryCode: string;
    governanceLevel: string; // "state", "county", "prefecture", etc.
    levelIndex: number; // 1-5
    levelLabel: string; // Display name: "State", "Prefecture", "LGA"
    levelLabelPlural?: string; // "States", "Prefectures", "LGAs"
    parentLevelLabel?: string | null; // For showing parent dropdown label
}

interface Division {
    id: string;
    name: string;
    division_code?: string;
    population?: number;
    parent_id?: string;
    parent?: {
        name: string;
    };
}

export function AdministrativeDivisionManager({
    countryCode,
    governanceLevel,
    levelIndex,
    levelLabel,
    levelLabelPlural,
    parentLevelLabel
}: AdministrativeDivisionManagerProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingDivision, setEditingDivision] = useState<Division | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        division_code: '',
        population: '',
        parentId: ''
    });

    const pluralLabel = levelLabelPlural || `${levelLabel}s`;

    // Fetch divisions for this level
    const { data: divisions, isLoading } = useQuery({
        queryKey: ['admin-divisions', countryCode, governanceLevel],
        queryFn: async () => {
            const query = supabase
                .from('administrative_divisions')
                .select('*, parent:parent_id(name)')
                .eq('country_code', countryCode)
                .eq('governance_level', governanceLevel)
                .order('name');

            const { data, error } = await query;
            if (error) throw error;
            return data as Division[];
        }
    });

    // Fetch parent divisions (for level 2+)
    const { data: parentDivisions } = useQuery({
        queryKey: ['parent-divisions', countryCode, levelIndex],
        queryFn: async () => {
            if (levelIndex === 1) return []; // Top level has no parents

            const { data, error } = await supabase
                .from('administrative_divisions')
                .select('id, name')
                .eq('country_code', countryCode)
                .eq('level_index', levelIndex - 1)
                .order('name');

            if (error) throw error;
            return data;
        },
        enabled: levelIndex > 1
    });

    // Add mutation
    const addMutation = useMutation({
        mutationFn: async (newDivision: any) => {
            const { error } = await supabase
                .from('administrative_divisions')
                .insert([{
                    ...newDivision,
                    country_code: countryCode,
                    governance_level: governanceLevel,
                    level_index: levelIndex
                }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-divisions', countryCode, governanceLevel] });
            // Also invalidate child levels
            queryClient.invalidateQueries({ queryKey: ['parent-divisions', countryCode, levelIndex + 1] });
            toast({ title: `${levelLabel} added successfully` });
            setIsAddOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: `Error adding ${levelLabel.toLowerCase()}`,
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const { error } = await supabase
                .from('administrative_divisions')
                .update(data)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-divisions', countryCode, governanceLevel] });
            queryClient.invalidateQueries({ queryKey: ['parent-divisions', countryCode, levelIndex + 1] });
            toast({ title: `${levelLabel} updated successfully` });
            setIsEditOpen(false);
            setEditingDivision(null);
        },
        onError: (error: any) => {
            toast({
                title: `Error updating ${levelLabel.toLowerCase()}`,
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('administrative_divisions')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-divisions', countryCode, governanceLevel] });
            queryClient.invalidateQueries({ queryKey: ['parent-divisions', countryCode, levelIndex + 1] });
            toast({ title: `${levelLabel} deleted successfully` });
        },
        onError: (error: any) => {
            toast({
                title: `Error deleting ${levelLabel.toLowerCase()}`,
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    const resetForm = () => {
        setFormData({ name: '', division_code: '', population: '', parentId: '' });
    };

    const handleAdd = () => {
        const payload: any = {
            name: formData.name,
            population: formData.population ? parseInt(formData.population) : null
        };

        if (formData.division_code) {
            payload.division_code = formData.division_code;
        }

        if (levelIndex > 1 && formData.parentId) {
            payload.parent_id = formData.parentId;
        }

        addMutation.mutate(payload);
    };

    const handleEdit = () => {
        if (!editingDivision) return;

        const payload: any = {
            name: formData.name,
            population: formData.population ? parseInt(formData.population) : null
        };

        if (formData.division_code) {
            payload.division_code = formData.division_code;
        }

        if (levelIndex > 1 && formData.parentId) {
            payload.parent_id = formData.parentId;
        }

        updateMutation.mutate({ id: editingDivision.id, data: payload });
    };

    const openEditDialog = (division: Division) => {
        setEditingDivision(division);
        setFormData({
            name: division.name,
            division_code: division.division_code || '',
            population: division.population?.toString() || '',
            parentId: division.parent_id || ''
        });
        setIsEditOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading {pluralLabel.toLowerCase()}...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    Total: {divisions?.length || 0} {pluralLabel.toLowerCase()}
                </p>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add {levelLabel}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New {levelLabel}</DialogTitle>
                            <DialogDescription>
                                Enter the details for the new {levelLabel.toLowerCase()}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">{levelLabel} Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={`e.g., ${levelLabel === 'State' ? 'California' : 'Example'}`}
                                />
                            </div>

                            {levelIndex > 1 && parentDivisions && (
                                <div>
                                    <Label htmlFor="parent">{parentLevelLabel || 'Parent'} *</Label>
                                    <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Select ${parentLevelLabel?.toLowerCase() || 'parent'}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {parentDivisions.map((parent: any) => (
                                                <SelectItem key={parent.id} value={parent.id}>
                                                    {parent.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div>
                                <Label htmlFor="code">Division Code (optional)</Label>
                                <Input
                                    id="code"
                                    value={formData.division_code}
                                    onChange={(e) => setFormData({ ...formData, division_code: e.target.value })}
                                    placeholder="e.g., US-CA, KE-30"
                                />
                            </div>

                            <div>
                                <Label htmlFor="population">Population (optional)</Label>
                                <Input
                                    id="population"
                                    type="number"
                                    value={formData.population}
                                    onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                                    placeholder="e.g., 4397073"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleAdd}
                                disabled={!formData.name || (levelIndex > 1 && !formData.parentId)}
                            >
                                Add {levelLabel}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            {levelIndex > 1 && <TableHead>{parentLevelLabel || 'Parent'}</TableHead>}
                            <TableHead>Division Code</TableHead>
                            <TableHead>Population</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {divisions && divisions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={levelIndex > 1 ? 5 : 4} className="text-center py-8 text-muted-foreground">
                                    No {pluralLabel.toLowerCase()} found. Add your first {levelLabel.toLowerCase()}.
                                </TableCell>
                            </TableRow>
                        ) : (
                            divisions?.map((division) => (
                                <TableRow key={division.id}>
                                    <TableCell className="font-medium">{division.name}</TableCell>
                                    {levelIndex > 1 && (
                                        <TableCell>{division.parent?.name || 'N/A'}</TableCell>
                                    )}
                                    <TableCell>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                            {division.division_code || '—'}
                                        </code>
                                    </TableCell>
                                    <TableCell>{division.population?.toLocaleString() || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditDialog(division)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm(`Delete ${division.name}? This will also delete all subdivisions.`)) {
                                                    deleteMutation.mutate(division.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit {levelLabel}</DialogTitle>
                        <DialogDescription>Update the {levelLabel.toLowerCase()} details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">{levelLabel} Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {levelIndex > 1 && parentDivisions && (
                            <div>
                                <Label htmlFor="edit-parent">{parentLevelLabel || 'Parent'}</Label>
                                <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {parentDivisions.map((parent: any) => (
                                            <SelectItem key={parent.id} value={parent.id}>
                                                {parent.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="edit-code">Division Code</Label>
                            <Input
                                id="edit-code"
                                value={formData.division_code}
                                onChange={(e) => setFormData({ ...formData, division_code: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit-population">Population</Label>
                            <Input
                                id="edit-population"
                                type="number"
                                value={formData.population}
                                onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleEdit}>Update {levelLabel}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
