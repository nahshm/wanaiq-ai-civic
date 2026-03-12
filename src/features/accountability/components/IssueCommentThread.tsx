import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GlassLightbox } from '@/components/ui/GlassLightbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SupportIssueDialog } from './SupportIssueDialog';

interface Comment {
  id: string;
  comment: string;
  media_urls: string[];
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface IssueCommentThreadProps {
  actionId: string;
  supportCount: number;
  hasSupported: boolean;
  isOwnIssue: boolean;
  /** Called when support state changes so parent can sync */
  onSupportToggle: () => void;
}

const QUERY_KEY = (id: string) => ['issue-comments', id];

const CommentCard: React.FC<{ comment: Comment }> = ({ comment }) => {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const initials = (comment.profiles.display_name || comment.profiles.username).charAt(0).toUpperCase();

  return (
    <div className="flex gap-3 py-3 border-b border-border/40 last:border-0">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarImage src={comment.profiles.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">
            {comment.profiles.display_name || comment.profiles.username}
          </span>
          <span className="text-[11px] text-muted-foreground">@{comment.profiles.username}</span>
          <span className="text-[11px] text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{comment.comment}</p>
        {comment.media_urls.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
              {comment.media_urls.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxSrc(url)}
                className="w-24 h-24 rounded-lg overflow-hidden border border-border/60 hover:opacity-90 transition-opacity"
              >
                <img src={url} alt={`evidence-${i}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <GlassLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
};

export const IssueCommentThread: React.FC<IssueCommentThreadProps> = ({
  actionId, supportCount, hasSupported, isOwnIssue, onSupportToggle
}) => {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: comments, isLoading, isError } = useQuery<Comment[]>({
    queryKey: QUERY_KEY(actionId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('civic_issue_comments')
        .select(`
          id, comment, media_urls, created_at,
          profiles:user_id (username, display_name, avatar_url)
        `)
        .eq('action_id', actionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Comment[];
    },
    enabled: !!actionId,
    staleTime: 60 * 1000,
  });

  const handleOpenDialog = () => {
    if (!user) { authModal.open('login'); return; }
    setDialogOpen(true);
  };

  const handleSupported = () => {
    onSupportToggle();
    // Refresh comment thread
    queryClient.invalidateQueries({ queryKey: QUERY_KEY(actionId) });
  };

  const commentCount = comments?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Community voice header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          Community Voices
          {commentCount > 0 && (
            <Badge variant="secondary" className="text-xs">{commentCount}</Badge>
          )}
        </h3>
        {!isOwnIssue && !hasSupported && (
          <Button size="sm" onClick={handleOpenDialog} className="gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            Add Your Experience
          </Button>
        )}
        {!isOwnIssue && hasSupported && (
          <Button size="sm" variant="outline" onClick={handleOpenDialog} className="gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            Add More Evidence
          </Button>
        )}
      </div>

      {/* Support count summary */}
      {supportCount > 0 && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-2.5 text-sm">
          <span className="font-semibold text-primary">{supportCount}</span>
          <span className="text-muted-foreground ml-1">
            {supportCount === 1 ? 'person has' : 'people have'} this issue too.{' '}
            {commentCount > 0 && `${commentCount} shared their experience.`}
          </span>
        </div>
      )}

      {/* Comment list */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          Could not load community experiences.
        </div>
      )}

      {!isLoading && !isError && comments?.length === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No community experiences yet. Be the first to add yours.
        </div>
      )}

      {!isLoading && !isError && comments && comments.length > 0 && (
        <div className="divide-y divide-border/30 rounded-xl border border-border/40 overflow-hidden bg-card px-4">
          {comments.map(c => <CommentCard key={c.id} comment={c} />)}
        </div>
      )}

      <SupportIssueDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        actionId={actionId}
        onSupported={handleSupported}
      />
    </div>
  );
};
