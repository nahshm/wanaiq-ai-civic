import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import { ExpertiseBadge } from './ExpertiseBadge';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface UserExpertise {
    id: string;
    expertiseType: string;
    endorsementCount: number;
    verifiedActionsCount: number;
    isVerified: boolean;
}

interface ExpertiseGridProps {
    userId: string;
    className?: string;
}

// Skeleton loader
const ExpertiseGridSkeleton: React.FC = () => (
    <Card>
        <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                ))}
            </div>
        </CardContent>
    </Card>
);

// Empty state
const ExpertiseGridEmpty: React.FC = () => (
    <Card className="border-dashed">
        <CardContent className="py-8 text-center">
            <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
                No expertise claimed yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                Earn expertise through civic actions
            </p>
        </CardContent>
    </Card>
);

/**
 * ExpertiseGrid - Displays user's civic skills and endorsements
 */
const ExpertiseGridContent: React.FC<ExpertiseGridProps> = ({
    userId,
    className,
}) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isOwnProfile = user?.id === userId;

    // Fetch user expertise
    const {
        data: expertise,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ['user-expertise', userId],
        queryFn: async (): Promise<UserExpertise[]> => {
            const { data, error } = await supabase
                .from('user_expertise')
                .select('*')
                .eq('user_id', userId)
                .order('endorsement_count', { ascending: false });

            if (error) throw error;

            return (data || []).map(e => ({
                id: e.id,
                expertiseType: e.expertise_type,
                endorsementCount: e.endorsement_count,
                verifiedActionsCount: e.verified_actions_count,
                isVerified: e.is_verified,
            }));
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });

    // Check which expertise the current user has already endorsed
    const { data: userEndorsements } = useQuery({
        queryKey: ['user-endorsements', userId, user?.id],
        queryFn: async (): Promise<string[]> => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('expertise_endorsements')
                .select('expertise_id')
                .eq('endorser_id', user.id);

            if (error) throw error;
            return (data || []).map(e => e.expertise_id);
        },
        enabled: !!user?.id && !isOwnProfile,
    });

    // Endorse mutation
    const endorseMutation = useMutation({
        mutationFn: async (expertiseId: string) => {
            const { error } = await supabase
                .from('expertise_endorsements')
                .insert({
                    expertise_id: expertiseId,
                    endorser_id: user?.id,
                });

            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['user-expertise', userId] });
            queryClient.invalidateQueries({ queryKey: ['user-endorsements', userId, user?.id] });
        },
    });

    if (isLoading) {
        return <ExpertiseGridSkeleton />;
    }

    if (isError) {
        return (
            <Card className="border-destructive/50">
                <CardContent className="py-6 text-center">
                    <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">Failed to load expertise</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!expertise || expertise.length === 0) {
        return <ExpertiseGridEmpty />;
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Award className="w-4 h-4" />
                    Verified Expertise
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {expertise.map((exp) => (
                        <ExpertiseBadge
                            key={exp.expertiseType}
                            expertiseType={exp.expertiseType}
                            endorsementCount={exp.endorsementCount}
                            verifiedActionsCount={exp.verifiedActionsCount}
                            isVerified={exp.isVerified}
                            canEndorse={!isOwnProfile && user && !userEndorsements?.includes(exp.id)}
                            onEndorse={() => endorseMutation.mutate(exp.id)}
                            isEndorsing={endorseMutation.isPending}
                            size="md"
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

// Wrap with Error Boundary
export const ExpertiseGrid: React.FC<ExpertiseGridProps> = (props) => (
    <ErrorBoundary componentName="ExpertiseGrid">
        <ExpertiseGridContent {...props} />
    </ErrorBoundary>
);

export default ExpertiseGrid;
