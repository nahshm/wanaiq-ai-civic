import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Building2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface GovInstitution {
    id: string;
    name: string;
    acronym: string | null;
    institution_type: string;
    jurisdiction_type: string;
    jurisdiction_name: string | null;
    country_code: string;
    description: string | null;
    website: string | null;
    is_active: boolean;
    parent_institution_id: string | null;
}

interface InstitutionsManagerProps {
    countryCode: string;
}

export const InstitutionsManager: React.FC<InstitutionsManagerProps> = ({ countryCode }) => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingInstitution, setEditingInstitution] = useState<GovInstitution | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        acronym: '',
        institution_type: 'ministry',
        jurisdiction_type: 'national',
        jurisdiction_name: '',
        description: '',
        website: ''
    });

    // Fetch institutions for selected country
    const { data: institutions = [], isLoading, error } = useQuery({
        queryKey: ['institutions', countryCode],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('government_institutions')
                .select('*')
                .eq('country_code', countryCode)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            return data as GovInstitution[];
        },
        enabled: !!countryCode,
    });

    // Add institution mutation
    const addMutation = useMutation({
        mutationFn: async (newInstitution: typeof formData) => {
            const { data, error } = await supabase
                .from('government_institutions')
                .insert({
                    ...newInstitution,
                    country_code: countryCode,
                    jurisdiction_name: newInstitution.jurisdiction_type === 'national' ? null : newInstitution.jurisdiction_name || null
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['institutions', countryCode] });
            toast.success('Institution added successfully');
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error: Error) => {
            toast.error('Failed to add institution', { description: error.message });
        }
    });

    // Update institution mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<typeof formData> }) => {
            const { data, error } = await supabase
                .from('government_institutions')
                .update({
                    ...updates,
                    jurisdiction_name: updates.jurisdiction_type === 'national' ? null : updates.jurisdiction_name || null
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['institutions', countryCode] });
            toast.success('Institution updated successfully');
            setIsDialogOpen(false);
            setEditingInstitution(null);
            resetForm();
        },
        onError: (error: Error) => {
            toast.error('Failed to update institution', { description: error.message });
        }
    });

    // Delete institution mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('government_institutions')
                .update({ is_active: false })  // Soft delete
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['institutions', countryCode] });
            toast.success('Institution deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete institution', { description: error.message });
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            acronym: '',
            institution_type: 'ministry',
            jurisdiction_type: 'national',
            jurisdiction_name: '',
            description: '',
            website: ''
        });
    };

    const handleOpenDialog = (institution?: GovInstitution) => {
        if (institution) {
            setEditingInstitution(institution);
            setFormData({
                name: institution.name,
                acronym: institution.acronym || '',
                institution_type: institution.institution_type,
                jurisdiction_type: institution.jurisdiction_type,
                jurisdiction_name: institution.jurisdiction_name || '',
                description: institution.description || '',
                website: institution.website || ''
            });
        } else {
            setEditingInstitution(null);
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingInstitution) {
            updateMutation.mutate({ id: editingInstitution.id, updates: formData });
        } else {
            addMutation.mutate(formData);
        }
    };

    // Error state
    if (error) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                    <p className="text-lg font-semibold text-destructive">Failed to load institutions</p>
                    <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
                    <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['institutions', countryCode] })} className="mt-4">
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Government Institutions
                        </CardTitle>
                        <CardDescription>
                            Manage ministries, state corporations, and agencies for {countryCode}
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Institution
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{editingInstitution ? 'Edit' : 'Add'} Institution</DialogTitle>
                                <DialogDescription>
                                    {editingInstitution ? 'Update' : 'Create a new'} government institution
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ministry of Health"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="acronym">Acronym</Label>
                                        <Input
                                            id="acronym"
                                            value={formData.acronym}
                                            onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                                            placeholder="MoH"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="institution_type">Type *</Label>
                                        <Select value={formData.institution_type} onValueChange={(val) => setFormData({ ...formData, institution_type: val })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ministry">Ministry</SelectItem>
                                                <SelectItem value="state_corporation">State Corporation</SelectItem>
                                                <SelectItem value="agency">Agency</SelectItem>
                                                <SelectItem value="county_government">County Government</SelectItem>
                                                <SelectItem value="county_corporation">County Corporation</SelectItem>
                                                <SelectItem value="county_dept">County Department</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="jurisdiction_type">Jurisdiction *</Label>
                                        <Select value={formData.jurisdiction_type} onValueChange={(val) => setFormData({ ...formData, jurisdiction_type: val })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="national">National</SelectItem>
                                                <SelectItem value="county">County</SelectItem>
                                                <SelectItem value="multi-county">Multi-County</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {formData.jurisdiction_type !== 'national' && (
                                    <div>
                                        <Label htmlFor="jurisdiction_name">Jurisdiction Name *</Label>
                                        <Input
                                            id="jurisdiction_name"
                                            value={formData.jurisdiction_name}
                                            onChange={(e) => setFormData({ ...formData, jurisdiction_name: e.target.value })}
                                            placeholder="Nairobi County"
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://example.go.ke"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of the institution's role..."
                                        rows={3}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={addMutation.isPending || updateMutation.isPending}>
                                        {(addMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {editingInstitution ? 'Update' : 'Add'} Institution
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : institutions.length === 0 ? (
                    <div className="text-center py-12">
                        <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No institutions found for {countryCode}</p>
                        <Button onClick={() => handleOpenDialog()} className="mt-4">
                            Add First Institution
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Jurisdiction</TableHead>
                                <TableHead>Website</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {institutions.map((inst) => (
                                <TableRow key={inst.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{inst.name}</p>
                                            {inst.acronym && <p className="text-sm text-muted-foreground">{inst.acronym}</p>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">{inst.institution_type.replace('_', ' ')}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="capitalize">{inst.jurisdiction_type}</p>
                                            {inst.jurisdiction_name && <p className="text-sm text-muted-foreground">{inst.jurisdiction_name}</p>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {inst.website && (
                                            <a href={inst.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                                Visit
                                            </a>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(inst)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm(`Delete ${inst.name}?`)) {
                                                        deleteMutation.mutate(inst.id);
                                                    }
                                                }}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};
