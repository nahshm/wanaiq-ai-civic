/**
 * Performance Monitoring Dashboard Tab
 * Displays Web Vitals, API Performance, and Error Logs
 * For SuperAdmin only
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function PerformanceMonitoringTab() {
    // Fetch Web Vitals metrics
    const { data: webVitals, isLoading: loadingVitals } = useQuery({
        queryKey: ['web-vitals'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('performance_metrics')
                .select('*')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    // Fetch API metrics
    const { data: apiMetrics, isLoading: loadingAPI } = useQuery({
        queryKey: ['api-metrics'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('api_metrics')
                .select('*')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            return data;


        },
    });

    // Fetch error logs
    const { data: errorLogs, isLoading: loadingErrors } = useQuery({
        queryKey: ['error-logs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('error_logs')
                .select('*')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data;
        },
    });

    // Calculate aggregates
    const webVitalsAggregates = webVitals?.reduce((acc, metric) => {
        if (!acc[metric.metric_name]) {
            acc[metric.metric_name] = { total: 0, count: 0, good: 0, poor: 0 };
        }
        acc[metric.metric_name].total += metric.value;
        acc[metric.metric_name].count += 1;
        if (metric.rating === 'good') acc[metric.metric_name].good += 1;
        if (metric.rating === 'poor') acc[metric.metric_name].poor += 1;
        return acc;
    }, {} as Record<string, { total: number; count: number; good: number; poor: number }>);

    const apiAggregates = apiMetrics?.reduce((acc, metric) => {
        if (!acc[metric.operation]) {
            acc[metric.operation] = { total: 0, count: 0, avgDuration: 0 };
        }
        acc[metric.operation].total += metric.duration_ms;
        acc[metric.operation].count += 1;
        acc[metric.operation].avgDuration = acc[metric.operation].total / acc[metric.operation].count;
        return acc;
    }, {} as Record<string, { total: number; count: number; avgDuration: number }>);

    const errorAggregates = errorLogs?.reduce((acc, error) => {
        const severity = error.severity || 'medium';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Chart data
    const webVitalsChartData = Object.entries(webVitalsAggregates || {}).map(([name, data]) => ({
        name,
        average: data.total / data.count,
        goodPercent: (data.good / data.count) * 100,
    }));

    const slowestAPIs = Object.entries(apiAggregates || {})
        .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
        .slice(0, 10)
        .map(([operation, data]) => ({
            operation: operation.slice(0, 30),
            avgDuration: data.avgDuration,
            calls: data.count,
        }));

    const errorSeverityData = Object.entries(errorAggregates || {}).map(([severity, count]) => ({
        name: severity,
        value: count,
    }));

    const COLORS = {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#ef4444',
        critical: '#991b1b',
    };

    if (loadingVitals || loadingAPI || loadingErrors) {
        return (
            <div className="flex items-center justify-center h-64">
                <Activity className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Web Vitals</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{webVitals?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            metrics recorded (24h)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{apiMetrics?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            tracked requests (24h)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Errors</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{errorLogs?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            errors logged (24h)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Web Vitals Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Core Web Vitals - Average Values</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={webVitalsChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="average" fill="#8884d8" name="Avg Value (ms)" />
                            <Bar dataKey="goodPercent" fill="#10b981" name="Good %" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Slowest APIs */}
            <Card>
                <CardHeader>
                    <CardTitle>Slowest API Operations</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={slowestAPIs} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="operation" type="category" width={150} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="avgDuration" fill="#f59e0b" name="Avg Duration (ms)" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Error Severity Distribution */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Error Severity Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={errorSeverityData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {errorSeverityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#888'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Errors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto">
                            {errorLogs?.slice(0, 10).map((error) => (
                                <div key={error.id} className="text-sm border-l-2 border-destructive pl-3 py-1">
                                    <div className="font-medium">{error.component_name || 'Unknown'}</div>
                                    <div className="text-muted-foreground text-xs truncate">
                                        {error.error_message}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(error.created_at!).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                            {(!errorLogs || errorLogs.length === 0) && (
                                <div className="text-center text-muted-foreground py-8">
                                    No errors recorded 🎉
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
