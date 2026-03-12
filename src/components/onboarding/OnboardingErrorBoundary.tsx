import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * Error boundary specifically for onboarding flow
 * Catches React errors and provides recovery options
 * 
 * Usage:
 * ```tsx
 * <OnboardingErrorBoundary onReset={() => window.location.reload()}>
 *   <OnboardingFlow />
 * </OnboardingErrorBoundary>
 * ```
 */
export class OnboardingErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so next render shows fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // TODO: Replace with Sentry.captureException when integrated
        if (import.meta.env.DEV) {
            console.error('Onboarding error caught by boundary:', error, errorInfo);
        }

        // Save error info to state for display
        this.setState({ errorInfo });

        // Future: Sentry.captureException(error, { tags: { feature: 'onboarding' }, extra: errorInfo });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
        this.props.onReset?.();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-civic-green/5 via-background to-civic-blue/5">
                    <Card className="w-full max-w-md border-destructive/50">
                        <CardContent className="pt-6">
                            <Alert variant="destructive" className="mb-4">
                                <AlertTriangle className="h-5 w-5" />
                                <AlertTitle className="text-lg font-semibold">
                                    Oops! Something Went Wrong
                                </AlertTitle>
                                <AlertDescription className="mt-3 space-y-3">
                                    <p className="text-sm">
                                        We encountered an error during the onboarding process.
                                        <strong className="block mt-1">Don't worry - your progress has been saved.</strong>
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        You can try again, or return to the home page and complete onboarding later.
                                    </p>

                                    {/* Error details for debugging (collapsible) */}
                                    {this.state.error && process.env.NODE_ENV === 'development' && (
                                        <details className="mt-3 text-xs opacity-75">
                                            <summary className="cursor-pointer hover:opacity-100 font-medium">
                                                Error details (for debugging)
                                            </summary>
                                            <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-32">
                                                {this.state.error.toString()}
                                                {this.state.errorInfo?.componentStack && (
                                                    `\n\nComponent Stack:${this.state.errorInfo.componentStack}`
                                                )}
                                            </pre>
                                        </details>
                                    )}
                                </AlertDescription>
                            </Alert>

                            <div className="flex gap-3">
                                <Button
                                    onClick={this.handleReset}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Try Again
                                </Button>
                                <Button
                                    onClick={this.handleGoHome}
                                    variant="default"
                                    className="flex-1 bg-civic-green hover:bg-civic-green/90"
                                >
                                    <Home className="mr-2 h-4 w-4" />
                                    Go Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
