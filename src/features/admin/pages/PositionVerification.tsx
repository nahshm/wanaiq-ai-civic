import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

// Simplified interface for claim requests
interface ClaimRequest {
    id: string;
    user_id: string;
    position_id: string;
    verification_status: string;
    verification_method: string;
    claimed_at: string;
    proof_documents?: {
        document_url?: string;
    };
    position: {
        title: string;
        country_code: string;
        jurisdiction_name: string;
    };
    user: {
        id: string;
        display_name: string;
        email?: string;
    };
}

export function PositionVerification() {
    const { user, profile } = useAuth();
    const [pendingClaims, setPendingClaims] = useState<ClaimRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    // Check admin access via user_roles table (secure method)
    useEffect(() => {
        const checkAdminAccess = async () => {
            if (!user) return;

            // Use raw query to check for admin/super_admin roles
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id);

            if (!error && data && data.some(r => r.role === 'admin' || r.role === 'super_admin')) {
                setIsSuperAdmin(true);
            }
        };

        checkAdminAccess();
    }, [user]);

    useEffect(() => {
        if (!isSuperAdmin) return;
        fetchClaims();
    }, [isSuperAdmin]);

    const fetchClaims = async () => {
        setIsLoading(true);
        // Fetch pending claims with position info
        const { data, error } = await supabase
            .from('office_holders')
            .select(`
                id,
                user_id,
                position_id,
                verification_status,
                verification_method,
                claimed_at,
                proof_documents,
                position:government_positions(title, country_code, jurisdiction_name)
            `)
            .eq('verification_status', 'pending')
            .order('claimed_at', { ascending: false });

        if (error) {
            console.error('Fetch claims error:', error);
            toast.error('Failed to load claims');
            setIsLoading(false);
            return;
        }

        // Fetch profiles separately
        let claimsWithProfiles = data || [];
        if (claimsWithProfiles.length > 0) {
            const userIds = claimsWithProfiles.map(c => c.user_id).filter(Boolean);
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, display_name')
                    .in('id', userIds);

                const profilesMap = new Map((profiles || []).map(p => [p.id, p]));
                claimsWithProfiles = claimsWithProfiles.map(c => ({
                    ...c,
                    user: profilesMap.get(c.user_id) || null
                }));
            }
        }

        setPendingClaims(claimsWithProfiles as unknown as ClaimRequest[]);
        setIsLoading(false);
    };

    const handleVerdict = async (claimId: string, verdict: 'verified' | 'rejected') => {
        const { error } = await supabase
            .from('office_holders')
            .update({
                verification_status: verdict,
                verified_by: user?.id,
                verified_at: new Date().toISOString(),
                is_active: verdict === 'verified', // Only active if verified
            })
            .eq('id', claimId);

        if (error) {
            toast.error('Failed to update claim');
        } else {
            toast.success(`Claim ${verdict} successfully`);
            setPendingClaims(prev => prev.filter(c => c.id !== claimId));
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="p-8 text-center text-red-500">
                Access Denied. Admins only.
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Admin Verification Dashboard</h1>
                <Button onClick={fetchClaims} variant="outline" size="sm">Refresh</Button>
            </div>

            <Tabs defaultValue="claims">
                <TabsList>
                    <TabsTrigger value="claims">
                        Position Claims
                        {pendingClaims.length > 0 && <Badge variant="secondary" className="ml-2">{pendingClaims.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="templates">Governance Templates</TabsTrigger>
                </TabsList>

                {/* CLAIM VERIFICATION */}
                <TabsContent value="claims" className="space-y-4">
                    {isLoading ? (
                        <p>Loading claims...</p>
                    ) : pendingClaims.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No pending claims to review.
                            </CardContent>
                        </Card>
                    ) : (
                        pendingClaims.map((claim) => (
                            <Card key={claim.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between">
                                        <div>
                                            <CardTitle>{claim.position?.title || 'Unknown Position'}</CardTitle>
                                            <CardDescription>
                                                {claim.position?.jurisdiction_name || 'Unknown'} • Applicant: <span className="font-semibold text-foreground">{claim.user?.display_name || 'Unknown User'}</span>
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="h-6">
                                            {claim.position?.country_code || 'N/A'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Method:</span> {claim.verification_method || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Date:</span> {claim.claimed_at ? new Date(claim.claimed_at).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Proof:</span>
                                            {claim.proof_documents?.document_url ? (
                                                <a href={claim.proof_documents.document_url} target="_blank" rel="noreferrer" className="text-blue-600 underline ml-2 hover:text-blue-800">
                                                    View Document
                                                </a>
                                            ) : (
                                                <span className="ml-2 italic text-muted-foreground">No URL provided</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                        <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleVerdict(claim.id, 'rejected')}>
                                            <X className="w-4 h-4 mr-2" /> Reject
                                        </Button>
                                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleVerdict(claim.id, 'verified')}>
                                            <Check className="w-4 h-4 mr-2" /> Approve & Verify
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* TEMPLATE VERIFICATION (Placeholder for now) */}
                <TabsContent value="templates">
                    <Card>
                        <CardHeader>
                            <CardTitle>Governance Templates Review</CardTitle>
                            <CardDescription>Review new country structures submitted by the community.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                            No pending templates. (Feature coming pending GovernanceBuilder)
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}