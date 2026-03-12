import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary for Feed components
 * Catches JavaScript errors and displays a user-friendly fallback UI
 */
export class FeedErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Feed Error Boundary caught an error:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Something went wrong
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            We encountered an error while loading the feed. This might be a temporary issue.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                {this.state.error.message}
                            </pre>
                        )}
                        <Button onClick={this.handleRetry} variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}

export default FeedErrorBoundary;
