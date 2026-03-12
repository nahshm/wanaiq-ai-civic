import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
    componentName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in its child component tree.
 * Provides a graceful fallback UI with retry functionality.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // TODO: Replace with Sentry.captureException when integrated
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
        this.setState({ errorInfo });

        // Future: Sentry.captureException(error, { extra: errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="py-8 text-center">
                        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            Something went wrong
                            {this.props.componentName && (
                                <span className="text-muted-foreground font-normal">
                                    {' '}in {this.props.componentName}
                                </span>
                            )}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <Button
                            variant="outline"
                            onClick={this.handleReset}
                            className="gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>

                        {/* Dev mode: show stack trace */}
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details className="mt-4 text-left">
                                <summary className="text-xs text-muted-foreground cursor-pointer">
                                    Technical details
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                                    {this.state.error?.stack}
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
 * Wrapper HOC for functional components with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    componentName?: string
) {
    return function WrappedComponent(props: P) {
        return (
            <ErrorBoundary componentName={componentName}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
