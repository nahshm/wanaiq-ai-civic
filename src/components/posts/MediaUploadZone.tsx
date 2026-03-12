import { useState, useCallback } from 'react'
import { Upload, X, File, Image as ImageIcon, Video as VideoIcon, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface MediaUploadZoneProps {
    files: File[]
    onFilesChange: (files: File[]) => void
    disabled?: boolean
    maxFiles?: number
    maxSizeMB?: number
}

const ACCEPTED_FILE_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
}

const ALL_ACCEPTED_TYPES = [
    ...ACCEPTED_FILE_TYPES.image,
    ...ACCEPTED_FILE_TYPES.video,
    ...ACCEPTED_FILE_TYPES.document
]

export const MediaUploadZone = ({
    files,
    onFilesChange,
    disabled,
    maxFiles = 10,
    maxSizeMB = 100
}: MediaUploadZoneProps) => {
    const [dragActive, setDragActive] = useState(false)
    const [uploading, setUploading] = useState(false)

    const getFileType = (file: File): 'image' | 'video' | 'document' | 'unknown' => {
        if (ACCEPTED_FILE_TYPES.image.includes(file.type)) return 'image'
        if (ACCEPTED_FILE_TYPES.video.includes(file.type)) return 'video'
        if (ACCEPTED_FILE_TYPES.document.includes(file.type)) return 'document'
        return 'unknown'
    }

    const getFileIcon = (file: File) => {
        const type = getFileType(file)
        switch (type) {
            case 'image': return ImageIcon
            case 'video': return VideoIcon
            case 'document': return FileText
            default: return File
        }
    }

    const handleFiles = useCallback((newFiles: FileList | null) => {
        if (!newFiles || disabled) return

        const filesArray = Array.from(newFiles)
        const errors: string[] = []
        const validFiles: File[] = []

        const validateFile = (file: File): string | null => {
            // Check file type
            if (!ALL_ACCEPTED_TYPES.includes(file.type)) {
                return `${file.name}: Unsupported file type. Please upload images (JPG, PNG, GIF, WebP), videos (MP4, WebM, MOV, AVI), or documents (PDF, DOC, DOCX).`
            }

            // Check file size
            const sizeMB = file.size / (1024 * 1024)
            if (sizeMB > maxSizeMB) {
                return `${file.name}: File size (${sizeMB.toFixed(2)}MB) exceeds the maximum allowed size of ${maxSizeMB}MB.`
            }

            return null
        }

        // Validate each file
        filesArray.forEach(file => {
            const error = validateFile(file)
            if (error) {
                errors.push(error)
            } else {
                validFiles.push(file)
            }
        })

        // Check total file count
        if (files.length + validFiles.length > maxFiles) {
            errors.push(`You can only upload up to ${maxFiles} files. Currently have ${files.length}, trying to add ${validFiles.length}.`)
            return
        }

        // Show errors if any
        if (errors.length > 0) {
            alert(errors.join('\n\n'))
            return
        }

        // Add valid files
        onFilesChange([...files, ...validFiles])
    }, [files, onFilesChange, disabled, maxFiles, maxSizeMB])

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (disabled) return

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (disabled) return

        handleFiles(e.dataTransfer.files)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files)
        // Reset input value to allow re-uploading the same file
        e.target.value = ''
    }

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index)
        onFilesChange(newFiles)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <div className="space-y-4">
            <Label>Upload Media</Label>

            {/* Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                    dragActive ? 'border-primary bg-primary/5' : 'border-border',
                    disabled && 'opacity-50 cursor-not-allowed',
                    !disabled && 'hover:border-primary cursor-pointer'
                )}
            >
                <input
                    type="file"
                    multiple
                    accept={ALL_ACCEPTED_TYPES.join(',')}
                    onChange={handleChange}
                    disabled={disabled}
                    className="hidden"
                    id="media-upload"
                />
                <label
                    htmlFor="media-upload"
                    className={cn('cursor-pointer flex flex-col items-center justify-center', disabled && 'cursor-not-allowed')}
                >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium mb-1">
                        Drag and drop files, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                        Images, Videos, or Documents
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        Max {maxSizeMB}MB per file • Up to {maxFiles} files
                    </p>
                </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                        {files.length} file{files.length > 1 ? 's' : ''} selected
                    </Label>
                    <div className="space-y-2">
                        {files.map((file, index) => {
                            const Icon = getFileIcon(file)
                            const type = getFileType(file)
                            const isPreviewable = type === 'image'
                            const preview = isPreviewable ? URL.createObjectURL(file) : null

                            return (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                                >
                                    {isPreviewable && preview ? (
                                        <img
                                            src={preview}
                                            alt={file.name}
                                            className="h-12 w-12 object-cover rounded"
                                            onLoad={() => URL.revokeObjectURL(preview)}
                                        />
                                    ) : (
                                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                                            <Icon className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)} • {type}
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                        disabled={disabled}
                                        className="h-8 w-8 p-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
