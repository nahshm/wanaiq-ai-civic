import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Upload, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Props passed from LeadersGrid when user clicks "Claim This Office"
interface ClaimPositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    position: {
        id: string;
        title: string;
        governanceLevel: string;
        jurisdictionName: string;
        countryCode: string;
    } | null;
    communityId?: string; // The community the user is viewing
}

// Simplified schema - only term dates and verification needed
const claimSchema = z.object({
    term_start_date: z.string().min(1, "Enter term start date"),
    term_end_date: z.string().min(1, "Enter term end date"),
    verification_method: z.enum(['document_upload', 'email_verification', 'official_link']),
    proof_document_url: z.string().optional(),
    official_email: z.string().email().optional().or(z.literal('')),
});

type ClaimFormData = z.infer<typeof claimSchema>;

export function ClaimPositionModal({ isOpen, onClose, position, communityId }: ClaimPositionModalProps) {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [membershipVerified, setMembershipVerified] = useState<boolean | null>(null);
    const [existingClaim, setExistingClaim] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const form = useForm<ClaimFormData>({
        resolver: zodResolver(claimSchema),
        defaultValues: {
            verification_method: 'document_upload',
            term_start_date: '',
            term_end_date: '',
        },
    });

    // Handle file upload to Supabase storage
    const handleFileUpload = async (file: File) => {
        if (!user) {
            authModal.open('login');
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${position?.id}-${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('position-claims')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                // If bucket doesn't exist, try the default bucket
                if (error.message.includes('The resource was not found')) {
                    toast.error('Storage bucket not configured. Please add URL manually.');
                    return;
                }
                throw error;
            }

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('position-claims')
                .getPublicUrl(fileName);

            setUploadedUrl(publicUrl);
            form.setValue('proof_document_url', publicUrl);
            toast.success('Document uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload file. You can enter a URL instead.');
        } finally {
            setIsUploading(false);
        }
    };

    // Define verification functions with useCallback to stabilize references
    const verifyMembership = useCallback(async () => {
        if (!user || !communityId) {
            setMembershipVerified(false);
            return;
        }

        const { data } = await supabase
            .from('community_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('community_id', communityId)
            .maybeSingle();

        setMembershipVerified(!!data);
    }, [user, communityId]);

    const checkExistingClaim = useCallback(async () => {
        if (!position) return;

        const { data } = await supabase
            .from('office_holders')
            .select('id')
            .eq('position_id', position.id)
            .eq('is_active', true)
            .maybeSingle();

        setExistingClaim(!!data);
    }, [position]);

    // Verify community membership when modal opens
    useEffect(() => {
        if (isOpen && user && communityId) {
            verifyMembership();
            checkExistingClaim();
        }
    }, [isOpen, user, communityId, position, verifyMembership, checkExistingClaim]);

    const onSubmit = async (data: ClaimFormData) => {
        if (!user || !position) {
            toast.error('Missing required information');
            return;
        }

        if (!membershipVerified) {
            toast.error('You must be a member of this community to claim this position');
            return;
        }

        if (existingClaim) {
            toast.error('This position is already claimed by an active official');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: claimData, error } = await supabase
                .from('office_holders')
                .insert({
                    position_id: position.id,
                    user_id: user.id,
                    term_start: data.term_start_date,
                    term_end: data.term_end_date,
                    verification_status: 'pending',
                    verification_method: data.verification_method,
                    proof_documents: {
                        document_url: data.proof_document_url,
                        official_email: data.official_email,
                        claimed_at: new Date().toISOString(),
                    },
                    is_active: true,
                })
                .select('id')
                .single();

            if (error) {
                console.error(error);
                toast.error('Failed to submit claim: ' + error.message);
                return;
            }

            toast.success('Position claim submitted for verification!');
            onClose();

            // Redirect to the newly created office page
            if (claimData?.id) {
                window.location.href = `/g/${claimData.id}`;
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!position) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Claim Government Position
                    </DialogTitle>
                    <DialogDescription>
                        Submit your claim for verification to represent your constituents.
                    </DialogDescription>
                </DialogHeader>

                {/* Position Summary (Pre-filled, Read-only) */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Position</span>
                        <Badge variant="secondary">{position.governanceLevel}</Badge>
                    </div>
                    <h3 className="font-semibold text-lg">{position.title}</h3>
                    <p className="text-sm text-muted-foreground">{position.jurisdictionName}</p>
                </div>

                {/* Membership Status */}
                {membershipVerified === false && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-red-900">Community Membership Required</p>
                            <p className="text-xs text-red-700">You must be a member of this community to claim this position.</p>
                        </div>
                    </div>
                )}

                {existingClaim && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-yellow-900">Position Already Claimed</p>
                            <p className="text-xs text-yellow-700">This position has an active office holder.</p>
                        </div>
                    </div>
                )}

                {membershipVerified && !existingClaim && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Term Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="term_start_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> Term Start
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="term_end_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Term End</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Verification Method */}
                            <FormField
                                control={form.control}
                                name="verification_method"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Verification Method</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="document_upload">Upload Official Document</SelectItem>
                                                <SelectItem value="email_verification">Official Email Verification</SelectItem>
                                                <SelectItem value="official_link">Link to Official Profile</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Document Upload */}
                            {form.watch('verification_method') === 'document_upload' && (
                                <FormField
                                    control={form.control}
                                    name="proof_document_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1">
                                                <Upload className="h-3 w-3" /> Proof Document
                                            </FormLabel>

                                            {/* File Upload Zone */}
                                            <div className="space-y-2">
                                                {!uploadedUrl ? (
                                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                            className="hidden"
                                                            id="proof-file-upload"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setUploadedFile(file);
                                                                    handleFileUpload(file);
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor="proof-file-upload"
                                                            className="flex flex-col items-center cursor-pointer"
                                                        >
                                                            <Upload className={`h-8 w-8 mb-2 ${isUploading ? 'animate-pulse text-primary' : 'text-muted-foreground'}`} />
                                                            {isUploading ? (
                                                                <span className="text-sm text-primary">Uploading...</span>
                                                            ) : (
                                                                <>
                                                                    <span className="text-sm font-medium">Click to upload</span>
                                                                    <span className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC (max 5MB)</span>
                                                                </>
                                                            )}
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-green-900 truncate">{uploadedFile?.name || 'Document'}</p>
                                                            <p className="text-xs text-green-700">Uploaded successfully</p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setUploadedUrl(null);
                                                                setUploadedFile(null);
                                                                form.setValue('proof_document_url', '');
                                                            }}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Fallback URL Input */}
                                                <div className="text-center text-xs text-muted-foreground">
                                                    — or enter URL directly —
                                                </div>
                                                <FormControl>
                                                    <Input
                                                        placeholder="https://drive.google.com/..."
                                                        {...field}
                                                        disabled={!!uploadedUrl}
                                                    />
                                                </FormControl>
                                            </div>

                                            <FormDescription>
                                                Upload appointment letter, election certificate, or gazette notice.
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
                            )}

                            {form.watch('verification_method') === 'email_verification' && (
                                <FormField
                                    control={form.control}
                                    name="official_email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Official Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="name@government.go.ke" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Submit */}
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}

                {/* Success indicator when membership verified */}
                {membershipVerified && !existingClaim && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Community membership verified</span>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
