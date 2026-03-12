import React from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ContentRenderer } from './ContentRenderer';
import { AlertTriangle } from 'lucide-react';

interface SafeContentRendererProps {
    content: string;
    className?: string;
    truncate?: boolean;
    maxLength?: number;
}

/**
 * ContentRenderer wrapped in error boundary for safety
 * Use this component in production to catch any rendering errors
 */
export const SafeContentRenderer: React.FC<SafeContentRendererProps> = (props) => {
    return (
        <ErrorBoundary
            fallback={
                <div className="text-muted-foreground text-sm italic flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Unable to display content</span>
                </div>
            }
        >
            <ContentRenderer {...props} />
        </ErrorBoundary>
    );
};
