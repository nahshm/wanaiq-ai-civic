/**
 * Video URL Helper - Handles QUIC protocol errors and CDN optimization
 * 
 * Supabase Storage sometimes has ERR_QUIC_PROTOCOL_ERROR issues.
 * This helper provides fallback strategies.
 */

export interface VideoUrlOptions {
    /** Force HTTP/2 instead of QUIC (HTTP/3) */
    forceHttp2?: boolean
    /** Add cache control headers */
    cacheControl?: 'public' | 'private' | 'no-cache'
    /** Quality preset for videos */
    quality?: 'auto' | 'high' | 'medium' | 'low'
}

/**
 * Get optimized video URL with fallback for QUIC errors
 */
export function getOptimizedVideoUrl(
    url: string,
    options: VideoUrlOptions = {}
): string {
    const { forceHttp2 = false, cacheControl, quality = 'auto' } = options

    try {
        const urlObj = new URL(url)

        // Add query parameters for optimization
        if (forceHttp2) {
            // Some CDNs respect this header to disable QUIC
            urlObj.searchParams.set('protocol', 'h2')
        }

        if (cacheControl) {
            urlObj.searchParams.set('cache-control', cacheControl)
        }

        if (quality !== 'auto') {
            urlObj.searchParams.set('quality', quality)
        }

        return urlObj.toString()
    } catch (error) {
        // If URL parsing fails, return original
        console.warn('Failed to parse video URL:', error)
        return url
    }
}

/**
 * Get video with fallback URLs for redundancy
 * Returns array of URLs to try in order
 */
export function getVideoUrlsWithFallback(url: string): string[] {
    return [
        url, // Original URL (QUIC/HTTP3)
        getOptimizedVideoUrl(url, { forceHttp2: true }), // HTTP/2 fallback
        getOptimizedVideoUrl(url, { forceHttp2: true, cacheControl: 'no-cache' }), // No-cache fallback
    ]
}

/**
 * Retry video load with exponential backoff
 */
export async function loadVideoWithRetry(
    videoElement: HTMLVideoElement,
    urls: string[],
    maxRetries = 3
): Promise<void> {
    let lastError: Error | null = null

    for (const url of urls) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Set new source
                videoElement.src = url

                // Wait for video to be ready
                await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Video load timeout'))
                    }, 10000) // 10 second timeout

                    const onLoadedData = () => {
                        clearTimeout(timeout)
                        cleanup()
                        resolve()
                    }

                    const onError = (e: Event) => {
                        clearTimeout(timeout)
                        cleanup()
                        reject(new Error(`Video load error: ${(e as any).message || 'Unknown'}`))
                    }

                    const cleanup = () => {
                        videoElement.removeEventListener('loadeddata', onLoadedData)
                        videoElement.removeEventListener('error', onError)
                    }

                    videoElement.addEventListener('loadeddata', onLoadedData)
                    videoElement.addEventListener('error', onError)

                    // Trigger load
                    videoElement.load()
                })

                // Success! Video loaded
                return
            } catch (error) {
                lastError = error as Error

                // Wait before retry (exponential backoff)
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.min(1000 * 2 ** attempt, 5000)))
                }
            }
        }
    }

    // All attempts failed
    throw lastError || new Error('Failed to load video')
}

/**
 * Check if error is a QUIC protocol error
 */
export function isQuicError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || ''
    return (
        errorMessage.includes('ERR_QUIC_PROTOCOL_ERROR') ||
        errorMessage.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
        errorMessage.includes('net::ERR_')
    )
}

/**
 * Get video preload strategy based on network conditions
 */
export function getPreloadStrategy(): 'auto' | 'metadata' | 'none' {
    // Check if user prefers reduced data
    if ('connection' in navigator) {
        const conn = (navigator as any).connection

        if (conn.saveData) {
            return 'metadata' // Reduced data mode
        }

        // Slow connections
        if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
            return 'none'
        }

        if (conn.effectiveType === '3g') {
            return 'metadata'
        }
    }

    return 'auto' // Default for fast connections
}
