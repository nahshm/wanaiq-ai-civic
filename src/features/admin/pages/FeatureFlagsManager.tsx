import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, AlertTriangle } from 'lucide-react';

interface FeatureFlag {
    id: string;
    feature_key: string;
    feature_name: string;
    description: string;
    is_enabled: boolean;
    category: string;
    updated_at: string;
}

export const FeatureFlagsManager: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch all feature flags
    const { data: flags, isLoading } = useQuery({
        queryKey: ['all-feature-flags'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('feature_flags')
                .select('*')
                .order('category', { ascending: true })
                .order('feature_name', { ascending: true });

            if (error) throw error;
            return data as FeatureFlag[];
        }
    });

    // Toggle feature flag
    const toggleMutation = useMutation({
        mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
            const { error } = await supabase
                .from('feature_flags')
                .update({
                    is_enabled: enabled,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-feature-flags'] });
            toast({
                title: 'Feature Updated',
                description: 'Feature flag has been updated successfully.'
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Update Failed',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    // Group flags by category
    const groupedFlags = flags?.reduce((acc, flag) => {
        if (!acc[flag.category]) {
            acc[flag.category] = [];
        }
        acc[flag.category].push(flag);
        return acc;
    }, {} as Record<string, FeatureFlag[]>);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </CardHeader>
                    <CardContent>
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-20 mb-4" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Settings className="w-8 h-8" />
                    Feature Flags
                </h1>
                <p className="text-muted-foreground mt-2">
                    Control platform features globally. Changes take effect immediately.
                </p>
            </div>

            {/* Warning Alert */}
            <Card className="mb-6 border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-orange-900 dark:text-orange-100">
                                Super Admin Access
                            </p>
                            <p className="text-sm text-orange-800 dark:text-orange-200">
                                These settings affect all users platform-wide. Toggle features carefully.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Feature Flags by Category */}
            {groupedFlags && Object.entries(groupedFlags).map(([category, categoryFlags]) => (
                <Card key={category} className="mb-6">
                    <CardHeader>
                        <CardTitle className="capitalize">{category} Features</CardTitle>
                        <CardDescription>
                            {categoryFlags.length} feature{categoryFlags.length !== 1 ? 's' : ''} in this category
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {categoryFlags.map((flag) => (
                            <div
                                key={flag.id}
                                className="flex items-start justify-between py-3 border-b last:border-0"
                            >
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold">{flag.feature_name}</h3>
                                        <Badge
                                            variant={flag.is_enabled ? 'default' : 'secondary'}
                                            className={flag.is_enabled ? 'bg-green-600' : ''}
                                        >
                                            {flag.is_enabled ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {flag.description}
                                    </p>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {flag.feature_key}
                                    </code>
                                </div>
                                <Switch
                                    checked={flag.is_enabled}
                                    onCheckedChange={(checked) =>
                                        toggleMutation.mutate({ id: flag.id, enabled: checked })
                                    }
                                    disabled={toggleMutation.isPending}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            {(!flags || flags.length === 0) && (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No feature flags configured yet.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FeatureFlagsManager;
