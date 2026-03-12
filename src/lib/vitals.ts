/**
 * Web Vitals Performance Tracking
 * Tracks Core Web Vitals (LCP, INP, CLS, FCP, TTFB) and logs to Supabase
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';

/**
 * Send metric to Supabase for analytics
 */
async function sendToSupabase(metric: Metric) {
    try {
        // Only track in production to avoid cluttering data
        if (import.meta.env.DEV) {
            const emoji = metric.rating === 'good' ? '🟢' : metric.rating === 'needs-improvement' ? '🟡' : '🔴';
            console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
            return;
        }

        // Get current user if authenticated
        const { data: { user } } = await supabase.auth.getUser();

        // Insert metric into database
        await supabase.from('performance_metrics').insert({
            metric_name: metric.name,
            value: metric.value,
            rating: metric.rating,
            user_id: user?.id || null,
            page_url: window.location.pathname,
            user_agent: navigator.userAgent,
        });
    } catch (error) {
        // Silently fail - don't impact user experience
        console.error('Failed to log performance metric:', error);
    }
}

/**
 * Initialize Web Vitals tracking
 * Call this once in your app's entry point (main.tsx)
 */
export function initWebVitals() {
    onCLS(sendToSupabase);
    onINP(sendToSupabase);
    onLCP(sendToSupabase);
    onFCP(sendToSupabase);
    onTTFB(sendToSupabase);
}

/**
 * Track custom performance marks
 * Usage: const end = trackPerformance('operation-name');
 *        // ... do work
 *        end();
 */
export function trackPerformance(name: string) {
    const startTime = performance.now();

    return () => {
        const duration = performance.now() - startTime;

        if (import.meta.env.DEV) {
            const emoji = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴';
            console.log(`${emoji} ${name}: ${duration.toFixed(2)}ms`);
        }

        // Log slow operations in production
        if (import.meta.env.PROD && duration > 1000) {
            console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
        }

        return duration;
    };
}
