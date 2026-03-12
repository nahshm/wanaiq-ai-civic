import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, PlusCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VerificationPanel from '@/components/verification/VerificationPanel';
import { useVerification } from '@/hooks/useVerification';

interface PromiseItem {
    id: string;
    title: string;
    description: string;
    status: string;
    category: string;
    location: string;
    progress_percentage: number;
    budget_allocated?: number;
    budget_used?: number;
    beneficiaries_count?: number;
    created_at: string;
    official?: {
        id: string;
        name: string;
        position: string;
        photo_url?: string;
    };
}

interface PromisesGridProps {
    levelType: 'COUNTY' | 'CONSTITUENCY' | 'WARD';
    locationValue: string;
}

const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'kept':
            return 'border-emerald-500 text-emerald-600 bg-emerald-500/10';
        case 'ongoing':
        case 'in_progress':
            return 'border-yellow-500 text-yellow-600 bg-yellow-500/10';
        case 'cancelled':
        case 'broken':
        case 'stalled':
            return 'border-red-500 text-red-600 bg-red-500/10';
        default:
            return 'border-muted-foreground text-muted-foreground bg-muted';
    }
};

/** Extracted component to safely call useVerification per-promise */
const PromiseCard: React.FC<{ promise: PromiseItem }> = ({ promise }) => {
    const navigate = useNavigate();
    const { verification, castVote, isCastingVote } = useVerification({
        contentId: promise.id,
        contentType: 'promise',
    });

    return (
        <div
            className="bg-card rounded-lg p-5 border border-border shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/pr/${promise.id}`)}
        >
            <div className="flex-1">
                <div className="flex items-center mb-2 gap-2">
                    {promise.official && (
                        <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {promise.official.name}
                        </span>
                    )}
                    <Badge className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(promise.status)}`}>
                        {promise.status}
                    </Badge>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2">{promise.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{promise.description}</p>

                {/* Progress */}
                {promise.progress_percentage !== undefined && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-bold">{promise.progress_percentage}%</span>
                        </div>
                        <Progress value={promise.progress_percentage} className="h-2" />
                    </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {promise.beneficiaries_count && (
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{promise.beneficiaries_count.toLocaleString()} beneficiaries</span>
                        </div>
                    )}
                    {promise.location && (
                        <div className="text-xs bg-muted px-2 py-1 rounded">
                            {promise.location}
                        </div>
                    )}
                </div>
            </div>

            {/* Verification Panel */}
            <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <VerificationPanel
                    verification={verification}
                    onVote={castVote}
                    isLoading={isCastingVote}
                    isExpanded={true}
                />
            </div>
        </div>
    );
};

const PromisesGrid: React.FC<PromisesGridProps> = ({ levelType, locationValue }) => {
    const [promises, setPromises] = useState<PromiseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPromises();
    }, [levelType, locationValue]);

    const fetchPromises = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('development_promises')
                .select(`
                    *,
                    official:officials!official_id(id, name, position, photo_url)
                `)
                .order('created_at', { ascending: false });

            if (locationValue) {
                query = query.ilike('location', `%${locationValue}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.warn("Error fetching promises with filter:", error);

                const { data: allData, error: backupError } = await supabase
                    .from('development_promises')
                    .select(`
                        *,
                        official:officials!official_id(id, name, position, photo_url)
                    `)
                    .order('created_at', { ascending: false });

                if (backupError) throw backupError;

                const filtered = (allData || []).filter(p =>
                    !locationValue || (p.location && p.location.toLowerCase().includes(locationValue.toLowerCase()))
                );
                setPromises(filtered);
                return;
            }

            setPromises(data || []);
        } catch (error) {
            console.error('Error fetching promises:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border border-border p-5 animate-pulse">
                        <div className="h-24 bg-muted rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center">
                        <FileText className="mr-3 h-8 w-8 text-purple-600" />
                        Promise Tracker
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Track & verify campaign promises for {locationValue}
                    </p>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Log Promise
                </Button>
            </div>

            {promises.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-semibold mb-2">No Promises Tracked</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Be the first to log a campaign promise for your leaders in {locationValue}.
                    </p>
                    <Button>Log First Promise</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {promises.map((promise) => (
                        <PromiseCard key={promise.id} promise={promise} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PromisesGrid;
