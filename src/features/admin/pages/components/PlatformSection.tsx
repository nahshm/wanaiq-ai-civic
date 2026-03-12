import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Activity, BarChart3, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PerformanceMonitoringTab from '../../components/PerformanceMonitoringTab';

export default function PlatformSection() {
  return (
    <Tabs defaultValue="flags" className="space-y-6">
      <TabsList>
        <TabsTrigger value="flags" className="gap-2"><Settings className="w-4 h-4" />Feature Flags</TabsTrigger>
        <TabsTrigger value="performance" className="gap-2"><Activity className="w-4 h-4" />Performance</TabsTrigger>
        <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="w-4 h-4" />Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="flags"><FeatureFlagsSubTab /></TabsContent>
      <TabsContent value="performance"><PerformanceMonitoringTab /></TabsContent>
      <TabsContent value="analytics"><AnalyticsSubTab /></TabsContent>
    </Tabs>
  );
}

function FeatureFlagsSubTab() {
  const { data: flags, isLoading, refetch } = useQuery({
    queryKey: ['admin-feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('feature_flags')
        .select('*')
        .order('category', { ascending: true })
        .order('feature_name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const toggleFlag = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from('feature_flags')
      .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('Failed to update');
    else { toast.success('Feature flag updated'); refetch(); }
  };

  const grouped = (flags || []).reduce((acc, flag) => {
    if (!acc[flag.category]) acc[flag.category] = [];
    acc[flag.category].push(flag);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Platform-Wide Feature Control</p>
              <p className="text-xs text-muted-foreground">Changes take effect immediately for all users.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> : (
        Object.entries(grouped).map(([category, categoryFlags]) => (
          <Card key={category}>
            <CardHeader><CardTitle className="capitalize text-base">{category} Features</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {categoryFlags.map((flag: any) => (
                <div key={flag.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{flag.feature_name}</div>
                    <p className="text-xs text-muted-foreground">{flag.description}</p>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">{flag.feature_key}</code>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={flag.is_enabled ? 'default' : 'secondary'} className="text-xs">
                      {flag.is_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={flag.is_enabled}
                        onChange={e => toggleFlag(flag.id, e.target.checked)}
                        className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      {!isLoading && !flags?.length && (
        <Card><CardContent className="p-10 text-center text-muted-foreground">No feature flags configured.</CardContent></Card>
      )}
    </div>
  );
}

function AnalyticsSubTab() {
  const { data: counts, isLoading } = useQuery({
    queryKey: ['admin-analytics-counts'],
    queryFn: async () => {
      const [posts, communities, actions, comments] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('communities').select('id', { count: 'exact', head: true }),
        supabase.from('civic_actions').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
      ]);
      return {
        posts: posts.count || 0,
        communities: communities.count || 0,
        civicActions: actions.count || 0,
        comments: comments.count || 0,
      };
    },
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Platform Analytics</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Posts', value: counts?.posts || 0 },
          { label: 'Communities', value: counts?.communities || 0 },
          { label: 'Civic Actions', value: counts?.civicActions || 0 },
          { label: 'Comments', value: counts?.comments || 0 },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="p-5 text-center">
              <div className="text-3xl font-bold">{m.value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
