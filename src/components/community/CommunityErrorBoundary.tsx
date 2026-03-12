import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
    section?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary for Community components
 * Catches JavaScript errors in child components and displays a fallback UI
 */
export class CommunityErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // TODO: Replace with Sentry.captureException when integrated
        if (import.meta.env.DEV) {
            console.error(`Community Error [${this.props.section || 'unknown'}]:`, error, errorInfo);
        }
        // Future: Sentry.captureException(error, { tags: { section: this.props.section }, extra: errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-4 h-4" />
                            Something went wrong
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3">
                            {this.props.section
                                ? `Failed to load ${this.props.section}.`
                                : 'An error occurred in this section.'}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={this.handleReset}
                            className="gap-2"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Try again
                        </Button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-3">
                                <summary className="text-xs text-muted-foreground cursor-pointer">
                                    Error details
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}

/**
 * Wrapper for sections that can fail gracefully
 * If the section fails, it shows a minimal fallback without breaking the whole page
 */
export const SectionErrorBoundary: React.FC<{
    children: ReactNode;
    section: string;
}> = ({ children, section }) => (
    <CommunityErrorBoundary section={section}>
        {children}
    </CommunityErrorBoundary>
);

export default CommunityErrorBoundary;
