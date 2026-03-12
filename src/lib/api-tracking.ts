/**
 * API Performance Tracking
 * Wraps Supabase queries to track response times
 */

import { supabase } from '@/integrations/supabase/client';

interface APIMetric {
    operation: string;
    duration_ms: number;
    status: 'success' | 'error';
}

/**
 * Track API call performance
 */
async function logAPIMetric(metric: APIMetric) {
    try {
        if (import.meta.env.DEV) {
            const emoji = metric.duration_ms < 100 ? '🟢' : metric.duration_ms < 500 ? '🟡' : '🔴';
            console.log(`${emoji} API ${metric.operation}: ${metric.duration_ms.toFixed(2)}ms (${metric.status})`);
        }

        // Log to database if in production or explicitly enabled
        const shouldLog = import.meta.env.PROD || import.meta.env.VITE_ENABLE_API_LOGGING === 'true';

        if (shouldLog) {
            const { data: { user } } = await supabase.auth.getUser();

            await supabase.from('api_metrics').insert({
                operation: metric.operation,
                duration_ms: metric.duration_ms,
                status: metric.status,
                user_id: user?.id || null,
            });
        }
    } catch (error) {
        // Silently fail
        console.error('Failed to log API metric:', error);
    }
}

/**
 * Wrap a Supabase query to track performance
 * 
 * @example
 * const posts = await trackQuery(
 *   'fetch-posts',
 *   () => supabase.from('posts').select('*')
 * );
 */
export async function trackQuery<T>(
    operationName: string,
    queryFn: () => Promise<T>
): Promise<T> {
    const startTime = performance.now();

    try {
        const result = await queryFn();
        const duration = performance.now() - startTime;

        await logAPIMetric({
            operation: operationName,
            duration_ms: duration,
            status: 'success',
        });

        return result;
    } catch (error) {
        const duration = performance.now() - startTime;

        await logAPIMetric({
            operation: operationName,
            duration_ms: duration,
            status: 'error',
        });

        throw error;
    }
}

/**
 * Simple performance logger for dev mode
 */
export function logPerformance(name: string, startTime: number) {
    const duration = performance.now() - startTime;

    if (import.meta.env.DEV) {
        const emoji = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴';
        console.log(`${emoji} ${name}: ${duration.toFixed(2)}ms`);
    }

    if (import.meta.env.PROD && duration > 1000) {
        console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
}
