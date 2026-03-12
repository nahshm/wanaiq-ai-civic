import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Search, LinkIcon, Plus, Building2, MapPin } from 'lucide-react';
import {
    PROJECT_CATEGORIES,
    PROJECT_STATUS_OPTIONS,
    PROJECT_PRIORITY_OPTIONS,
    getProjectCategoryInfo,
    getProjectStatusColor,
    formatBudget,
} from './officeConstants';

interface AddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    officeHolderId: string;
    userId: string;
    position: {
        jurisdiction_name?: string;
        governance_level?: string;
        title?: string;
    } | null;
    officeHolderLocation: {
        county?: string;
        constituency?: string;
        ward?: string;
    };
    onProjectAdded: () => void;
}

export function AddProjectModal({
    isOpen,
    onClose,
    officeHolderId,
    userId,
    position,
    officeHolderLocation,
    onProjectAdded,
}: AddProjectModalProps) {
    const [activeTab, setActiveTab] = useState<'link' | 'create'>('link');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Link existing state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any | null>(null);

    // Create new state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('proposed');
    const [priority, setPriority] = useState('medium');
    const [budgetAllocated, setBudgetAllocated] = useState('');
    const [plannedStartDate, setPlannedStartDate] = useState('');
    const [plannedCompletionDate, setPlannedCompletionDate] = useState('');
    const [location, setLocation] = useState('');

    // Auto-search when query changes
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const searchTerm = `%${searchQuery.trim()}%`;
                
                // First try scoped by jurisdiction
                let query = supabase
                    .from('government_projects')
                    .select('id, title, status, category, progress_percentage, county, constituency, ward')
                    .ilike('title', searchTerm)
                    .limit(10);

                // Scope by jurisdiction (case-insensitive)
                let hasJurisdictionFilter = false;
                if (officeHolderLocation.ward) {
                    query = query.ilike('ward', officeHolderLocation.ward);
                    hasJurisdictionFilter = true;
                } else if (officeHolderLocation.constituency) {
                    query = query.ilike('constituency', officeHolderLocation.constituency);
                    hasJurisdictionFilter = true;
                } else if (officeHolderLocation.county) {
                    query = query.ilike('county', officeHolderLocation.county);
                    hasJurisdictionFilter = true;
                }

                const { data, error } = await query;
                if (error) throw error;

                // If jurisdiction-scoped search returns nothing, fallback to broader search
                if ((!data || data.length === 0) && hasJurisdictionFilter) {
                    const { data: broadData, error: broadError } = await supabase
                        .from('government_projects')
                        .select('id, title, status, category, progress_percentage, county, constituency, ward')
                        .ilike('title', searchTerm)
                        .limit(10);
                    if (!broadError) {
                        setSearchResults(broadData || []);
                        return;
                    }
                }

                setSearchResults(data || []);
            } catch (err) {
                console.error('Search error:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, officeHolderLocation]);

    const handleLinkProject = async () => {
        if (!selectedProject) return;
        setIsSubmitting(true);

        try {
            // Mark project as linked by updating last_updated_by
            // Note: Once office_holder_id migration is applied, switch to: { office_holder_id: officeHolderId }
            const { error } = await supabase
                .from('government_projects')
                .update({ last_updated_by: userId } as any)
                .eq('id', selectedProject.id);

            if (error) throw error;

            // Try to log activity (non-blocking — table may not exist yet)
            try {
                await supabase.from('office_activity_log' as any).insert({
                    office_holder_id: officeHolderId,
                    activity_type: 'project_linked',
                    title: `Linked project: ${selectedProject.title}`,
                    description: `Linked existing project "${selectedProject.title}" to this office`,
                    reference_id: selectedProject.id,
                    reference_type: 'project',
                    created_by: userId,
                });
            } catch {
                // Activity log table may not exist yet — ignore
            }

            toast.success('Project linked successfully!');
            onProjectAdded();
            handleClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to link project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsSubmitting(true);

        try {
            const projectData: any = {
                title: title.trim(),
                description: description.trim() || null,
                category: category || null,
                status,
                priority,
                budget_allocated: budgetAllocated ? parseFloat(budgetAllocated) : null,
                planned_start_date: plannedStartDate || null,
                planned_completion_date: plannedCompletionDate || null,
                location: location.trim() || null,
                county: officeHolderLocation.county || null,
                constituency: officeHolderLocation.constituency || null,
                ward: officeHolderLocation.ward || null,
                created_by: userId,
                progress_percentage: 0,
            };

            const { data, error } = await supabase
                .from('government_projects')
                .insert(projectData)
                .select()
                .single();

            if (error) throw error;

            // Log activity (non-blocking — table may not exist yet)
            try {
                await supabase.from('office_activity_log' as any).insert({
                    office_holder_id: officeHolderId,
                    activity_type: 'project_created',
                    title: `Created project: ${title.trim()}`,
                    description: description.trim() || null,
                    reference_id: data.id,
                    reference_type: 'project',
                    created_by: userId,
                });
            } catch {
                // Activity log table may not exist yet — ignore
            }

            toast.success('Project created successfully!');
            onProjectAdded();
            handleClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setActiveTab('link');
        setSearchQuery('');
        setSearchResults([]);
        setSelectedProject(null);
        setTitle('');
        setDescription('');
        setCategory('');
        setStatus('proposed');
        setPriority('medium');
        setBudgetAllocated('');
        setPlannedStartDate('');
        setPlannedCompletionDate('');
        setLocation('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Add Project
                    </DialogTitle>
                    <DialogDescription>
                        Link an existing project or create a new one for this office.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'link' | 'create')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="link" className="gap-1.5">
                            <LinkIcon className="h-3.5 w-3.5" />
                            Link Existing
                        </TabsTrigger>
                        <TabsTrigger value="create" className="gap-1.5">
                            <Plus className="h-3.5 w-3.5" />
                            Create New
                        </TabsTrigger>
                    </TabsList>

                    {/* LINK EXISTING TAB */}
                    <TabsContent value="link" className="space-y-4 mt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search projects in your jurisdiction..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {officeHolderLocation.county && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                Showing projects in: {officeHolderLocation.ward || officeHolderLocation.constituency || officeHolderLocation.county}
                            </div>
                        )}

                        {isSearching && (
                            <div className="text-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                            </div>
                        )}

                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {searchResults.map(project => {
                                const catInfo = getProjectCategoryInfo(project.category || '');
                                const isSelected = selectedProject?.id === project.id;
                                return (
                                    <Card
                                        key={project.id}
                                        className={`cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                        onClick={() => setSelectedProject(isSelected ? null : project)}
                                    >
                                        <CardContent className="py-3 px-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{project.title}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {project.category && (
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                {catInfo.label}
                                                            </Badge>
                                                        )}
                                                        {project.status && (
                                                            <Badge className={`text-[10px] px-1.5 py-0 ${getProjectStatusColor(project.status)}`}>
                                                                {project.status}
                                                            </Badge>
                                                        )}
                                                        {project.progress_percentage != null && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {project.progress_percentage}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`h-4 w-4 rounded-full border-2 ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No unlinked projects found. Try a different search or create a new one.
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleLinkProject}
                            disabled={!selectedProject || isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <LinkIcon className="h-4 w-4 mr-2" />
                            )}
                            Link Selected Project
                        </Button>
                    </TabsContent>

                    {/* CREATE NEW TAB */}
                    <TabsContent value="create" className="mt-4">
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="project-title">Project Title *</Label>
                                <Input
                                    id="project-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Mombasa County Road Upgrading"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="project-desc">Description</Label>
                                <Textarea
                                    id="project-desc"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the project objectives and scope..."
                                    className="min-h-[80px] resize-none"
                                    maxLength={1000}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROJECT_CATEGORIES.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
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
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROJECT_PRIORITY_OPTIONS.map(p => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="budget">Budget Allocated (KES)</Label>
                                    <Input
                                        id="budget"
                                        type="number"
                                        value={budgetAllocated}
                                        onChange={(e) => setBudgetAllocated(e.target.value)}
                                        placeholder="e.g. 5000000"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date">Planned Start</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={plannedStartDate}
                                        onChange={(e) => setPlannedStartDate(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end-date">Planned Completion</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={plannedCompletionDate}
                                        onChange={(e) => setPlannedCompletionDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Specific Location</Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Junction of Moi Avenue and Nyerere Road"
                                />
                            </div>

                            {officeHolderLocation.county && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    Jurisdiction auto-set: {[officeHolderLocation.county, officeHolderLocation.constituency, officeHolderLocation.ward].filter(Boolean).join(' → ')}
                                </div>
                            )}

                            <Button type="submit" disabled={!title.trim() || isSubmitting} className="w-full">
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                )}
                                Create Project
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

export default AddProjectModal;
