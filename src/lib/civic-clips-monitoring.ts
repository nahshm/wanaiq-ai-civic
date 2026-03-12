/**
 * Civic Clips Performance Monitoring
 * Tracks specific metrics for video feed performance
 */

import { trackPerformance } from './vitals'
import { logError } from './error-tracking'

interface VideoMetrics {
    clipId: string
    loadTime: number
    buffering: boolean
    error?: string
}

// Track video-specific performance
const videoMetrics = new Map<string, VideoMetrics>()

export function trackVideoLoad(clipId: string, startTime: number) {
    const loadTime = performance.now() - startTime

    videoMetrics.set(clipId, {
        clipId,
        loadTime,
        buffering: false
    })

    // Log slow video loads
    if (loadTime > 3000) {
        console.warn(`Slow video load: ${clipId} took ${loadTime}ms`)
        logError({
            message: `Slow video load: ${loadTime}ms`,
            componentName: 'VideoPlayer',
            severity: 'medium',
            additionalData: { clipId, loadTime }
        })
    }

    // Track custom mark
    trackPerformance(`video-load-${clipId}`)

    return loadTime
}

export function trackVideoError(clipId: string, error: Error) {
    logError({
        message: `Video load failed: ${error.message}`,
        stack: error.stack,
        componentName: 'VideoPlayer',
        severity: 'high',
        additionalData: { clipId, errorType: error.name }
    })
}

export function trackPageLoad(pageName: string) {
    // Mark page entry
    performance.mark(`${pageName}-start`)

    return () => {
        // Mark page loaded
        performance.mark(`${pageName}-loaded`)

        try {
            // Measure duration
            performance.measure(
                `${pageName}-duration`,
                `${pageName}-start`,
                `${pageName}-loaded`
            )

            const measure = performance.getEntriesByName(`${pageName}-duration`)[0]
            if (measure) {
                console.log(`📊 ${pageName} load time: ${measure.duration.toFixed(0)}ms`)
                trackPerformance(pageName)
            }
        } catch (e) {
            // Measurement failed, ignore
        }
    }
}

// Track CivicClips page-specific metrics
export function initCivicClipsMonitoring() {
    const cleanup = trackPageLoad('civic-clips-page')

    // Clean up on unmount
    return cleanup
}
