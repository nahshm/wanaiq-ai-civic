import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, MessageSquare, Reply, Share2, LogIn, Trash2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CommentAwardDisplay } from './CommentAwardDisplay';
import { CommentAwardButton } from './CommentAwardButton';
import { CommentInput, type UploadedMedia } from './CommentInput';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { SafeContentRenderer } from './SafeContentRenderer';
import DeletedComment from './DeletedComment';
import { supabase } from '@/integrations/supabase/client';
import { GlassLightbox } from '@/components/ui/GlassLightbox';
import type { Comment, CommentMedia } from '@/types';

interface CommentSectionProps {
  postId: string;
  comments?: Comment[];
  onAddComment?: (content: string, parentId?: string, mediaFiles?: UploadedMedia[]) => void;
  onVoteComment?: (commentId: string, vote: 'up' | 'down') => void;
  onDeleteComment?: (commentId: string) => void;
}

interface CommentItemProps {
  comment: Comment;
  onReply?: (content: string, parentId: string, mediaFiles?: UploadedMedia[]) => void;
  onVote?: (commentId: string, vote: 'up' | 'down') => void;
  onDelete?: (commentId: string) => void;
  depth?: number;
}

function CommentMediaDisplay({ media }: { media: CommentMedia[] }) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  if (!media || media.length === 0) return null;

  const images = media.filter(m => m.fileType.startsWith('image/'));
  const otherFiles = media.filter(m => !m.fileType.startsWith('image/'));

  const imageUrls = images.map(m => {
    const { data } = supabase.storage.from('comment-media').getPublicUrl(m.filePath);
    return data.publicUrl;
  });

  return (
    <div className="mt-1.5 mb-1">
      {images.length > 0 && (
        <div className={`grid gap-1.5 ${images.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-2 max-w-md'}`}>
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setLightboxSrc(imageUrls[i])}
              className="rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
            >
              <img
                src={imageUrls[i]}
                alt={img.filename}
                className="w-full h-auto max-h-48 object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {otherFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {otherFiles.map(file => {
            const { data } = supabase.storage.from('comment-media').getPublicUrl(file.filePath);
            return (
              <a
                key={file.id}
                href={data.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/50"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{file.filename}</span>
              </a>
            );
          })}
        </div>
      )}

      <GlassLightbox
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}

const CommentItem = ({ comment, onReply, onVote, onDelete, depth = 0 }: CommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleReply = (content: string, mediaFiles?: UploadedMedia[]) => {
    onReply?.(content, comment.id, mediaFiles);
    setIsReplying(false);
    toast({ title: "Reply posted" });
  };

  const handleVote = (vote: 'up' | 'down') => {
    onVote?.(comment.id, vote);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete?.(comment.id);
    setConfirmDelete(false);
  };

  const getVoteScore = () => comment.upvotes - comment.downvotes;
  const maxDepth = 6;
  const shouldShowReplies = depth < maxDepth && comment.replies && comment.replies.length > 0;
  const isOwner = user?.id === comment.author.id;

  const threadColors = [
    'border-primary/30',
    'border-blue-400/30',
    'border-green-400/30',
    'border-amber-400/30',
    'border-purple-400/30',
    'border-pink-400/30',
  ];
  const threadColor = threadColors[depth % threadColors.length];

  if (comment.isDeleted) {
    return (
      <div className={`relative ${depth > 0 ? 'ml-4 pl-3' : ''}`}>
        {depth > 0 && (
          <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full border-l-2 ${threadColor}`} />
        )}
        <DeletedComment />
        {shouldShowReplies && (
          <div>
            {comment.replies!.map((reply) => (
              <CommentItem key={reply.id} comment={reply} onReply={onReply} onVote={onVote} onDelete={onDelete} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${depth > 0 ? 'ml-4 pl-3' : ''}`}>
      {depth > 0 && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full border-l-2 ${threadColor} hover:border-primary cursor-pointer transition-colors`}
          aria-label={isCollapsed ? 'Expand thread' : 'Collapse thread'}
        />
      )}

      <div className="py-2">
        {/* Header */}
        <div className="flex items-center gap-1.5 text-xs mb-1">
          <Avatar className="h-5 w-5">
            <AvatarImage src={comment.author.avatar} />
            <AvatarFallback className="text-[10px]">
              {(comment.author.displayName || comment.author.username || '?')[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-foreground hover:underline cursor-pointer">
            {comment.author.displayName || comment.author.username}
          </span>
          {comment.author.isVerified && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] leading-none">
              {comment.author.role === 'official' ? 'Official' : '✓'}
            </Badge>
          )}
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            {formatDistanceToNow(comment.createdAt, { addSuffix: true }).replace('about ', '')}
          </span>
          {depth === 0 && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-1 text-muted-foreground hover:text-foreground text-[10px] font-mono"
            >
              [{isCollapsed ? '+' : '−'}]
            </button>
          )}
        </div>

        {!isCollapsed && (
          <>
            {/* Content */}
            <SafeContentRenderer
              content={comment.content || ''}
              className="text-sm leading-relaxed text-foreground/90 mb-1.5"
            />

            {/* Media attachments */}
            {comment.media && comment.media.length > 0 && (
              <CommentMediaDisplay media={comment.media} />
            )}

            {/* Awards */}
            {comment.awards && comment.awards.length > 0 && (
              <div className="mb-1">
                <CommentAwardDisplay awards={comment.awards} size="sm" />
              </div>
            )}

            {/* Actions bar */}
            <div className="flex items-center gap-0.5 -ml-1">
              <div className="flex items-center rounded-full bg-muted/50 hover:bg-muted transition-colors">
                <button
                  onClick={() => handleVote('up')}
                  className={`p-1 rounded-l-full transition-colors ${
                    comment.userVote === 'up' ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <span className={`text-xs font-semibold min-w-[20px] text-center ${
                  comment.userVote === 'up' ? 'text-primary' :
                  comment.userVote === 'down' ? 'text-destructive' : 'text-foreground'
                }`}>
                  {getVoteScore()}
                </span>
                <button
                  onClick={() => handleVote('down')}
                  className={`p-1 rounded-r-full transition-colors ${
                    comment.userVote === 'down' ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                  }`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 text-xs px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors font-medium"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>

              <CommentAwardButton commentId={comment.id} userRole={user?.role as any} size="sm" />

              <button className="flex items-center gap-1 text-xs px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors font-medium">
                <Share2 className="h-3 w-3" />
              </button>

              {isOwner && (
                <button
                  onClick={handleDelete}
                  onBlur={() => setConfirmDelete(false)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors font-medium ${
                    confirmDelete
                      ? 'text-destructive bg-destructive/10'
                      : 'text-muted-foreground hover:text-destructive hover:bg-muted/50'
                  }`}
                >
                  <Trash2 className="h-3 w-3" />
                  {confirmDelete ? 'Confirm?' : ''}
                </button>
              )}
            </div>

            {/* Inline reply input */}
            {isReplying && (
              <div className="mt-2 mb-1">
                <CommentInput
                  placeholder={`Reply to ${comment.author.displayName || comment.author.username}...`}
                  onSubmit={(content, media) => handleReply(content, media)}
                  autoFocus
                  className="border-border/60"
                />
                <button
                  onClick={() => setIsReplying(false)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-1 ml-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {shouldShowReplies && !isCollapsed && (
        <div>
          {comment.replies!.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} onVote={onVote} onDelete={onDelete} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentSection = ({ postId, comments = [], onAddComment, onVoteComment, onDeleteComment }: CommentSectionProps) => {
  const [sortBy, setSortBy] = useState<'best' | 'top' | 'new'>('best');
  const { user } = useAuth();
  const authModal = useAuthModal();

  const handleAddComment = (content: string, mediaFiles?: UploadedMedia[]) => {
    onAddComment?.(content, undefined, mediaFiles);
  };

  const handleReply = (content: string, parentId: string, mediaFiles?: UploadedMedia[]) => {
    onAddComment?.(content, parentId, mediaFiles);
  };

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'top':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case 'new':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'best':
      default:
        const scoreA = a.upvotes + a.downvotes > 0 ? a.upvotes / (a.upvotes + a.downvotes) : 0;
        const scoreB = b.upvotes + b.downvotes > 0 ? b.upvotes / (b.upvotes + b.downvotes) : 0;
        return scoreB - scoreA;
    }
  });

  return (
    <div className="space-y-3">
      {!user ? (
        <button
          onClick={() => authModal.open('login')}
          className="w-full flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:border-primary/30 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign in to comment
        </button>
      ) : (
        <CommentInput
          placeholder="Add a comment..."
          onSubmit={handleAddComment}
        />
      )}

      {comments.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-foreground">
            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-0.5">
            {(['best', 'top', 'new'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  sortBy === option
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-border/40">
        {sortedComments.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No comments yet. Be the first to share your thoughts.
            </p>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onVote={onVoteComment}
              onDelete={onDeleteComment}
            />
          ))
        )}
      </div>
    </div>
  );
};
