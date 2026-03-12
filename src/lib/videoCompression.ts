/**
 * Client-side video compression utility
 * Reduces video file size by ~70% before upload
 */

export interface CompressionProgress {
  stage: 'loading' | 'compressing' | 'encoding' | 'complete'
  progress: number
  message: string
}

export interface CompressionResult {
  compressedFile: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  thumbnail: Blob | null
}

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  videoBitrate?: number
  audioBitrate?: number
  onProgress?: (progress: CompressionProgress) => void
}

const DEFAULT_OPTIONS: Required<Omit<CompressionOptions, 'onProgress'>> = {
  maxWidth: 1280,
  maxHeight: 720,
  videoBitrate: 2_000_000, // 2 Mbps
  audioBitrate: 128_000,   // 128 kbps
}

/**
 * Check if browser supports MediaRecorder with required codecs
 */
export const isCompressionSupported = (): boolean => {
  if (typeof MediaRecorder === 'undefined') return false
  
  // Check for VP8/VP9 (WebM) or H.264 support
  const supportedTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=h264',
  ]
  
  return supportedTypes.some(type => MediaRecorder.isTypeSupported(type))
}

/**
 * Get the best supported MIME type for recording
 */
const getBestMimeType = (): string => {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ]
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  
  return 'video/webm'
}

/**
 * Calculate scaled dimensions maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let width = originalWidth
  let height = originalHeight
  
  // Scale down if needed
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }
  
  // Ensure dimensions are even (required for some codecs)
  width = Math.floor(width / 2) * 2
  height = Math.floor(height / 2) * 2
  
  return { width, height }
}

/**
 * Generate thumbnail from video at specified time
 */
export const generateThumbnail = async (
  videoElement: HTMLVideoElement,
  time: number = 1
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      resolve(null)
      return
    }
    
    const handleSeeked = () => {
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      ctx.drawImage(videoElement, 0, 0)
      
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.8)
      
      videoElement.removeEventListener('seeked', handleSeeked)
    }
    
    videoElement.addEventListener('seeked', handleSeeked)
    videoElement.currentTime = Math.min(time, videoElement.duration || time)
  })
}

/**
 * Compress video file using canvas + MediaRecorder
 */
export const compressVideo = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { onProgress } = options
  
  onProgress?.({ stage: 'loading', progress: 0, message: 'Loading video...' })
  
  // Create video element and load file
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.src = URL.createObjectURL(file)
  
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('Failed to load video'))
  })
  
  // Calculate output dimensions
  const { width, height } = calculateDimensions(
    video.videoWidth,
    video.videoHeight,
    opts.maxWidth,
    opts.maxHeight
  )
  
  // Generate thumbnail before compression
  onProgress?.({ stage: 'loading', progress: 10, message: 'Generating thumbnail...' })
  const thumbnail = await generateThumbnail(video, 1)
  
  // Check if compression is needed
  const needsCompression = 
    video.videoWidth > opts.maxWidth ||
    video.videoHeight > opts.maxHeight ||
    file.size > 10 * 1024 * 1024 // > 10MB
  
  if (!needsCompression) {
    URL.revokeObjectURL(video.src)
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
      thumbnail
    }
  }
  
  onProgress?.({ stage: 'compressing', progress: 20, message: 'Setting up compression...' })
  
  // Create canvas for drawing frames
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  
  // Get canvas stream
  const stream = canvas.captureStream(30) // 30 FPS
  
  // Try to add audio track if present
  try {
    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaElementSource(video)
    const destination = audioCtx.createMediaStreamDestination()
    source.connect(destination)
    source.connect(audioCtx.destination)
    
    destination.stream.getAudioTracks().forEach(track => {
      stream.addTrack(track)
    })
  } catch {
    // Audio extraction failed, continue without audio
    console.log('Audio extraction not supported, compressing video only')
  }
  
  // Set up MediaRecorder
  const mimeType = getBestMimeType()
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: opts.videoBitrate,
    audioBitsPerSecond: opts.audioBitrate,
  })
  
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data)
    }
  }
  
  // Start recording
  recorder.start(100) // Capture every 100ms
  
  // Play video and draw to canvas
  video.currentTime = 0
  await video.play()
  
  const duration = video.duration
  
  return new Promise((resolve, reject) => {
    const drawFrame = () => {
      if (video.paused || video.ended) {
        recorder.stop()
        return
      }
      
      ctx.drawImage(video, 0, 0, width, height)
      
      // Report progress
      const progress = Math.min(90, 20 + (video.currentTime / duration) * 70)
      onProgress?.({ 
        stage: 'encoding', 
        progress, 
        message: `Compressing: ${Math.floor((video.currentTime / duration) * 100)}%` 
      })
      
      requestAnimationFrame(drawFrame)
    }
    
    drawFrame()
    
    recorder.onstop = () => {
      onProgress?.({ stage: 'complete', progress: 100, message: 'Compression complete!' })
      
      const compressedBlob = new Blob(chunks, { type: mimeType })
      const extension = mimeType.includes('webm') ? 'webm' : 'mp4'
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, `.${extension}`),
        { type: mimeType }
      )
      
      URL.revokeObjectURL(video.src)
      
      resolve({
        compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: file.size / compressedFile.size,
        thumbnail
      })
    }
    
    recorder.onerror = (e) => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Compression failed'))
    }
    
    video.onended = () => {
      recorder.stop()
    }
  })
}

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
