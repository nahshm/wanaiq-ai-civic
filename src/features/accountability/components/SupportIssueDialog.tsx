import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, Upload, X, ImageIcon, Loader2 } from 'lucide-react';

interface SupportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionId: string;
  /** Called after successful support/insert so parent can refresh state */
  onSupported: () => void;
}

const MAX_PHOTOS = 3;
const MAX_FILE_MB = 10;

export const SupportIssueDialog: React.FC<SupportIssueDialogProps> = ({
  open, onOpenChange, actionId, onSupported
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [comment, setComment] = useState('');
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - previewFiles.length;
    const allowed = selected.slice(0, remaining);

    const oversized = allowed.filter(f => f.size > MAX_FILE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      toast({ title: 'File too large', description: `Max ${MAX_FILE_MB}MB per image.`, variant: 'destructive' });
      return;
    }

    const newPreviews = allowed.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPreviewFiles(prev => [...prev, ...newPreviews]);
    // reset input so the same file can be re-added after removal
    e.target.value = '';
  }, [previewFiles.length, toast]);

  const removeFile = (index: number) => {
    setPreviewFiles(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!user || previewFiles.length === 0) return [];
    setUploading(true);
    const urls: string[] = [];

    for (const { file } of previewFiles) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/comments/${actionId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('issue-media').upload(path, file, { upsert: false });
      if (error) throw new Error(`Upload failed: ${error.message}`);
      const { data: { publicUrl } } = supabase.storage.from('issue-media').getPublicUrl(path);
      urls.push(publicUrl);
    }

    setUploading(false);
    return urls;
  };

  const handleJustSupport = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('civic_action_supporters')
        .insert({ action_id: actionId, user_id: user.id });
      if (error && error.code !== '23505') throw error; // ignore duplicate
      onSupported();
      onOpenChange(false);
      toast({ title: '👍 Support recorded!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not record support.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupportWithEvidence = async () => {
    if (!user || !comment.trim()) return;
    setSubmitting(true);
    try {
      const mediaUrls = await uploadPhotos();

      // Insert supporter row (ignore duplicate)
      await supabase
        .from('civic_action_supporters')
        .insert({ action_id: actionId, user_id: user.id })
        .throwOnError();

      // Insert comment
      const { error: commentError } = await (supabase as any)
        .from('civic_issue_comments')
        .insert({ action_id: actionId, user_id: user.id, comment: comment.trim(), media_urls: mediaUrls });
      if (commentError) throw commentError;

      onSupported();
      onOpenChange(false);
      toast({ title: '✅ Evidence added!', description: 'Your experience has been added to the issue.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmitEvidence = comment.trim().length > 10;
  const isWorking = uploading || submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-primary" />
            Support This Issue
          </DialogTitle>
          <DialogDescription>
            You can just support, or add your experience + photos to strengthen the case.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Comment textarea */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Describe your experience <span className="text-muted-foreground">(optional)</span></label>
            <Textarea
              placeholder="e.g. The water has been cut for 2 weeks at my location. I saw workers trying to fix a pipe but left without resolving it..."
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              disabled={isWorking}
              className="resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              Min. 10 characters required to add evidence. {comment.length}/500
            </p>
          </div>

          {/* Photo upload strip */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add photos <span className="text-muted-foreground">(up to {MAX_PHOTOS})</span></label>
            <div className="flex gap-2 flex-wrap">
              {previewFiles.map((pf, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border/60 group">
                  <img src={pf.preview} alt={`photo-${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={isWorking}
                    className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {previewFiles.length < MAX_PHOTOS && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <ImageIcon className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-[10px] text-muted-foreground">Add photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isWorking}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleJustSupport}
            disabled={isWorking}
            className="sm:order-1 flex-1"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ThumbsUp className="w-4 h-4 mr-2" />}
            Just Support
          </Button>
          <Button
            onClick={handleSupportWithEvidence}
            disabled={!canSubmitEvidence || isWorking}
            className="sm:order-2 flex-1"
          >
            {isWorking ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Uploading...' : 'Support + Add Evidence'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
