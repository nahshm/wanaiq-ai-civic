import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVideoUpload } from '@/hooks/useVideoUpload'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Video, Loader2, X, Zap } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
    compressVideo, 
    isCompressionSupported, 
    formatFileSize,
    type CompressionProgress 
} from '@/lib/videoCompression'
import { generateVideoThumbnail, uploadThumbnail } from '@/lib/generateThumbnail'

export const CreateCivicClip = () => {
    const { user } = useAuth()
    const authModal = useAuthModal()
    const navigate = useNavigate()
    const { uploadVideo, uploading, progress } = useVideoUpload()
    const { toast } = useToast()

    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [compressedFile, setCompressedFile] = useState<File | null>(null)
    const [videoPreview, setVideoPreview] = useState<string | null>(null)
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
    const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [hashtags, setHashtags] = useState('')
    const [communityId, setCommunityId] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [compressing, setCompressing] = useState(false)
    const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null)
    const [compressionStats, setCompressionStats] = useState<{
        original: number
        compressed: number
        ratio: number
    } | null>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('video/')) {
            toast({
                title: 'Invalid file type',
                description: 'Please select a video file',
                variant: 'destructive'
            })
            return
        }

        setVideoFile(file)
        const url = URL.createObjectURL(file)
        setVideoPreview(url)

        // Generate thumbnail immediately
        try {
            const thumbnail = await generateVideoThumbnail(file, 1)
            setThumbnailPreview(thumbnail.dataUrl)
            setThumbnailBlob(thumbnail.blob)
        } catch (error) {
            console.error('Failed to generate thumbnail:', error)
        }

        // Auto-compress if file is large and compression is supported
        if (file.size > 10 * 1024 * 1024 && isCompressionSupported()) {
            handleCompress(file)
        }
    }

    const handleCompress = async (file: File) => {
        if (!isCompressionSupported()) {
            toast({
                title: 'Compression not supported',
                description: 'Your browser does not support video compression',
                variant: 'destructive'
            })
            return
        }

        setCompressing(true)
        setCompressionProgress({ stage: 'loading', progress: 0, message: 'Starting compression...' })

        try {
            const result = await compressVideo(file, {
                maxWidth: 1280,
                maxHeight: 720,
                videoBitrate: 2_000_000,
                onProgress: setCompressionProgress
            })

            setCompressedFile(result.compressedFile)
            setCompressionStats({
                original: result.originalSize,
                compressed: result.compressedSize,
                ratio: result.compressionRatio
            })

            // Update preview with compressed video
            if (videoPreview) {
                URL.revokeObjectURL(videoPreview)
            }
            setVideoPreview(URL.createObjectURL(result.compressedFile))

            // Use thumbnail from compression if available
            if (result.thumbnail && !thumbnailBlob) {
                setThumbnailBlob(result.thumbnail)
                const reader = new FileReader()
                reader.onload = () => setThumbnailPreview(reader.result as string)
                reader.readAsDataURL(result.thumbnail)
            }

            toast({
                title: 'Video compressed!',
                description: `Reduced from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.compressedSize)} (${Math.round((1 - 1/result.compressionRatio) * 100)}% smaller)`
            })
        } catch (error: any) {
            console.error('Compression error:', error)
            toast({
                title: 'Compression failed',
                description: 'Using original video instead',
                variant: 'destructive'
            })
        } finally {
            setCompressing(false)
            setCompressionProgress(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        console.log('Submit validation:', { videoFile, user, title })

        if (!user) {
            authModal.open('login')
            return
        }

        if (!videoFile) {
            toast({
                title: 'Missing video',
                description: 'Please select a video file to upload',
                variant: 'destructive'
            })
            return
        }

        if (!title.trim()) {
            toast({
                title: 'Missing title',
                description: 'Please provide a title for your CivicClip',
                variant: 'destructive'
            })
            return
        }

        try {
            setSubmitting(true)

            // Use compressed file if available, otherwise original
            const fileToUpload = compressedFile || videoFile

            // Upload video
            const { path, url } = await uploadVideo(fileToUpload, user.id)

            // Upload thumbnail if available
            let thumbnailUrl: string | null = null
            if (thumbnailBlob) {
                thumbnailUrl = await uploadThumbnail(supabase, thumbnailBlob, user.id, 'civic-clips')
            }

            // Parse hashtags
            const hashtagArray = hashtags
                .split(',')
                .map(t => t.trim())
                .filter(Boolean)
                .map(t => t.startsWith('#') ? t.substring(1) : t)

            // Create post
            const { data: post, error: postError } = await supabase
                .from('posts')
                .insert({
                    title,
                    content: description,
                    author_id: user.id,
                    community_id: communityId || null,
                    content_type: 'video'
                })
                .select()
                .single()

            if (postError) throw postError

            // Get video metadata (duration, dimensions)
            const videoElement = document.createElement('video')
            videoElement.src = videoPreview!

            await new Promise((resolve) => {
                videoElement.onloadedmetadata = resolve
            })

            const duration = Math.floor(videoElement.duration)
            const width = videoElement.videoWidth
            const height = videoElement.videoHeight
            const aspectRatio = width > height ? '16:9' : '9:16'

            // Create civic_clip
            const { error: clipError } = await supabase
                .from('civic_clips')
                .insert({
                    post_id: post.id,
                    video_url: url,
                    thumbnail_url: thumbnailUrl,
                    duration,
                    width,
                    height,
                    aspect_ratio: aspectRatio,
                    file_size: fileToUpload.size,
                    category,
                    hashtags: hashtagArray,
                    processing_status: 'ready'
                })

            if (clipError) throw clipError

            toast({
                title: 'CivicClip created!',
                description: 'Your video has been published successfully.'
            })

            // Navigate to the new post
            navigate(`/posts/${post.id}`)

        } catch (error: any) {
            console.error('Create civic clip error:', error)
            toast({
                title: 'Failed to create CivicClip',
                description: error.message || 'An error occurred',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleRemoveVideo = () => {
        setVideoFile(null)
        setCompressedFile(null)
        setCompressionStats(null)
        setThumbnailBlob(null)
        setThumbnailPreview(null)
        if (videoPreview) {
            URL.revokeObjectURL(videoPreview)
            setVideoPreview(null)
        }
    }

    return (
        <div className="container max-w-3xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Create CivicClip</CardTitle>
                    <CardDescription>
                        Share civic education, government updates, or community reports through short videos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Video Upload */}
                        <div>
                            <Label>Video *</Label>
                            {!videoPreview ? (
                                <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="video-upload"
                                        disabled={uploading || submitting}
                                    />
                                    <label htmlFor="video-upload" className="cursor-pointer">
                                        <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-sm font-medium mb-1">
                                            Click to upload video
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            MP4, WebM, MOV up to 100MB
                                        </p>
                                    </label>
                                </div>
                            ) : (
                                <div className="relative">
                                    <video
                                        src={videoPreview}
                                        controls
                                        className="w-full rounded-lg max-h-96"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleRemoveVideo}
                                        className="absolute top-2 right-2"
                                        disabled={uploading || submitting}
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Remove
                                    </Button>
                                    {/* File size info and compression stats */}
                                    <div className="mt-2 space-y-1">
                                        {videoFile && !compressionStats && (
                                            <p className="text-xs text-muted-foreground">
                                                Original size: {formatFileSize(videoFile.size)}
                                            </p>
                                        )}
                                        {compressionStats && (
                                            <div className="text-xs space-y-1">
                                                <p className="text-muted-foreground">
                                                    Original: {formatFileSize(compressionStats.original)} → 
                                                    Compressed: {formatFileSize(compressionStats.compressed)}
                                                </p>
                                                <p className="text-green-600 dark:text-green-400 font-medium">
                                                    ✓ {Math.round((1 - 1/compressionStats.ratio) * 100)}% smaller - saves bandwidth!
                                                </p>
                                            </div>
                                        )}
                                        {/* Manual compress button for smaller files */}
                                        {videoFile && !compressedFile && !compressing && isCompressionSupported() && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCompress(videoFile)}
                                                className="mt-2"
                                            >
                                                <Zap className="h-3 w-3 mr-1" />
                                                Compress Video
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Compression progress */}
                            {compressing && compressionProgress && (
                                <div className="mt-4">
                                    <Progress value={compressionProgress.progress} className="h-2" />
                                    <p className="text-sm text-muted-foreground mt-2 text-center">
                                        {compressionProgress.message}
                                    </p>
                                </div>
                            )}

                            {/* Upload progress */}
                            {uploading && (
                                <div className="mt-4">
                                    <Progress value={progress.percentage} className="h-2" />
                                    <p className="text-sm text-muted-foreground mt-2 text-center">
                                        Uploading: {progress.percentage.toFixed(0)}%
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What's your CivicClip about?"
                                required
                                maxLength={300}
                                disabled={uploading || submitting}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {title.length}/300 characters
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide more context about your video..."
                                rows={4}
                                maxLength={1000}
                                disabled={uploading || submitting}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {description.length}/1000 characters
                            </p>
                        </div>

                        {/* Category */}
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Select value={category} onValueChange={setCategory} disabled={uploading || submitting}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="civic_education">Civic Education</SelectItem>
                                    <SelectItem value="promise_update">Promise Update</SelectItem>
                                    <SelectItem value="project_showcase">Project Showcase</SelectItem>
                                    <SelectItem value="explainer">Government Explainer</SelectItem>
                                    <SelectItem value="community_report">Community Report</SelectItem>
                                    <SelectItem value="accountability">Accountability</SelectItem>
                                    <SelectItem value="discussion">Discussion</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Hashtags */}
                        <div>
                            <Label htmlFor="hashtags">Hashtags</Label>
                            <Input
                                id="hashtags"
                                value={hashtags}
                                onChange={(e) => setHashtags(e.target.value)}
                                placeholder="#education, #healthcare, #infrastructure"
                                disabled={uploading || submitting}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Separate tags with commas. # symbol is optional.
                            </p>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(-1)}
                                disabled={uploading || submitting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        <Button
                                type="submit"
                                disabled={!videoFile || !title || submitting || uploading || compressing}
                                className="flex-1"
                            >
                                {(submitting || uploading || compressing) ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {compressing ? 'Compressing...' : uploading ? 'Uploading...' : 'Publishing...'}
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Publish CivicClip
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
