import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, MessageCircle, Share, MoreHorizontal, Bookmark, Edit, Trash2, MessageSquare, AlertTriangle, AlertOctagon, BadgeCheck, Shield, ChevronDown, ChevronUp, Smile, Eye, ThumbsUp, ThumbsDown, Play, Pause, Volume2, VolumeX, Maximize2, Image as ImageIcon, Film, FileText, ExternalLink, Bell, EyeOff, X, Flag } from 'lucide-react';
import { VerifiedBadge, OfficialPositionBadge } from '@/components/ui/verified-badge';
import { CIVIC_FLAIRS } from '@/config/flairs';
import { SafeContentRenderer } from './SafeContentRenderer';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { buildProfileLink } from '@/lib/profile-links';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import SentimentBar from '@/components/verification/SentimentBar';
import { GlassLightbox } from '@/components/ui/GlassLightbox';
interface PostCardProps {
  post: Post;
  onVote: (postId: string, vote: 'up' | 'down') => void;
  isDetailView?: boolean;
  viewMode?: 'card' | 'compact';
  isMember?: boolean; // NEW: Is user a member of this post's community?
  onJoinCommunity?: (communityId: string, communityName: string) => void; // NEW: Callback to join community
}
export const PostCard = ({
  post,
  onVote,
  isDetailView = false,
  viewMode = 'card',
  isMember = true,
  // Default true for backwards compatibility
  onJoinCommunity
}: PostCardProps) => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const authModal = useAuthModal();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(isDetailView);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const secondVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSecondPlaying, setIsSecondPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSavedTooltip, setShowSavedTooltip] = useState(false);

  // Local optimistic state for voting
  const [localVote, setLocalVote] = useState<typeof post.userVote>(post.userVote);
  const [localScore, setLocalScore] = useState((post.upvotes || 0) - (post.downvotes || 0));

  useEffect(() => {
    setLocalVote(post.userVote);
    setLocalScore((post.upvotes || 0) - (post.downvotes || 0));
  }, [post.userVote, post.upvotes, post.downvotes]);

  const handleVoteAction = async (voteType: 'up' | 'down') => {
    if (!user) {
      authModal.open('login');
      return;
    }

    // Optimistic toggle
    const isRemovingVote = localVote === voteType;
    let scoreDiff = 0;

    if (isRemovingVote) {
      setLocalVote(null);
      scoreDiff = voteType === 'up' ? -1 : 1;
    } else {
      scoreDiff = localVote === 'up' && voteType === 'down' ? -2 :
                  localVote === 'down' && voteType === 'up' ? 2 :
                  voteType === 'up' ? 1 : -1;
      setLocalVote(voteType);
    }
    
    setLocalScore(prev => prev + scoreDiff);

    // If there's a parent handler passed down, call it too just in case it wants to do anything
    if (onVote) {
      onVote(post.id, isRemovingVote ? null as any : voteType);
    }

    try {
      if (isRemovingVote) {
        await supabase.from('votes').delete().eq('post_id', post.id).eq('user_id', user.id);
      } else {
        // Find existing vote to update or insert new one
        const { data: existingVote } = await supabase.from('votes').select('vote_type').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
        
        if (existingVote) {
            await supabase.from('votes').update({ vote_type: voteType }).eq('post_id', post.id).eq('user_id', user.id);
        } else {
            await supabase.from('votes').insert({ post_id: post.id, user_id: user.id, vote_type: voteType });
        }
      }
    } catch (e) {
      console.error('Vote failed', e);
      // Revert optimism if failed
      setLocalVote(localVote);
      setLocalScore(prev => prev - scoreDiff);
      toast({
        title: 'Error',
        description: 'Failed to register your vote.',
        variant: 'destructive',
      });
    }
  };

  // Handle bookmark/save with tooltip
  const handleSave = async () => {
    if (!user) {
      authModal.open('login');
      return;
    }
    
    // Optimistic update
    const newIsSaved = !isSaved;
    setIsSaved(newIsSaved);
    
    // Prepare for toast notification
    if (newIsSaved) {
      setShowSavedTooltip(true);
      setTimeout(() => setShowSavedTooltip(false), 2000);
      toast({
        title: '🔖 Saved!',
        description: 'Post saved to your collection.',
        duration: 2000
      });
    } else {
      toast({
        title: '🔖 Removed',
        description: 'Post removed from your saved items.',
        duration: 2000
      });
    }

    try {
      if (newIsSaved) {
        // Insert into saved_items
        const { error } = await supabase.from('saved_items').insert({
          user_id: user.id,
          item_type: 'post',
          item_id: post.id
        });
        if (error) throw error;
      } else {
        // Remove from saved_items
        const { error } = await supabase.from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'post')
          .eq('item_id', post.id);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving post:', error);
      // Revert optimistic update on failure
      setIsSaved(!newIsSaved);
      toast({
        title: 'Error',
        description: 'Could not update saved status.',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}${getPostLink()}`;
    const shareData = {
      title: post.title || 'Civic Post',
      text: `Check out this post on WanaIQ: ${post.title}`,
      url: postUrl
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(postUrl);
        toast({
          title: 'Link Copied',
          description: 'Post link copied to clipboard.',
        });
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  // Safe date formatting helper to prevent "Invalid time value" errors
  const formatPostDate = (dateInput: Date | string | undefined): string => {
    if (!dateInput) return 'Unknown time';
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(date.getTime())) return 'Unknown time';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      // Compact format like Reddit/Twitter
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'}`;
      if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'}`;
      if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
      if (diffMonths < 12) return `${diffMonths} mo${diffMonths === 1 ? '' : 's'}`;
      return `${diffYears} yr${diffYears === 1 ? '' : 's'}`;
    } catch {
      return 'Unknown time';
    }
  };

  // Verify author is current user

  const isAuthor = user && post.author.id === user.id;

  // Helper to get the correct post link based on community context
  const getPostLink = () => {
    if (post.community?.name) {
      return `/c/${post.community.name}/post/${post.id}`;
    }
    return `/post/${post.id}`;
  };
  const handleDelete = async () => {
    if (!user || !isAuthor) return;
    setIsDeleting(true);
    try {
      // Delete associated media first
      if (post.media && post.media.length > 0) {
        const {
          error: mediaError
        } = await supabase.from('post_media').delete().eq('post_id', post.id);
        if (mediaError) {
          console.error('Error deleting media:', mediaError);
        }

        // Delete files from storage
        for (const media of post.media) {
          await supabase.storage.from('media').remove([media.file_path]);
        }
      }

      // Delete the post
      const {
        error
      } = await supabase.from('posts').delete().eq('id', post.id).eq('author_id', user.id); // Extra safety check

      if (error) throw error;
      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted."
      });

      // Navigate away if on post detail page
      if (isDetailView) {
        navigate('/');
      } else {
        // Trigger a refresh of the parent component
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto-pause videos when scrolled out of view OR tab is hidden
  useEffect(() => {
    const videos = [{
      ref: videoRef,
      setPlaying: setIsPlaying
    }, {
      ref: secondVideoRef,
      setPlaying: setIsSecondPlaying
    }].filter((v) => v.ref.current);
    if (videos.length === 0) return;

    // Tab visibility handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        videos.forEach(({
          ref,
          setPlaying
        }) => {
          if (ref.current && !ref.current.paused) {
            ref.current.pause();
            setPlaying(false);
          }
        });
      }
    };

    // Intersection Observer - pause when scrolled out of view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        videos.forEach(({
          ref,
          setPlaying
        }) => {
          if (ref.current && ref.current.contains(entry.target as Node)) {
            if (!entry.isIntersecting && !ref.current.paused) {
              // Video scrolled out of view - pause it
              ref.current.pause();
              setPlaying(false);
            }
          }
        });
      });
    }, {
      threshold: 0.5
    } // Pause when less than 50% visible
    );

    // Observe all videos
    videos.forEach(({
      ref
    }) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Toggle play/pause on video click
  const toggleVideoPlay = (videoElement: HTMLVideoElement | null, setPlaying: (playing: boolean) => void) => {
    if (!videoElement) return;
    if (videoElement.paused) {
      videoElement.play();
      setPlaying(true);
    } else {
      videoElement.pause();
      setPlaying(false);
    }
  };

  // Handle community data that might be under 'community' or 'community_id' alias
  const communityData = post.community || (post as any).community_id;
  const getVoteScore = () => localScore;
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'official':
        return 'bg-civic-blue/10 text-civic-blue border-civic-blue/20';
      case 'expert':
        return 'bg-civic-green/10 text-civic-green border-civic-green/20';
      case 'journalist':
        return 'bg-civic-orange/10 text-civic-orange border-civic-orange/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const formatNumber = (num?: number | null) => {
    if (num == null) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Helper to render badges for content sensitivity (matching form design)
  const renderSpecialBadges = () => {
    const badges = [];
    // Map content sensitivity to badges with icons matching the form
    if (post.contentSensitivity === 'crisis') {
      badges.push(<Badge key="crisis" variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1">
          <AlertOctagon className="w-3 h-3" />
          Crisis Report
        </Badge>);
    } else if (post.contentSensitivity === 'sensitive') {
      badges.push(<Badge key="sensitive" variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Sensitive Topic
        </Badge>);
    } else if (post.contentSensitivity === 'public') {
      badges.push(<Badge key="public" variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          Public Discussion
        </Badge>);
    }
    if (post.isNgoVerified) {
      badges.push(<Badge key="verified" variant="outline" className="flex items-center gap-1">
          <BadgeCheck className="w-3 h-3 text-blue-500" />
          NGO VERIFIED
        </Badge>);
    }
    return badges.length > 0 ? <div className="flex flex-wrap gap-1 mb-2">
        {badges}
      </div> : null;
  };

  // Helper to render media (used in both views)
  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;
    return <div className="mb-3">
        {post.media.length === 1 ? <div className="relative w-full flex justify-center overflow-hidden border border-sidebar-border bg-black/5 rounded-xl group">
            {/* Blurred Background Layer - Absolute to fill the container defined by foreground */}
            <div className="absolute inset-0 z-0 opacity-60">
                {post.media[0].file_type?.startsWith('image/') ?
          <img
            src={supabase.storage.from('media').getPublicUrl(post.media[0].file_path).data.publicUrl}
            alt=""
            className="w-full h-full object-cover blur-2xl scale-110"
            aria-hidden="true" /> :

          post.media[0].file_type?.startsWith('video/') ?
          <video
            src={supabase.storage.from('media').getPublicUrl(post.media[0].file_path).data.publicUrl}
            className="w-full h-full object-cover blur-2xl scale-110"
            muted
            aria-hidden="true" /> :

          null}
            </div>

            {/* Foreground Content - Flex centered, dictates container height via max-height */}
            <div className="relative z-10 w-full flex justify-center">
              {post.media[0].file_type?.startsWith('image/') ?
          <img
            src={supabase.storage.from('media').getPublicUrl(post.media[0].file_path).data.publicUrl}
            alt="Post media"
            loading="lazy"
            onClick={(e) => { e.stopPropagation(); setLightboxSrc(supabase.storage.from('media').getPublicUrl(post.media[0].file_path).data.publicUrl); }}
            className="block w-auto h-auto max-w-full max-h-[500px] object-contain drop-shadow-md rounded-xl transition-transform duration-500 group-hover:scale-[1.01] cursor-zoom-in" /> :

          post.media[0].file_type?.startsWith('video/') ?
          <div className="relative w-auto h-auto max-w-full max-h-[500px] flex items-center justify-center" onClick={() => toggleVideoPlay(videoRef.current, setIsPlaying)}>
                  <video
              ref={videoRef}
              src={supabase.storage.from('media').getPublicUrl(post.media[0].file_path).data.publicUrl}
              className="block w-auto h-auto max-w-full max-h-[500px] object-contain rounded-xl"
              playsInline />

                  {!isPlaying && <div className="absolute inset-0 flex items-center justify-center bg-black/20 m-auto pointer-events-none">
                      <div className="bg-white/90 rounded-full p-4 shadow-lg backdrop-blur-sm">
                        <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>}
              </div> :
          null}
            </div>
          </div> : <div className="grid grid-cols-2 gap-2">
            {post.media.slice(0, 4).map((media, index) => <div key={media.id} className="rounded-xl overflow-hidden border border-sidebar-border relative">
                {media.file_type?.startsWith('image/') ? <img
                  src={supabase.storage.from('media').getPublicUrl(media.file_path).data.publicUrl}
                  alt={`Post media ${index + 1}`}
                  loading="lazy"
                  onClick={(e) => { e.stopPropagation(); setLightboxSrc(supabase.storage.from('media').getPublicUrl(media.file_path).data.publicUrl); }}
                  className="w-full h-32 object-cover rounded-xl cursor-zoom-in" /> : media.file_type?.startsWith('video/') ? <div className="relative cursor-pointer h-full" onClick={() => toggleVideoPlay(secondVideoRef.current, setIsSecondPlaying)}>
                    <video ref={index === 0 ? secondVideoRef : undefined} src={supabase.storage.from('media').getPublicUrl(media.file_path).data.publicUrl} className="w-full h-32 object-cover rounded-xl" playsInline />
                    {index === 0 && !isSecondPlaying && <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-white/90 rounded-full p-2">
                          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>}
                  </div> : null}
              </div>)}
          </div>}
      </div>;
  };

  // Helper to render link preview (for link-type posts)
  const renderLinkPreview = () => {
    if (!post.link_url) return null;

    let hostname = '';
    try {
      hostname = new URL(post.link_url).hostname;
    } catch {/* ignore */}

    // Detect embeddable platforms
    const getEmbedConfig = (url: string) => {
      try {
        const urlObj = new URL(url);

        // YouTube
        if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
          let videoId = '';
          if (urlObj.hostname.includes('youtu.be')) {
            videoId = urlObj.pathname.slice(1);
          } else {
            videoId = urlObj.searchParams.get('v') || '';
          }
          if (videoId) {
            return {
              type: 'youtube',
              url: `https://www.youtube.com/embed/${videoId}`,
              platform: 'YouTube'
            };
          }
        }

        // TikTok
        if (urlObj.hostname.includes('tiktok.com')) {
          const videoMatch = url.match(/video\/(\d+)/);
          if (videoMatch) {
            return {
              type: 'tiktok',
              url: `https://www.tiktok.com/embed/v2/${videoMatch[1]}`,
              platform: 'TikTok'
            };
          }
        }

        // X/Twitter
        if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
          return {
            type: 'x',
            url: `https://platform.twitter.com/embed/Tweet.html?url=${encodeURIComponent(url)}`,
            platform: 'X'
          };
        }
      } catch {/* ignore */}
      return null;
    };

    const embed = getEmbedConfig(post.link_url);

    return (
      <div className="mb-3">
        {/* Embedded video/media frame */}
        {embed &&
        <div className="rounded-xl overflow-hidden border border-sidebar-border mb-2 bg-black/5 flex justify-center">
            {embed.type === 'youtube' &&
          <div className="w-full aspect-video rounded-xl overflow-hidden">
                <iframe
              src={embed.url}
              className="w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video player" />

              </div>
          }
            
            {embed.type === 'tiktok' &&
          <div className="h-[550px] aspect-[9/16] my-2 shadow-sm">
                <iframe
              src={embed.url}
              className="w-full h-full rounded-md"
              allow="encrypted-media;"
              allowFullScreen
              title="TikTok video player" />

              </div>
          }

            {embed.type === 'x' &&
          <div className="w-full max-w-[500px] rounded-xl overflow-hidden">
                <iframe
              src={embed.url}
              className="w-full h-[500px] rounded-xl" // Initial height, X embeds usually resize themselves but iframe needs base height
              title="X post" />

              </div>
          }
          </div>
        }

        {/* OG card preview (shown below embed or as standalone) */}
        {!embed &&
        <a
          href={post.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden border border-sidebar-border hover:border-primary/40 transition-colors group/link"
          onClick={(e) => e.stopPropagation()}>

            {post.link_image &&
          <div className="relative w-full h-40 bg-muted overflow-hidden">
                <img
              src={post.link_image}
              alt={post.link_title || 'Link preview'}
              className="w-full h-full object-cover group-hover/link:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />

              </div>
          }
            <div className="p-3 bg-muted/30">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <ExternalLink className="w-3 h-3" />
                <span>{hostname}</span>
              </div>
              {post.link_title &&
            <h4 className="font-semibold text-sm line-clamp-2 text-foreground group-hover/link:text-primary transition-colors">
                  {post.link_title}
                </h4>
            }
              {post.link_description &&
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {post.link_description}
                </p>
            }
              {!post.link_title && !post.link_description &&
            <p className="text-sm text-primary truncate">{post.link_url}</p>
            }
            </div>
          </a>
        }
      </div>);

  };
  if (viewMode === 'compact') {
    return <div className="flex hover:bg-sidebar-accent/50 transition-colors border-b border-sidebar-border">
        {/* Vote Column */}
        <div className="flex flex-col items-center p-2 w-12 bg-sidebar-background/50">
          <Button variant="ghost" size="sm" aria-label={`Upvote post: ${post.title}`} aria-pressed={localVote === 'up'} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVoteAction('up'); }} className={`h-6 w-6 p-0 ${localVote === 'up' ? 'text-civic-green bg-civic-green/10' : 'text-sidebar-muted-foreground hover:text-civic-green'}`}>
            <ArrowUp className="w-4 h-4" />
          </Button>
          <span className="text-xs font-medium text-sidebar-foreground py-1">
            {formatNumber(getVoteScore())}
          </span>
          <Button variant="ghost" size="sm" aria-label="Downvote post" aria-pressed={localVote === 'down'} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVoteAction('down'); }} className={`h-6 w-6 p-0 ${localVote === 'down' ? 'text-civic-red bg-civic-red/10' : 'text-sidebar-muted-foreground hover:text-civic-red'}`}>
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center space-x-2 text-xs text-sidebar-muted-foreground mb-1">
            {communityData ? <Link to={`/c/${communityData.name}`} className="hover:underline font-medium">
                c/{communityData.name}
              </Link> : <span className="font-medium">Profile Post</span>}
            <span>•</span>
            <span>by</span>
            <Link to={buildProfileLink({ username: post.author.username || post.author.displayName || 'anonymous', is_verified: post.author.isVerified, official_position: post.author.officialPosition })} className="hover:underline">
              u/{post.author.displayName || post.author.username || 'Anonymous'}
            </Link>
            <span>•</span>
            <span>{formatPostDate(post.createdAt)} ago</span>
          </div>

          {renderSpecialBadges()}

          <Link to={getPostLink()} className="block group">
            <h3 className="font-medium text-sidebar-foreground group-hover:text-primary line-clamp-2 mb-1">
              {post.title}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
            {/* Comments Pill */}
            <Link to={getPostLink()} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/60 transition-colors rounded-full px-3 h-8 text-muted-foreground hover:text-foreground group text-decoration-none">
              <MessageCircle className="w-4 h-4 stroke-[1.5]" />
              <span className="text-xs font-bold">{formatNumber(post.commentCount)}</span>
            </Link>

            {/* Share Pill */}
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(); }} className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/60 transition-colors rounded-full px-3.5 h-9 text-muted-foreground hover:text-foreground">
              <Share className="w-5 h-5 stroke-[1.5]" />
              <span className="text-xs font-bold hidden sm:inline">Share</span>
            </button>

            {/* Save Pill */}
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(); }} className={`flex items-center gap-1.5 rounded-full px-3 h-8 transition-colors ${isSaved ? 'bg-civic-green/10 text-civic-green' : 'bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground'}`}>
              <Bookmark className="w-4 h-4 stroke-[1.5]" />
              <span className="text-xs font-bold hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            
            {/* More Options Pill */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors ml-auto sm:ml-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-4 h-4 stroke-[1.5]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-lg font-medium text-sm">
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  Follow post
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Show fewer posts like this
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSave}>
                  <Bookmark className="mr-2 h-4 w-4" />
                  {isSaved ? 'Unsave' : 'Save'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>;
  }
  return <><article className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      <div className="flex flex-col">
        {/* Main Content */}
        <div className="flex-1 min-w-0 py-[12px] px-[2px]">
          {/* Clean Compact Header */}
          <div className="flex items-start gap-2.5 mb-2">
            {/* Left: Avatar - smaller like Reddit */}
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={communityData?.avatarUrl || communityData?.avatar_url || communityData?.icon || post.author?.avatar || (post.author as any)?.avatar_url} />
              <AvatarFallback className="text-xs bg-civic-green/10 text-civic-green font-semibold">
                {(communityData?.name || post.author.displayName || 'U')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Center: Content */}
            <div className="flex-1 min-w-0">
              {/* Community Post Layout */}
              {communityData ? <div className="flex flex-col gap-0.5">
                  {/* Line 1: c/name */}
                  <Link to={`/c/${communityData.name}`} className="font-semibold text-sm hover:underline text-foreground">
                    c/{communityData.name}
                  </Link>
                  
                  {/* Line 2: Prefix/username • time • suggestion */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                    <Link to={`/${post.author.officialPosition ? 'g' : post.author.isVerified ? 'w' : 'u'}/${post.author.username || 'anonymous'}`} className="hover:underline">
                      {post.author.officialPosition ? 'g' : post.author.isVerified ? 'w' : 'u'}/{post.author.displayName || post.author.username || 'Anonymous'}
                    </Link>
                    <span>•</span>
                    <span>{formatPostDate(post.createdAt)} ago</span>
                    {/* Suggestion reason - example */}
                    <span className="hidden sm:inline">• Suggested for you</span>
                  </div>
                </div> : (/* User Post Layout (no community) */
            <div className="flex flex-col gap-0.5">
                  {/* Line 1: Prefix/username + verification */}
                  <div className="flex items-center gap-1.5">
                    <Link to={`/${post.author.officialPosition ? 'g' : post.author.isVerified ? 'w' : 'u'}/${post.author.username || 'anonymous'}`} className="font-semibold text-sm hover:underline text-foreground">
                      {post.author.officialPosition ? 'g' : post.author.isVerified ? 'w' : 'u'}/{post.author.displayName || post.author.username || 'Anonymous'}
                    </Link>
                    
                    {/* Verified badge inline */}
                    {post.author.isVerified && <VerifiedBadge size="xs" positionTitle={post.author.officialPosition} />}
                    
                    {/* Title icon with hover - if has position */}
                    {post.author.officialPosition && <Badge variant="outline" className="text-xs px-1.5 py-0 border-civic-blue/30 text-civic-blue bg-civic-blue/5 max-w-[150px] truncate" title={post.author.officialPosition}>
                        {post.author.officialPosition}
                      </Badge>}
                  </div>
                  
                  {/* Line 2: time • suggestion */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{formatPostDate(post.createdAt)} ago</span>
                    <span className="hidden sm:inline">• Popular near you</span>
                  </div>
                </div>)}
            </div>

            {/* Right: Join Button + Three Dots Menu */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Join button - only for community posts and non-members */}
              {communityData && !isMember && onJoinCommunity && <Button onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onJoinCommunity(post.community!.id, post.community!.name);
            }} size="sm" className="h-7 px-4 text-xs font-semibold bg-civic-blue hover:bg-civic-blue/90 text-white rounded-full">
                  Join
                </Button>}

              {/* Three dots menu */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-sidebar-accent hover:bg-sidebar-accent/80 border border-border/50">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    Follow post
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Show fewer posts like this
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSave}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    {isSaved ? 'Unsave' : 'Save'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <X className="mr-2 h-4 w-4" />
                    Hide
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Flag className="mr-2 h-4 w-4" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Special Badges Row (Flair, Content Warning, etc.) */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {renderSpecialBadges()}
          </div>

          {/* Title and Content */}
          {isDetailView ? <div>
              {/* Detail View: Title -> Media -> Description */}
              <h1 className="font-bold text-2xl mb-4 leading-tight hover:text-destructive transition-colors">{post.title}</h1>

              {/* Media between title and description */}
              {renderMedia()}
              {renderLinkPreview()}

              {/* Description */}
              <SafeContentRenderer content={post.content || ''} className="text-sidebar-foreground text-sm mb-4" />
            </div> : <div>
              {/* Feed View: Title + Content Preview + Expand/Collapse */}
              <Link to={getPostLink()} className="block group">
                <h2 className="mb-3 group-hover:text-primary leading-tight font-bold text-base">
                  {post.title}
                </h2>
              </Link>

              {/* Content Preview with Expand/Collapse */}
              {post.content && <div className="mb-3">
                  <div className={`text-sm text-sidebar-muted-foreground ${!isContentExpanded ? 'line-clamp-3' : ''}`}>
                    <SafeContentRenderer content={post.content} />
                  </div>
                  {post.content.length > 300 && <button onClick={(e) => {
              e.preventDefault();
              setIsContentExpanded(!isContentExpanded);
            }} className="text-primary hover:underline text-sm font-medium mt-1.5 inline-flex items-center gap-1">
                      {isContentExpanded ? <>
                          Show less
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </> : <>
                          Read more
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>}
                    </button>}
                </div>}

              {/* Media shown in feed view */}
              {renderMedia()}
              {renderLinkPreview()}
            </div>}

          {/* Flairs - Display with same colors as form */}
          {post.tags && post.tags.length > 0 && <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map((tagId) => {
            const flair = CIVIC_FLAIRS.find((f) => f.id === tagId);
            if (!flair) return null;
            return <Badge key={tagId} variant="outline" className={`text-xs ${flair.bgColor} ${flair.color} border-transparent`}>
                    {flair.label}
                  </Badge>;
          })}
            </div>}

          {/* Sentiment Bar - only show if available */}
          {(post as any).sentiment && <SentimentBar sentiment={(post as any).sentiment} className="mb-3" />}

          {/* Action Bar - Reddit Style Unified Buttons */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
            {/* Upvotes/Downvotes Pill */}
            <div className="flex items-center bg-muted/40 hover:bg-muted/60 transition-colors rounded-full h-9">
              <button 
                aria-label="Upvote" 
                aria-pressed={localVote === 'up'} 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVoteAction('up'); }} 
                className={`flex items-center justify-center h-full px-2.5 rounded-l-full transition-colors ${localVote === 'up' ? 'text-[#D93900] bg-[#D93900]/10' : 'text-muted-foreground hover:bg-muted hover:text-[#D93900]'}`}
              >
                <ArrowUp className="w-5 h-5 stroke-[1.5]" />
              </button>
              
              <span className={`text-xs font-bold px-1 min-w-[1.5rem] text-center ${localVote === 'up' ? 'text-[#D93900]' : localVote === 'down' ? 'text-[#6A5CFF]' : 'text-foreground'}`}>
                {formatNumber(getVoteScore())}
              </span>
              
              <button 
                aria-label="Downvote" 
                aria-pressed={localVote === 'down'} 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVoteAction('down'); }} 
                className={`flex items-center justify-center h-full px-2.5 rounded-r-full transition-colors ${localVote === 'down' ? 'text-[#6A5CFF] bg-[#6A5CFF]/10' : 'text-muted-foreground hover:bg-muted hover:text-[#6A5CFF]'}`}
              >
                <ArrowDown className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            {/* Comments Pill */}
            <Link to={getPostLink()} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/60 transition-colors rounded-full px-3.5 h-9 text-muted-foreground hover:text-foreground group text-decoration-none">
              <MessageCircle className="w-5 h-5 stroke-[1.5]" />
              <span className="text-xs font-bold">{formatNumber(post.commentCount)}</span>
            </Link>

            {/* Share Pill */}
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(); }} className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/60 transition-colors rounded-full px-3.5 h-9 text-muted-foreground hover:text-foreground">
              <Share className="w-5 h-5 stroke-[1.5]" />
              <span className="text-xs font-bold hidden sm:inline">Share</span>
            </button>

            {/* Save Pill */}
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(); }} className={`flex items-center gap-1.5 rounded-full px-3.5 h-9 transition-colors ${isSaved ? 'bg-civic-green/10 text-civic-green' : 'bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground'}`}>
              <Bookmark className="w-5 h-5 stroke-[1.5]" />
              <span className="text-xs font-bold hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            {/* More Options Pill - Using the new UI styling */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-9 h-9 rounded-full bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors ml-auto sm:ml-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-5 h-5 stroke-[1.5]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-lg font-medium text-sm">
                {isAuthor && <>
                    <DropdownMenuItem onClick={() => navigate(`/edit-post/${post.id}`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit post
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete post
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Post</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>}
                <DropdownMenuItem>Hide post</DropdownMenuItem>
                <DropdownMenuItem>Report</DropdownMenuItem>
                <DropdownMenuItem>Block user</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </article>
    <GlassLightbox src={lightboxSrc} alt="Post image" onClose={() => setLightboxSrc(null)} />
  </>;
};