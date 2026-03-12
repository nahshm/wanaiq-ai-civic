import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ExternalLink, Loader2, Globe, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

export interface LinkPreviewData {
    title: string | null
    description: string | null
    image: string | null
    siteName: string | null
    favicon: string | null
    url: string
}

interface LinkPostInputProps {
    url: string
    onUrlChange: (url: string) => void
    onPreviewChange?: (preview: LinkPreviewData | null) => void
    disabled?: boolean
}

export const LinkPostInput = ({ url, onUrlChange, onPreviewChange, disabled }: LinkPostInputProps) => {
    const [isValidUrl, setIsValidUrl] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [preview, setPreview] = useState<LinkPreviewData | null>(null)
    const [error, setError] = useState<string | null>(null)

    const validateUrl = (urlString: string) => {
        try {
            new URL(urlString)
            return true
        } catch {
            return false
        }
    }

    const fetchPreview = useCallback(async (fetchUrl: string) => {
        if (!validateUrl(fetchUrl)) return

        setIsLoading(true)
        setError(null)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            
            const SUPABASE_URL = 'https://zcnjpczplkbdmmovlrtv.supabase.co'
            
            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/fetch-link-preview`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
                    },
                    body: JSON.stringify({ url: fetchUrl }),
                }
            )

            if (!response.ok) {
                throw new Error('Failed to fetch preview')
            }

            const data: LinkPreviewData = await response.json()
            setPreview(data)
            onPreviewChange?.(data)
        } catch (err) {
            console.error('Link preview fetch failed:', err)
            setError('Could not load preview')
            setPreview(null)
            onPreviewChange?.(null)
        } finally {
            setIsLoading(false)
        }
    }, [onPreviewChange])

    // Debounced fetch when URL changes
    useEffect(() => {
        if (!url || !validateUrl(url)) {
            setPreview(null)
            onPreviewChange?.(null)
            return
        }

        const timer = setTimeout(() => {
            fetchPreview(url)
        }, 800) // 800ms debounce

        return () => clearTimeout(timer)
    }, [url]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleUrlChange = (newUrl: string) => {
        onUrlChange(newUrl)
        setIsValidUrl(validateUrl(newUrl))
    }

    const hostname = isValidUrl ? (() => { try { return new URL(url).hostname } catch { return '' } })() : ''

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="link-url">URL *</Label>
                <div className="relative">
                    <Input
                        id="link-url"
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        disabled={disabled}
                        className="pr-10"
                    />
                    {url && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : isValidUrl ? (
                                <ExternalLink className="h-4 w-4 text-green-600" />
                            ) : (
                                <span className="text-xs text-destructive">Invalid URL</span>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    Paste a link to an article, document, or website
                </p>
            </div>

            {/* Live Link Preview */}
            {isLoading && (
                <Card className="p-4 bg-muted/50">
                    <div className="flex items-center gap-3">
                        <div className="h-16 w-16 bg-muted rounded animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                            <div className="h-3 bg-muted rounded animate-pulse w-full" />
                            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                        </div>
                    </div>
                </Card>
            )}

            {!isLoading && preview && (
                <Card className="overflow-hidden border border-sidebar-border hover:border-primary/30 transition-colors">
                    {preview.image && (
                        <div className="relative w-full h-40 bg-muted">
                            <img
                                src={preview.image}
                                alt={preview.title || 'Link preview'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                }}
                            />
                        </div>
                    )}
                    <div className="p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {preview.favicon ? (
                                <img
                                    src={preview.favicon}
                                    alt=""
                                    className="w-4 h-4 rounded"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                />
                            ) : (
                                <Globe className="w-3.5 h-3.5" />
                            )}
                            <span>{preview.siteName || hostname}</span>
                        </div>
                        {preview.title && (
                            <h4 className="font-semibold text-sm line-clamp-2 text-foreground">
                                {preview.title}
                            </h4>
                        )}
                        {preview.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {preview.description}
                            </p>
                        )}
                    </div>
                </Card>
            )}

            {!isLoading && error && isValidUrl && (
                <Card className="p-4 bg-muted/50">
                    <div className="flex items-start gap-3">
                        <div className="h-16 w-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            <ExternalLink className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm mb-1 truncate">
                                {hostname}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {url}
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                                Preview unavailable — link will still be saved
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    )
}
