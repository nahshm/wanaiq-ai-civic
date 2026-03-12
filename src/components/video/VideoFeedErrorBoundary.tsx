import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    onReset?: () => void
}

interface State {
    hasError: boolean
    error?: Error
}

export class VideoFeedErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('VideoFeed Error:', error, errorInfo)

        // Log to error tracking system
        if (typeof window !== 'undefined') {
            import('@/lib/error-tracking')
                .then(({ logError }) => {
                    logError({
                        message: error.message,
                        stack: error.stack,
                        componentName: 'VideoFeed',
                        severity: 'high',
                        additionalData: errorInfo
                    })
                })
                .catch(() => {
                    // Silently fail if error tracking not available
                })
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6">
                    <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
                    <p className="text-white/70 text-center mb-6 max-w-md">
                        We're having trouble loading videos right now. Please try refreshing the page.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => {
                                this.setState({ hasError: false, error: undefined })
                                this.props.onReset?.()
                            }}
                            variant="default"
                        >
                            Try Again
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/'}
                            variant="outline"
                        >
                            Go Home
                        </Button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mt-6 w-full max-w-2xl">
                            <summary className="cursor-pointer text-sm text-white/50">Error Details</summary>
                            <pre className="mt-2 text-xs bg-black/50 p-4 rounded overflow-auto">
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}
