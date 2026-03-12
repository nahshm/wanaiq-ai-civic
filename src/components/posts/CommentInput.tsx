import { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Image, Smile, Plus, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CommentInputProps {
  channelName?: string;
  placeholder?: string;
  onSubmit: (content: string, mediaFiles?: UploadedMedia[]) => void;
  autoFocus?: boolean;
  className?: string;
}

export interface UploadedMedia {
  id: string;
  filePath: string;
  filename: string;
  fileType: string;
  fileSize: number;
  url: string;
}

const EMOJI_LIST = [
  '😀','😂','😍','🤔','😢','😡','👍','👎','🔥','💯',
  '❤️','🎉','👏','🙏','💪','🤝','✅','⚠️','📢','🏛️',
  '⚖️','🗳️','📊','🌍','💡','📌','🎯','🛡️','⭐','🚀',
];

export function CommentInput({
  channelName,
  placeholder,
  onSubmit,
  autoFocus = false,
  className,
}: CommentInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const authModal = useAuthModal();

  const defaultPlaceholder = channelName
    ? `Message #${channelName}`
    : 'Add a comment...';

  // Generate previews for selected files
  useEffect(() => {
    const newPreviews: string[] = [];
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        newPreviews.push(URL.createObjectURL(file));
      } else {
        newPreviews.push('');
      }
    });
    setPreviews(newPreviews);
    return () => {
      newPreviews.forEach(url => { if (url) URL.revokeObjectURL(url); });
    };
  }, [files]);

  const uploadFiles = useCallback(async (): Promise<UploadedMedia[]> => {
    if (!user || files.length === 0) return [];
    
    const uploaded: UploadedMedia[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      
      const { error } = await supabase.storage
        .from('comment-media')
        .upload(path, file);

      if (error) {
        console.error('Upload error:', error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('comment-media')
        .getPublicUrl(path);

      uploaded.push({
        id: crypto.randomUUID(),
        filePath: path,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        url: urlData.publicUrl,
      });
    }
    return uploaded;
  }, [user, files]);

  const handleSubmit = async () => {
    if (!user) {
      authModal.open('login');
      return;
    }
    if (!value.trim() && files.length === 0) return;

    setUploading(true);
    try {
      const mediaFiles = await uploadFiles();
      onSubmit(value.trim(), mediaFiles.length > 0 ? mediaFiles : undefined);
      setValue('');
      setFiles([]);
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      setFiles(prev => [...prev, ...selected].slice(0, 4)); // Max 4 files
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    setValue(prev => prev + emoji);
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const hasContent = value.trim().length > 0 || files.length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap px-1">
          {files.map((file, i) => (
            <div key={i} className="relative group">
              {previews[i] ? (
                <img
                  src={previews[i]}
                  alt={file.name}
                  className="w-16 h-16 object-cover rounded-lg border border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border border-border bg-muted flex items-center justify-center">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="text-[9px] text-muted-foreground truncate w-16 text-center mt-0.5">
                {file.name}
              </p>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors',
          isFocused && 'border-primary/40 ring-1 ring-primary/20',
        )}
      >
        {/* Plus / expand button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Attach file"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || defaultPlaceholder}
          rows={1}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[28px] max-h-[120px] py-0.5 leading-snug"
        />

        {/* Action icons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="*/*"
            onChange={handleFileSelect}
          />
          <input
            ref={imageInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Add image"
          >
            <Image className="w-4 h-4" />
          </button>

          {/* Emoji Picker */}
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end" side="top">
              <div className="grid grid-cols-6 gap-1">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-accent rounded-md transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Send button - only show when there's content */}
          {hasContent && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              className="w-7 h-7 rounded-md bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground transition-colors disabled:opacity-50"
              aria-label="Send"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
