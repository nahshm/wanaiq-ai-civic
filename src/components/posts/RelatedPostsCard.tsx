import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface RelatedPost {
  id: string;
  title: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  community?: {
    name: string;
  } | null;
}

interface RelatedPostsCardProps {
  postId: string;
  communityId?: string;
  tags?: string[];
}

export function RelatedPostsCard({ postId, communityId, tags }: RelatedPostsCardProps) {
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        let query = supabase
          .from('posts')
          .select(`
            id,
            title,
            upvotes,
            downvotes,
            comment_count,
            created_at,
            communities!posts_community_id_fkey(name)
          `)
          .neq('id', postId);

        // Prioritize posts from the same community
        if (communityId) {
          query = query.eq('community_id', communityId);
        }

        const { data, error } = await query
          .order('upvotes', { ascending: false })
          .limit(5);

        if (error) throw error;

        setRelatedPosts(data as unknown as RelatedPost[]);
      } catch (error) {
        console.error('Error fetching related posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedPosts();
  }, [postId, communityId, tags]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Related Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relatedPosts.length === 0) return null;

  return (
    <Card className="shadow-md shadow-black/5 dark:shadow-black/20 border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          Related Posts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[360px] -mr-4 pr-4">
          <div className="space-y-2.5">
            {relatedPosts
              .filter(post => post.community?.name) // Filter out posts without communities
              .map((post) => {
              const voteScore = post.upvotes - post.downvotes;
              
              return (
                <Link
                  key={post.id}
                  to={`/c/${post.community?.name || 'unknown'}/post/${post.id}`}
                  className="block group"
                >
                  <div className="rounded-xl border border-border/60 hover:border-primary/50 bg-card/30 hover:bg-accent/50 transition-all duration-200 p-3.5 shadow-sm hover:shadow-md">
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary mb-2.5 leading-snug">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                      <span className={`font-bold ${
                        voteScore > 0 ? 'text-green-600' : voteScore < 0 ? 'text-red-600' : ''
                      }`}>
                        {voteScore > 0 ? '+' : ''}{voteScore}
                      </span>
                      <span>•</span>
                      <span>{post.comment_count} comments</span>
                      <span>•</span>
                      <span className="truncate">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
