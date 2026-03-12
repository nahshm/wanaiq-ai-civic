import { useCallback, useState } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface MediaUploaderProps {
  onFilesChange: (files: File[]) => void;
  initialFiles?: File[];
  uploadProgress: Map<string, number>;
}

export function MediaUploader({ onFilesChange, initialFiles = [], uploadProgress }: MediaUploaderProps) {
  const [files, setFiles] = useState<File[]>(initialFiles);

  // When files are dropped or selected
  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    const newFiles = [...files, ...acceptedFiles];
    setFiles(newFiles);
    onFilesChange(newFiles);
  }, [files, onFilesChange]);

  const removeFile = (fileToRemove: File) => {
    const newFiles = files.filter(file => file !== fileToRemove);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 40 * 1024 * 1024, // 40MB
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-md cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
          {isDragActive ? (
            <p className="font-semibold text-primary">Drop the files here ...</p>
          ) : (
            <>
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">Media or Documents (MAX. 10MB)</p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files:</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative group">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt={file.name} className="object-cover w-full h-24 rounded-md" />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-24 bg-muted rounded-md">
                    <FileIcon className="w-8 h-8 text-muted-foreground" />
                    <p className="mt-1 text-xs text-center truncate w-full px-1">{file.name}</p>
                  </div>
                )}
                {uploadProgress.has(file.name) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-md p-2">
                    <Progress value={uploadProgress.get(file.name)} className="w-full h-2" />
                    <p className="text-white text-xs mt-1">{uploadProgress.get(file.name)}%</p>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className={cn(
                    "absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                    // Keep the remove button visible during upload
                    uploadProgress.has(file.name) && "opacity-100"
                  )}
                  onClick={() => removeFile(file)}
                  disabled={uploadProgress.has(file.name) && (uploadProgress.get(file.name) ?? 0) > 0}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}