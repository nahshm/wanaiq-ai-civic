import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { logProjectSubmitted } from '@/lib/activityLogger';
import { ReceiptToast } from '@/components/ui/ReceiptToast';
import { ArrowLeft, Upload, X, FileText, Image as ImageIcon, Film, AlertCircle, Loader2, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PROJECT_CATEGORIES_2026, PROJECT_LEVELS, PROJECT_STATUSES, PROJECT_PRIORITIES } from '@/constants/projectConstants';
import { useOfficialsByLocation, useInstitutionsByJurisdiction, useUserProfile, useCommunityLocation } from '@/hooks/useProjectData';

type ResponsibleType = 'official' | 'institution';
type ProjectLevel = 'national' | 'county' | 'constituency' | 'ward';

interface CollaboratingOfficial {
    id: string;
    name: string;
}

interface CollaboratingInstitution {
    id: string;
    name: string;
    acronym: string | null;
}

const SubmitProject = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const authModal = useAuthModal();
    const [searchParams] = useSearchParams();
    const communityId = searchParams.get('community');

    const [loading, setLoading] = useState(false);
    const [primaryResponsibleType, setPrimaryResponsibleType] = useState<ResponsibleType>('official');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        status: 'ongoing',
        priority: 'medium',
        budget_allocated: '',
        funding_source: '',
        county: '',
        constituency: '',
        ward: '',
        planned_start_date: '',
        planned_completion_date: '',
        project_level: 'county' as ProjectLevel,
        primary_official_id: '',
        primary_institution_id: ''
    });

    // Collaborators state
    const [collaboratingOfficials, setCollaboratingOfficials] = useState<CollaboratingOfficial[]>([]);
    const [collaboratingInstitutions, setCollaboratingInstitutions] = useState<CollaboratingInstitution[]>([]);

    // Media State
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [documentFiles, setDocumentFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

    // Geography data
    const [counties, setCounties] = useState<{ id: string, name: string }[]>([]);
    const [constituencies, setConstituencies] = useState<{ id: string, name: string }[]>([]);
    const [wards, setWards] = useState<{ id: string, name: string }[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Fetch user profile for auto-fill
    const { data: userProfile } = useUserProfile(user?.id);

    // Fetch community location for auto-fill
    const { data: communityLocation } = useCommunityLocation(communityId || undefined);

    // Debug: Log data when it changes
    useEffect(() => {
        console.log('=== SUBMIT PROJECT DEBUG ===');
        console.log('Community ID:', communityId);
        console.log('Community Location Data:', communityLocation);
        console.log('User Profile Data:', userProfile);
        console.log('Current Form Data:', formData);
        console.log('Is Initialized:', isInitialized);
        console.log('===========================');
    }, [communityLocation, userProfile, isInitialized, formData, communityId]);

    // Fetch officials based on location
    const { data: officials = [], isLoading: officialsLoading } = useOfficialsByLocation(
        formData.project_level,
        formData.county,
        formData.constituency,
        formData.ward
    );

    // Fetch institutions based on jurisdiction
    const { data: institutions = [], isLoading: institutionsLoading } = useInstitutionsByJurisdiction(
        formData.project_level,
        formData.county
    );

    // Auto-fill location and scope based on community or user profile
    useEffect(() => {
        if (isInitialized) return; // Only autofill once

        if (communityLocation) {
            console.log('Autofilling from community:', communityLocation);

            setFormData(prev => {
                const updates = { ...prev };

                // Set project scope and locations based on community type
                if (communityLocation.location_type === 'county') {
                    updates.project_level = 'county';
                    updates.county = communityLocation.county || '';
                } else if (communityLocation.location_type === 'constituency') {
                    updates.project_level = 'constituency';
                    updates.county = communityLocation.county || '';
                    updates.constituency = communityLocation.constituency || '';
                } else if (communityLocation.location_type === 'ward') {
                    updates.project_level = 'ward';
                    updates.county = communityLocation.county || '';
                    updates.constituency = communityLocation.constituency || '';
                    updates.ward = communityLocation.ward || '';
                }

                return updates;
            });
            setIsInitialized(true);
        } else if (userProfile?.county && !isInitialized) {
            console.log('Autofilling from user profile:', userProfile);

            setFormData(prev => ({
                ...prev,
                county: userProfile.county || '',
                constituency: userProfile.constituency || '',
                ward: userProfile.ward || '',
                project_level: userProfile.ward ? 'ward' : userProfile.constituency ? 'constituency' : 'county'
            }));
            setIsInitialized(true);
        }
    }, [communityLocation, userProfile, isInitialized]);

    // Fetch counties
    useEffect(() => {
        fetchCounties();
    }, []);

    // Fetch constituencies when county changes
    useEffect(() => {
        if (formData.county) {
            fetchConstituencies(formData.county);
        } else {
            setConstituencies([]);
            setWards([]);
        }
    }, [formData.county]);

    // Fetch wards when constituency changes
    useEffect(() => {
        if (formData.constituency) {
            fetchWards(formData.constituency);
        } else {
            setWards([]);
        }
    }, [formData.constituency]);

    const fetchCounties = async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await supabase.from('administrative_divisions' as any)
            .select('id, name')
            .eq('country_code', 'KE')
            .eq('governance_level', 'county')
            .order('name');
        if (data) setCounties(data as unknown as { id: string; name: string }[]);
    };

    const fetchConstituencies = async (county: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: countyData } = await supabase.from('administrative_divisions' as any)
            .select('id')
            .eq('country_code', 'KE')
            .eq('governance_level', 'county')
            .eq('name', county)
            .single();

        if (!countyData) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await supabase.from('administrative_divisions' as any)
            .select('id, name')
            .eq('country_code', 'KE')
            .eq('governance_level', 'constituency')
            .eq('parent_id', (countyData as any).id)
            .order('name');
        if (data) setConstituencies(data as unknown as { id: string; name: string }[]);
    };

    const fetchWards = async (constituency: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: constituencyData } = await supabase.from('administrative_divisions' as any)
            .select('id')
            .eq('country_code', 'KE')
            .eq('governance_level', 'constituency')
            .eq('name', constituency)
            .single();

        if (!constituencyData) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await supabase.from('administrative_divisions' as any)
            .select('id, name')
            .eq('country_code', 'KE')
            .eq('governance_level', 'ward')
            .eq('parent_id', (constituencyData as any).id)
            .order('name');
        if (data) setWards(data as unknown as { id: string; name: string }[]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Add collaborating official
    const addCollaboratingOfficial = (officialId: string) => {
        const official = officials.find(o => o.id === officialId);
        if (official && !collaboratingOfficials.find(o => o.id === officialId)) {
            setCollaboratingOfficials(prev => [...prev, { id: official.id, name: official.name }]);
        }
    };

    // Remove collaborating official
    const removeCollaboratingOfficial = (officialId: string) => {
        setCollaboratingOfficials(prev => prev.filter(o => o.id !== officialId));
    };

    // Add collaborating institution
    const addCollaboratingInstitution = (institutionId: string) => {
        const institution = institutions.find(i => i.id === institutionId);
        if (institution && !collaboratingInstitutions.find(i => i.id === institutionId)) {
            setCollaboratingInstitutions(prev => [...prev, {
                id: institution.id,
                name: institution.name,
                acronym: institution.acronym
            }]);
        }
    };

    // Remove collaborating institution
    const removeCollaboratingInstitution = (institutionId: string) => {
        setCollaboratingInstitutions(prev => prev.filter(i => i.id !== institutionId));
    };

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setMediaFiles(prev => [...prev, ...files]);

            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setMediaPreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setDocumentFiles(prev => [...prev, ...files]);
        }
    };

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeDocument = (index: number) => {
        setDocumentFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async (files: File[], bucket: 'project-media' | 'project-documents') => {
        const urls: string[] = [];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user?.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                console.error(`Error uploading ${file.name}:`, uploadError);
                continue;
            }

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            urls.push(data.publicUrl);
        }
        return urls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            authModal.open('login');
            return;
        }

        setLoading(true);
        try {
            const mediaUrls = await uploadFiles(mediaFiles, 'project-media');
            const docUrls = await uploadFiles(documentFiles, 'project-documents');

            // Insert main project
            const { data: project, error: projectError } = await supabase
                .from('government_projects')
                .insert({
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    status: formData.status,
                    priority: formData.priority,
                    budget_allocated: formData.budget_allocated ? parseFloat(formData.budget_allocated) : null,
                    funding_source: formData.funding_source,
                    project_level: formData.project_level,
                    county: formData.project_level !== 'national' ? formData.county : null,
                    constituency: (formData.project_level === 'constituency' || formData.project_level === 'ward') ? formData.constituency : null,
                    ward: formData.project_level === 'ward' ? formData.ward : null,
                    primary_responsible_type: primaryResponsibleType,
                    primary_official_id: primaryResponsibleType === 'official' ? formData.primary_official_id || null : null,
                    primary_institution_id: primaryResponsibleType === 'institution' ? formData.primary_institution_id || null : null,
                    planned_start_date: formData.planned_start_date || null,
                    planned_completion_date: formData.planned_completion_date || null,
                    created_by: user.id,
                    is_verified: false,
                    media_urls: mediaUrls,
                    documents_urls: docUrls,
                    progress_percentage: 0
                })
                .select()
                .single();

            if (projectError) throw projectError;

            // Insert collaborating officials
            if (collaboratingOfficials.length > 0) {
                const { error: officialsError } = await supabase
                    .from('project_collaborating_officials')
                    .insert(
                        collaboratingOfficials.map(official => ({
                            project_id: project.id,
                            official_id: official.id
                        }))
                    );

                if (officialsError) console.error('Error adding collaborating officials:', officialsError);
            }

            // Insert collaborating institutions
            if (collaboratingInstitutions.length > 0) {
                const { error: institutionsError } = await supabase
                    .from('project_collaborating_institutions')
                    .insert(
                        collaboratingInstitutions.map(institution => ({
                            project_id: project.id,
                            institution_id: institution.id
                        }))
                    );

                if (institutionsError) console.error('Error adding collaborating institutions:', institutionsError);
            }

            // Log activity
            try {
                // Ensure we only pass expected properties to the logger
                await logProjectSubmitted(user.id, project.id, {
                    name: project.title,
                    location: project.location || project.county || '',
                    county: project.county
                    // constituency is intentionally omitted if not supported
                });
            } catch (logError) {
                console.error('Failed to log project activity:', logError);
            }

            // Show Receipt
            toast({
                description: (
                    <ReceiptToast
                        title="Project Submitted"
                        trackingId={project.id}
                        nextSteps={['Community Verification', 'Official Review', 'Implementation']}
                    />
                ),
                duration: 5000,
            });

            navigate(`/projects/${project.id}`);

        } catch (error: unknown) {
            const err = error as Error;
            console.error('Error submitting project:', err);
            toast({
                title: 'Submission Failed',
                description: err.message || 'Failed to submit project',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const locationRequired = formData.project_level !== 'national';

    // Filter out already selected collaborators and primary from available options
    const availableOfficials = officials.filter(o =>
        o.id !== formData.primary_official_id &&
        !collaboratingOfficials.find(co => co.id === o.id)
    );

    const availableInstitutions = institutions.filter(i =>
        i.id !== formData.primary_institution_id &&
        !collaboratingInstitutions.find(ci => ci.id === i.id)
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Submit a Government Project</CardTitle>
                    <CardDescription>
                        Report a government project in your area. Provide as much evidence as possible.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="title">Project Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Construction of New Market in Westlands"
                                    required
                                />
                            </div>

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe the project details, scope, and current status..."
                                    required
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select value={formData.category} onValueChange={(val) => handleSelectChange('category', val)} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROJECT_CATEGORIES_2026.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.icon} {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="projectScope">Project Scope *</Label>
                                    <Select
                                        value={formData.project_level}
                                        onValueChange={(val: ProjectLevel) => handleSelectChange('project_level', val)}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROJECT_LEVELS.map(level => (
                                                <SelectItem key={level.value} value={level.value}>
                                                    {level.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Location Section - Conditional */}
                        {locationRequired && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Location helps filter relevant officials and institutions</span>
                                </div>

                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="county">County *</Label>
                                    <Select
                                        value={formData.county}
                                        onValueChange={(val) => {
                                            handleSelectChange('county', val);
                                            setFormData(prev => ({ ...prev, constituency: '', ward: '' }));
                                        }}
                                        required={locationRequired}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select county" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {counties.map(c => (
                                                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(formData.project_level === 'constituency' || formData.project_level === 'ward') && (
                                    <div className="grid w-full gap-1.5">
                                        <Label htmlFor="constituency">Constituency *</Label>
                                        <Select
                                            value={formData.constituency}
                                            onValueChange={(val) => {
                                                handleSelectChange('constituency', val);
                                                setFormData(prev => ({ ...prev, ward: '' }));
                                            }}
                                            disabled={!formData.county}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select constituency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {constituencies.map(c => (
                                                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {formData.project_level === 'ward' && (
                                    <div className="grid w-full gap-1.5">
                                        <Label htmlFor="ward">Ward *</Label>
                                        <Select
                                            value={formData.ward}
                                            onValueChange={(val) => handleSelectChange('ward', val)}
                                            disabled={!formData.constituency}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select ward" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {wards.map(w => (
                                                    <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Primary Responsible Entity Section */}
                        <div className="space-y-4 border-t pt-4">
                            <div>
                                <Label className="text-base font-semibold">Primary Responsible Entity</Label>
                                <p className="text-sm text-muted-foreground mb-3">Who is primarily accountable for this project?</p>
                                <RadioGroup value={primaryResponsibleType} onValueChange={(val: ResponsibleType) => setPrimaryResponsibleType(val)} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="official" id="primary-official" />
                                        <Label htmlFor="primary-official" className="font-normal cursor-pointer">Individual Official</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="institution" id="primary-institution" />
                                        <Label htmlFor="primary-institution" className="font-normal cursor-pointer">Government Institution</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {primaryResponsibleType === 'official' ? (
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="primary-official-select">Select Primary Official</Label>
                                    {officialsLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading officials...
                                        </div>
                                    ) : (
                                        <Select
                                            value={formData.primary_official_id}
                                            onValueChange={(val) => handleSelectChange('primary_official_id', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={officials.length === 0 ? "No officials found" : "Select primary official"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {officials.map(off => (
                                                    <SelectItem key={off.id} value={off.id}>
                                                        {off.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            ) : (
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="primary-institution-select">Select Primary Institution</Label>
                                    {institutionsLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading institutions...
                                        </div>
                                    ) : (
                                        <Select
                                            value={formData.primary_institution_id}
                                            onValueChange={(val) => handleSelectChange('primary_institution_id', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={institutions.length === 0 ? "No institutions found" : "Select primary institution"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {institutions.map(inst => (
                                                    <SelectItem key={inst.id} value={inst.id}>
                                                        {inst.name} {inst.acronym && `(${inst.acronym})`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Collaborators Section */}
                        <div className="space-y-4 border-t pt-4">
                            <div>
                                <Label className="text-base font-semibold">Collaborating Entities (Optional)</Label>
                                <p className="text-sm text-muted-foreground">Add other officials or institutions involved in this project</p>
                            </div>

                            {/* Collaborating Officials */}
                            <div className="space-y-2">
                                <Label>Collaborating Officials</Label>
                                {collaboratingOfficials.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {collaboratingOfficials.map(official => (
                                            <Badge key={official.id} variant="secondary" className="gap-1">
                                                {official.name}
                                                <X
                                                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                                                    onClick={() => removeCollaboratingOfficial(official.id)}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <Select onValueChange={addCollaboratingOfficial} disabled={officialsLoading || availableOfficials.length === 0}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={availableOfficials.length === 0 ? "No more officials available" : "Add an official"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableOfficials.map(off => (
                                            <SelectItem key={off.id} value={off.id}>
                                                <div className="flex items-center gap-2">
                                                    <Plus className="w-3 h-3" />
                                                    {off.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Collaborating Institutions */}
                            <div className="space-y-2">
                                <Label>Collaborating Institutions</Label>
                                {collaboratingInstitutions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {collaboratingInstitutions.map(institution => (
                                            <Badge key={institution.id} variant="secondary" className="gap-1">
                                                {institution.name} {institution.acronym && `(${institution.acronym})`}
                                                <X
                                                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                                                    onClick={() => removeCollaboratingInstitution(institution.id)}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <Select onValueChange={addCollaboratingInstitution} disabled={institutionsLoading || availableInstitutions.length === 0}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={availableInstitutions.length === 0 ? "No more institutions available" : "Add an institution"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableInstitutions.map(inst => (
                                            <SelectItem key={inst.id} value={inst.id}>
                                                <div className="flex items-center gap-2">
                                                    <Plus className="w-3 h-3" />
                                                    {inst.name} {inst.acronym && `(${inst.acronym})`}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Project Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROJECT_STATUSES.map(status => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={formData.priority} onValueChange={(val) => handleSelectChange('priority', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROJECT_PRIORITIES.map(priority => (
                                            <SelectItem key={priority.value} value={priority.value}>
                                                {priority.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="budget">Budget Allocated (KES)</Label>
                                <Input
                                    id="budget"
                                    name="budget_allocated"
                                    type="number"
                                    value={formData.budget_allocated}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 5000000"
                                />
                            </div>

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="funding">Funding Source</Label>
                                <Input
                                    id="funding"
                                    name="funding_source"
                                    value={formData.funding_source}
                                    onChange={handleInputChange}
                                    placeholder="e.g., County Budget 2026"
                                />
                            </div>

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="start_date">Planned Start Date</Label>
                                <Input
                                    id="start_date"
                                    name="planned_start_date"
                                    type="date"
                                    value={formData.planned_start_date}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="completion_date">Planned Completion</Label>
                                <Input
                                    id="completion_date"
                                    name="planned_completion_date"
                                    type="date"
                                    value={formData.planned_completion_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Media Upload */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="media">Photos/Videos</Label>
                                <Input
                                    id="media"
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleMediaChange}
                                    className="cursor-pointer"
                                />
                                {mediaPreviews.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {mediaPreviews.map((preview, idx) => (
                                            <div key={idx} className="relative">
                                                <img src={preview} alt={`Preview ${idx}`} className="w-full h-24 object-cover rounded" />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-1 right-1 h-6 w-6 p-0"
                                                    onClick={() => removeMedia(idx)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="documents">Documents (PDFs, etc.)</Label>
                                <Input
                                    id="documents"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    multiple
                                    onChange={handleDocumentChange}
                                    className="cursor-pointer"
                                />
                                {documentFiles.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        {documentFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="text-sm">{file.name}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeDocument(idx)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Project
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div >
    );
};

export default SubmitProject;
