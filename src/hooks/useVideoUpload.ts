import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface UploadProgress {
    loaded: number
    total: number
    percentage: number
}

interface VideoUploadResult {
    path: string
    url: string
    file: File
}

export const useVideoUpload = () => {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 })
    const { toast } = useToast()

    const uploadVideo = async (file: File, userId: string): Promise<VideoUploadResult> => {
        try {
            setUploading(true)
            setProgress({ loaded: 0, total: file.size, percentage: 0 })

            // Validate file size (max 100MB)
            const maxSize = 100 * 1024 * 1024 // 100MB
            if (file.size > maxSize) {
                throw new Error('Video must be less than 100MB. Please compress your video or trim it shorter.')
            }

            // Validate file type
            const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Only MP4, WebM, MOV, and AVI videos are supported')
            }

            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const timestamp = Date.now()
            const randomString = Math.random().toString(36).substring(7)
            const fileName = `${userId}/${timestamp}_${randomString}.${fileExt}`

            // Upload to Supabase Storage with long-term caching (1 year)
            // Videos are immutable - once uploaded, they never change
            const { data, error } = await supabase.storage
                .from('civic-clips')
                .upload(fileName, file, {
                    cacheControl: '31536000, immutable', // 1 year cache - reduces repeat downloads
                    upsert: false
                })

            if (error) {
                console.error('Upload error:', error)
                throw new Error(`Upload failed: ${error.message}`)
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('civic-clips')
                .getPublicUrl(fileName)

            toast({
                title: 'Video uploaded successfully!',
                description: 'Your CivicClip is being processed and will be available shortly.'
            })

            setProgress({ loaded: file.size, total: file.size, percentage: 100 })

            return {
                path: data.path,
                url: publicUrl,
                file
            }

        } catch (error: any) {
            console.error('Video upload error:', error)
            toast({
                title: 'Upload failed',
                description: error.message || 'An error occurred while uploading your video',
                variant: 'destructive'
            })
            throw error
        } finally {
            setUploading(false)
        }
    }

    const cancelUpload = () => {
        // Note: Supabase JS client doesn't support abort controller yet
        // This would require implementing with fetch directly
        setUploading(false)
        setProgress({ loaded: 0, total: 0, percentage: 0 })
    }

    return {
        uploadVideo,
        cancelUpload,
        uploading,
        progress
    }
}
