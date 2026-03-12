import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectVerificationButtonProps {
    projectId: string;
}

export const ProjectVerificationButton: React.FC<ProjectVerificationButtonProps> = ({ projectId }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Check if user already verified
    const { data: userVerification } = useQuery({
        queryKey: ['user-verification', projectId, user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data } = await (supabase.from as any)('project_verifications')
                .select('id')
                .eq('project_id', projectId)
                .eq('user_id', user.id)
                .maybeSingle();
            return data;
        },
        enabled: !!user
    });

    // Get total verification count
    const { data: verificationData } = useQuery({
        queryKey: ['verification-count', projectId],
        queryFn: async () => {
            const { count } = await (supabase.from as any)('project_verifications')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', projectId);
            return { count: count || 0 };
        }
    });

    const verifyMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Must be logged in');

            const { error } = await (supabase.from as any)('project_verifications')
                .insert({ project_id: projectId, user_id: user.id });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-verification'] });
            queryClient.invalidateQueries({ queryKey: ['verification-count'] });
            toast({
                title: 'Project Verified!',
                description: 'Thank you for verifying this project.'
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Verification Failed',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    const unverifyMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Must be logged in');

            const { error } = await (supabase.from as any)('project_verifications')
                .delete()
                .eq('project_id', projectId)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-verification'] });
            queryClient.invalidateQueries({ queryKey: ['verification-count'] });
            toast({
                title: 'Verification Removed',
                description: 'Your verification has been removed.'
            });
        }
    });

    const count = verificationData?.count || 0;
    const hasVerified = !!userVerification;
    const isCommunityVerified = count >= 10; // Threshold for community verification

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Button
                    onClick={() => hasVerified ? unverifyMutation.mutate() : verifyMutation.mutate()}
                    disabled={!user || verifyMutation.isPending || unverifyMutation.isPending}
                    variant={hasVerified ? 'secondary' : 'default'}
                    size="sm"
                >
                    {(verifyMutation.isPending || unverifyMutation.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {hasVerified ? 'Verified' : 'Verify This Project'}
                </Button>

                {isCommunityVerified && (
                    <Badge variant="default" className="bg-green-600">
                        ✓ Community Verified
                    </Badge>
                )}
            </div>

            <p className="text-sm text-muted-foreground">
                {count === 0 ? 'Be the first to verify' :
                    count === 1 ? 'Verified by 1 citizen' :
                        `Verified by ${count} citizens`}
            </p>
        </div>
    );
};
