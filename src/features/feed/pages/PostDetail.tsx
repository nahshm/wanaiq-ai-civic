import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PostCard } from '@/components/posts/PostCard';
import { CommentSection } from '@/components/posts/CommentSection';
import { CommunityInfoCard } from '@/components/posts/CommunityInfoCard';
import { RelatedPostsCard } from '@/components/posts/RelatedPostsCard';
import { useCommunityData } from '@/hooks/useCommunityData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MessageSquare, Eye, TrendingUp, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { useVerification } from '@/hooks/useVerification';
import { copyToClipboard } from '@/lib/clipboard-utils';
import type { Comment, Post, CommentAward, CommentMedia } from '@/types';
import type { UploadedMedia } from '@/components/posts/CommentInput';

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { communities, toggleCommunityFollow } = useCommunityData();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(true);
  
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();

  const { verification } = useVerification({
    contentId: id || '',
    contentType: 'post'
  });

  // Fetch post data from Supabase
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        setPostLoading(true);

        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
            communities!posts_community_id_fkey (id, name, display_name, description, member_count, category, type),
            officials!posts_official_id_fkey (id, name, position),
            post_media!post_media_post_id_fkey (*)
          `)
          .eq('id', id)
          .single();

        if (postError) {
          if (postError.code === 'PGRST116') {
            setPost(null);
          } else {
            throw postError;
          }
          return;
        }

        let userVote: 'up' | 'down' | null = null;
        if (user) {
          const { data: voteData } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('user_id', user.id)
            .eq('post_id', id)
            .maybeSingle();

          if (voteData) {
            userVote = voteData.vote_type as 'up' | 'down';
          }
        }

        const transformedPost: Post = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          author: {
            id: postData.profiles?.id || '',
            username: postData.profiles?.username || 'anonymous',
            displayName: postData.profiles?.display_name || postData.profiles?.username || 'Anonymous User',
            avatar: postData.profiles?.avatar_url,
            isVerified: postData.profiles?.is_verified,
            role: postData.profiles?.role as 'citizen' | 'official' | 'expert' | 'journalist',
          },
          community: postData.communities ? {
            id: postData.communities.id,
            name: postData.communities.name,
            displayName: postData.communities.display_name,
            description: postData.communities.description || '',
            memberCount: postData.communities.member_count || 0,
            category: postData.communities.category as 'governance' | 'civic-education' | 'accountability' | 'discussion',
            type: postData.communities.type as 'location' | 'interest' | undefined,
          } : undefined,
          upvotes: postData.upvotes || 0,
          downvotes: postData.downvotes || 0,
          commentCount: postData.comment_count || 0,
          tags: postData.tags || [],
          createdAt: new Date(postData.created_at),
          userVote,
          contentSensitivity: (postData.content_sensitivity as 'public' | 'sensitive' | 'crisis') || 'public',
          isNgoVerified: postData.is_ngo_verified || false,
          link_url: postData.link_url || null,
          link_title: postData.link_title || null,
          link_description: postData.link_description || null,
          link_image: postData.link_image || null,
          media: postData.post_media?.map((m: any) => ({
            id: m.id.toString(),
            post_id: m.post_id,
            file_path: m.file_path,
            filename: m.filename,
            file_type: m.file_type,
            file_size: m.file_size,
          })) || [],
        };

        setPost(transformedPost);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching post:', error);
        toast({
          title: "Error",
          description: `Failed to load post: ${errorMessage}`,
          variant: "destructive",
        });
        setPost(null);
      } finally {
        setPostLoading(false);
      }
    };

    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useEffect(() => {
    if (post?.title) {
      document.title = post.title;
    } else {
      document.title = 'Post Detail';
    }
  }, [post?.title]);

  // Fetch comments from Supabase
  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;

      try {
        setLoading(true);

        const { data: commentsData, error } = await supabase
          .from('comments')
          .select(`
            *,
            profiles!comments_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
            comment_media!comment_media_comment_id_fkey (id, file_path, filename, file_type, file_size, created_at),
            comment_award_assignments!comment_id (
              id,
              awarded_at,
              comment_awards!award_id (
                id, name, display_name, description, points, category, color, background_color, icon, is_enabled, sort_order, created_at, updated_at
              ),
              profiles!awarded_by (id, display_name)
            )
          `)
          .eq('post_id', id)
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: true });

        if (error) throw error;

        const commentVotes: { [commentId: string]: 'up' | 'down' } = {};
        if (user && commentsData && commentsData.length > 0) {
          const commentIds = commentsData.map(c => c.id);
          const { data: votesData } = await supabase
            .from('votes')
            .select('comment_id, vote_type')
            .eq('user_id', user.id)
            .in('comment_id', commentIds);

          votesData?.forEach(vote => {
            if (vote.comment_id) {
              commentVotes[vote.comment_id] = vote.vote_type as 'up' | 'down';
            }
          });
        }

        const transformedComments: Comment[] = [];
        const commentMap = new Map<string, Comment>();

        commentsData?.forEach(commentData => {
          const userVote = commentVotes[commentData.id] || null;

          const awards: CommentAward[] = commentData.comment_award_assignments?.map((assignment: any) => ({
            id: assignment.comment_awards.id,
            name: assignment.comment_awards.name,
            displayName: assignment.comment_awards.display_name,
            description: assignment.comment_awards.description,
            icon: assignment.comment_awards.icon,
            color: assignment.comment_awards.color,
            backgroundColor: assignment.comment_awards.background_color,
            points: assignment.comment_awards.points,
            category: assignment.comment_awards.category,
            isEnabled: assignment.comment_awards.is_enabled,
            sortOrder: assignment.comment_awards.sort_order,
            createdAt: new Date(assignment.comment_awards.created_at),
            updatedAt: new Date(assignment.comment_awards.updated_at),
            assignedBy: assignment.profiles ? {
              id: assignment.profiles.id,
              username: '',
              displayName: assignment.profiles.display_name,
            } : undefined,
            assignedAt: new Date(assignment.awarded_at),
          })) || [];

          const mediaItems: CommentMedia[] = commentData.comment_media?.map((m: any) => ({
            id: m.id,
            commentId: commentData.id,
            filePath: m.file_path,
            filename: m.filename,
            fileType: m.file_type,
            fileSize: m.file_size || 0,
            uploadedAt: new Date(m.created_at),
          })) || [];

          const comment: Comment = {
            id: commentData.id,
            content: commentData.content,
            author: {
              id: commentData.profiles?.id || '',
              username: commentData.profiles?.username || 'anonymous',
              displayName: commentData.profiles?.display_name || commentData.profiles?.username || 'Anonymous User',
              avatar: commentData.profiles?.avatar_url,
              isVerified: commentData.profiles?.is_verified,
              role: commentData.profiles?.role as 'citizen' | 'official' | 'expert' | 'journalist',
            },
            postId: commentData.post_id,
            parentId: commentData.parent_id,
            createdAt: new Date(commentData.created_at),
            upvotes: commentData.upvotes || 0,
            downvotes: commentData.downvotes || 0,
            userVote,
            depth: commentData.depth || 0,
            isCollapsed: commentData.is_collapsed || false,
            moderationStatus: commentData.moderation_status as 'approved' | 'pending' | 'removed',
            isDeleted: commentData.is_deleted || false,
            awards,
            media: mediaItems,
            replies: []
          };

          commentMap.set(comment.id, comment);

          if (comment.parentId) {
            const parentComment = commentMap.get(comment.parentId);
            if (parentComment) {
              parentComment.replies = parentComment.replies || [];
              parentComment.replies.push(comment);
            }
          } else {
            transformedComments.push(comment);
          }
        });

        setComments(transformedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: "Error",
          description: "Failed to load comments",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);


  const handleAddComment = async (content: string, parentId?: string, mediaFiles?: UploadedMedia[]) => {
    if (!user) {
      authModal.open('login');
      return;
    }

    try {
      let depth = 0;
      if (parentId) {
        const findDepth = (comments: Comment[]): number => {
          for (const c of comments) {
            if (c.id === parentId) return c.depth + 1;
            if (c.replies) {
              const d = findDepth(c.replies);
              if (d > 0) return d;
            }
          }
          return 0;
        };
        depth = findDepth(comments);
      }

      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          post_id: id,
          parent_id: parentId || null,
          content,
          author_id: user.id,
          depth,
          moderation_status: 'approved',
          upvotes: 0,
          downvotes: 0,
          is_collapsed: false
        })
        .select('id')
        .single();

      if (error) throw error;

      // Insert comment media records if any
      if (mediaFiles && mediaFiles.length > 0 && newComment) {
        const mediaRecords = mediaFiles.map(m => ({
          comment_id: newComment.id,
          file_path: m.filePath,
          filename: m.filename,
          original_filename: m.filename,
          file_type: m.fileType.startsWith('image/') ? 'image' : m.fileType.startsWith('video/') ? 'video' : 'document',
          mime_type: m.fileType,
          file_size: m.fileSize,
        }));
        await supabase.from('comment_media').insert(mediaRecords);
      }

      if (error) throw error;

      // Update comment count
      await supabase
        .from('posts')
        .update({ comment_count: (post?.commentCount || 0) + 1 })
        .eq('id', id);

      setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);

      // Refetch comments
      const { data: commentsData, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
          comment_media!comment_media_comment_id_fkey (id, file_path, filename, file_type, file_size, created_at),
          comment_award_assignments!comment_id (
            id, awarded_at,
            comment_awards!award_id (id, name, display_name, description, points, category, color, background_color, icon, is_enabled, sort_order, created_at, updated_at),
            profiles!awarded_by (id, display_name)
          )
        `)
        .eq('post_id', id)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const commentVotes: { [commentId: string]: 'up' | 'down' } = {};
      if (commentsData && commentsData.length > 0) {
        const commentIds = commentsData.map(c => c.id);
        const { data: votesData } = await supabase
          .from('votes')
          .select('comment_id, vote_type')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        votesData?.forEach(vote => {
          if (vote.comment_id) {
            commentVotes[vote.comment_id] = vote.vote_type as 'up' | 'down';
          }
        });
      }

      const transformedComments: Comment[] = [];
      const commentMap = new Map<string, Comment>();

      commentsData?.forEach(commentData => {
        const userVote = commentVotes[commentData.id] || null;

        const awards: CommentAward[] = commentData.comment_award_assignments?.map((assignment: any) => ({
          id: assignment.comment_awards.id,
          name: assignment.comment_awards.name,
          displayName: assignment.comment_awards.display_name,
          description: assignment.comment_awards.description,
          icon: assignment.comment_awards.icon,
          color: assignment.comment_awards.color,
          backgroundColor: assignment.comment_awards.background_color,
          points: assignment.comment_awards.points,
          category: assignment.comment_awards.category,
          isEnabled: assignment.comment_awards.is_enabled,
          sortOrder: assignment.comment_awards.sort_order,
          createdAt: new Date(assignment.comment_awards.created_at),
          updatedAt: new Date(assignment.comment_awards.updated_at),
          assignedBy: assignment.profiles ? {
            id: assignment.profiles.id,
            username: '',
            displayName: assignment.profiles.display_name,
          } : undefined,
          assignedAt: new Date(assignment.awarded_at),
        })) || [];

        const mediaItems: CommentMedia[] = commentData.comment_media?.map((m: any) => ({
          id: m.id,
          commentId: commentData.id,
          filePath: m.file_path,
          filename: m.filename,
          fileType: m.file_type,
          fileSize: m.file_size || 0,
          uploadedAt: new Date(m.created_at),
        })) || [];

        const comment: Comment = {
          id: commentData.id,
          content: commentData.content,
          author: {
            id: commentData.profiles?.id || '',
            username: commentData.profiles?.username || 'anonymous',
            displayName: commentData.profiles?.display_name || commentData.profiles?.username || 'Anonymous User',
            avatar: commentData.profiles?.avatar_url,
            isVerified: commentData.profiles?.is_verified,
            role: commentData.profiles?.role as 'citizen' | 'official' | 'expert' | 'journalist',
          },
          postId: commentData.post_id,
          parentId: commentData.parent_id,
          createdAt: new Date(commentData.created_at),
          upvotes: commentData.upvotes || 0,
          downvotes: commentData.downvotes || 0,
          userVote,
          depth: commentData.depth || 0,
          isCollapsed: commentData.is_collapsed || false,
          moderationStatus: commentData.moderation_status as 'approved' | 'pending' | 'removed',
          isDeleted: commentData.is_deleted || false,
          awards,
          media: mediaItems,
          replies: []
        };

        commentMap.set(comment.id, comment);

        if (comment.parentId) {
          const parentComment = commentMap.get(comment.parentId);
          if (parentComment) {
            parentComment.replies = parentComment.replies || [];
            parentComment.replies.push(comment);
          }
        } else {
          transformedComments.push(comment);
        }
      });

      setComments(transformedComments);
      toast({ title: "Comment posted" });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    }
  };

  const handleVoteComment = async (commentId: string, vote: 'up' | 'down') => {
    if (!user) {
      authModal.open('login');
      return;
    }

    try {
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === vote) {
          await supabase.from('votes').delete().eq('id', existingVote.id);
        } else {
          await supabase.from('votes').update({ vote_type: vote }).eq('id', existingVote.id);
        }
      } else {
        await supabase.from('votes').insert({
          user_id: user.id,
          comment_id: commentId,
          vote_type: vote,
        });
      }

      // Update local state recursively
      const updateVoteInComments = (comments: Comment[]): Comment[] =>
        comments.map(comment => {
          if (comment.id === commentId) {
            const currentVote = comment.userVote;
            let newUpvotes = comment.upvotes;
            let newDownvotes = comment.downvotes;
            let newUserVote: 'up' | 'down' | null = vote;

            if (currentVote === 'up') newUpvotes--;
            if (currentVote === 'down') newDownvotes--;

            if (currentVote === vote) {
              newUserVote = null;
            } else {
              if (vote === 'up') newUpvotes++;
              if (vote === 'down') newDownvotes++;
            }

            return { ...comment, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote };
          }

          if (comment.replies) {
            return { ...comment, replies: updateVoteInComments(comment.replies) };
          }

          return comment;
        });

      setComments(prev => updateVoteInComments(prev));
    } catch (error) {
      console.error('Error voting on comment:', error);
      toast({ title: "Error", description: "Failed to vote", variant: "destructive" });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true, content: '[deleted]' })
        .eq('id', commentId)
        .eq('author_id', user.id);

      if (error) throw error;

      // Update local state recursively
      const markDeleted = (comments: Comment[]): Comment[] =>
        comments.map(c => {
          if (c.id === commentId) return { ...c, isDeleted: true, content: '[deleted]' };
          if (c.replies) return { ...c, replies: markDeleted(c.replies) };
          return c;
        });

      setComments(prev => markDeleted(prev));
      toast({ title: "Comment deleted" });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" });
    }
  };

  // PostCard handles DB calls for voting — this only updates parent state for sidebar stats
  const handleVote = (_postId: string, _voteType: 'up' | 'down') => {
    // PostCard manages optimistic UI + Supabase calls internally.
  };


  // Loading skeleton
  if (postLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-8 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-2">Post Not Found</h1>
        <p className="text-sm text-muted-foreground mb-4">
          This post doesn't exist or has been removed.
        </p>
        <Button asChild size="sm">
          <Link to="/">Return to Feed</Link>
        </Button>
      </div>
    );
  }

  const voteScore = post.upvotes - post.downvotes;
  const upvoteRatio = post.upvotes + post.downvotes > 0
    ? Math.round((post.upvotes / (post.upvotes + post.downvotes)) * 100)
    : 0;

  return (
    <div className="h-full bg-background">
      <div className="flex h-full">
        {/* Main content - scrollable */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Link
                to={post.community ? `/c/${post.community.name}` : "/"}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{post.community ? `c/${post.community.name}` : 'Feed'}</span>
              </Link>
            </div>

            {/* Post content rendered by PostCard in detail mode */}
            <div className="mb-4">
              <PostCard
                post={post}
                onVote={handleVote}
                isDetailView={true}
              />
            </div>


            <Separator className="mb-6" />

            {/* Comments */}
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <CommentSection
                postId={post.id}
                comments={comments}
                onAddComment={handleAddComment}
                onVoteComment={handleVoteComment}
                onDeleteComment={handleDeleteComment}
              />
            )}

            {/* Bottom spacer */}
            <div className="h-12" />
          </div>
        </div>

        {/* Right sidebar - desktop only */}
        <aside className="hidden xl:block w-80 flex-shrink-0 border-l border-border">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Compact post stats */}
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post Stats</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className={`text-lg font-bold ${voteScore > 0 ? 'text-primary' : voteScore < 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {voteScore > 0 ? '+' : ''}{voteScore}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Score</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{post.commentCount}</p>
                    <p className="text-[10px] text-muted-foreground">Comments</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{upvoteRatio}%</p>
                    <p className="text-[10px] text-muted-foreground">Upvoted</p>
                  </div>
                </div>
              </div>

              {/* Community Info Card */}
              {post.community && (
                <CommunityInfoCard community={post.community} />
              )}

              {/* Related Posts */}
              <RelatedPostsCard
                postId={post.id}
                communityId={post.community?.id}
                tags={post.tags}
              />
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
};

export default PostDetail;
