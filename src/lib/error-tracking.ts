/**
 * Error Tracking & Logging
 * Captures errors and logs them to Supabase for monitoring
 */

import { supabase } from '@/integrations/supabase/client';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorLogDetails {
    message: string;
    stack?: string;
    componentName?: string;
    severity?: ErrorSeverity;
    additionalData?: Record<string, unknown>;
}

/**
 * Log error to Supabase
 */
export async function logError(details: ErrorLogDetails) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        // Console log in development
        if (import.meta.env.DEV) {
            const severityEmoji = {
                low: '💙',
                medium: '💛',
                high: '🧡',
                critical: '❤️',
            };
            console.error(
                `${severityEmoji[details.severity || 'medium']} Error in ${details.componentName || 'Unknown'}:`,
                details.message,
                details.stack
            );
        }

        // Log to database
        await supabase.from('error_logs').insert({
            error_message: details.message,
            error_stack: details.stack || null,
            component_name: details.componentName || null,
            user_id: user?.id || null,
            page_url: window.location.pathname,
            user_agent: navigator.userAgent,
            severity: details.severity || 'medium',
        });
    } catch (error) {
        // Silently fail - don't create error loops
        console.error('Failed to log error:', error);
    }
}

/**
 * Create an error logger for a specific component
 */
export function createErrorLogger(componentName: string) {
    return async (error: Error, severity: ErrorSeverity = 'medium') => {
        await logError({
            message: error.message,
            stack: error.stack,
            componentName,
            severity,
        });
    };
}

/**
 * Global error handler
 * Catches unhandled errors and rejections
 */
export function initGlobalErrorHandling() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
        logError({
            message: event.message,
            stack: event.error?.stack,
            componentName: 'Global',
            severity: 'high',
        });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        logError({
            message: `Unhandled Promise Rejection: ${event.reason}`,
            stack: event.reason?.stack,
            componentName: 'Global',
            severity: 'high',
        });
    });
}
