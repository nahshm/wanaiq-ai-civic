/**
 * Generate video thumbnails for lazy loading placeholders
 */

export interface ThumbnailResult {
  blob: Blob
  dataUrl: string
  width: number
  height: number
}

/**
 * Generate a thumbnail from a video file at a specific time
 */
export const generateVideoThumbnail = async (
  file: File,
  timeInSeconds: number = 1,
  maxWidth: number = 480,
  quality: number = 0.7
): Promise<ThumbnailResult> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    
    const objectUrl = URL.createObjectURL(file)
    video.src = objectUrl
    
    video.onloadedmetadata = () => {
      // Seek to the specified time
      video.currentTime = Math.min(timeInSeconds, video.duration)
    }
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Could not get canvas context'))
        return
      }
      
      // Calculate dimensions maintaining aspect ratio
      let width = video.videoWidth
      let height = video.videoHeight
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw the video frame to canvas
      ctx.drawImage(video, 0, 0, width, height)
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl)
          
          if (!blob) {
            reject(new Error('Failed to generate thumbnail'))
            return
          }
          
          // Also generate data URL for immediate preview
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          
          resolve({
            blob,
            dataUrl,
            width,
            height
          })
        },
        'image/jpeg',
        quality
      )
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load video'))
    }
  })
}

/**
 * Generate thumbnail from a video URL
 */
export const generateThumbnailFromUrl = async (
  videoUrl: string,
  timeInSeconds: number = 1,
  maxWidth: number = 480
): Promise<ThumbnailResult> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.src = videoUrl
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeInSeconds, video.duration)
    }
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      let width = video.videoWidth
      let height = video.videoHeight
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      ctx.drawImage(video, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate thumbnail'))
            return
          }
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
          
          resolve({
            blob,
            dataUrl,
            width,
            height
          })
        },
        'image/jpeg',
        0.7
      )
    }
    
    video.onerror = () => {
      reject(new Error('Failed to load video from URL'))
    }
  })
}

/**
 * Upload thumbnail to Supabase Storage
 */
export const uploadThumbnail = async (
  supabase: any,
  thumbnailBlob: Blob,
  userId: string,
  bucket: string = 'media'
): Promise<string | null> => {
  try {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const fileName = `thumbnails/${userId}/${timestamp}_${randomString}.jpg`
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, thumbnailBlob, {
        contentType: 'image/jpeg',
        cacheControl: '31536000, immutable' // 1 year cache for thumbnails
      })
    
    if (error) {
      console.error('Thumbnail upload error:', error)
      return null
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)
    
    return publicUrl
  } catch (error) {
    console.error('Failed to upload thumbnail:', error)
    return null
  }
}
