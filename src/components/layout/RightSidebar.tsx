import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  ExternalLink, 
  Star,
  MessageSquare,
  ArrowUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrendingPost {
  id: string;
  title: string;
  community: string;
  upvotes: number;
  comments: number;
}

interface Community {
  id: string;
  name: string;
  members: number;
  description: string;
}

export const RightSidebar = () => {
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dynamic trending posts
  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, upvotes, comment_count, community:communities(name)')
          .order('upvotes', { ascending: false })
          .limit(3);

        if (error) throw error;

        if (data) {
          const formatted: TrendingPost[] = data.map((post: any) => ({
            id: post.id,
            title: post.title,
            community: post.community?.name ? `c/${post.community.name}` : 'General',
            upvotes: post.upvotes || 0,
            comments: post.comment_count || 0
          }));
          setTrendingPosts(formatted);
        }
      } catch (error) {
        console.error('Error fetching trending posts:', error);
      }
    };

    const fetchSuggestedCommunities = async () => {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('id, name, member_count, description')
          .order('member_count', { ascending: false })
          .limit(4);

        if (error) throw error;

        if (data) {
          const formatted: Community[] = data.map((comm: any) => ({
            id: comm.id,
            name: `c/${comm.name}`,
            members: comm.member_count || 0,
            description: comm.description || 'Join this community'
          }));
          setSuggestedCommunities(formatted);
        }
      } catch (error) {
        console.error('Error fetching communities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingPosts();
    fetchSuggestedCommunities();
  }, []);

  return (
    <div className="space-y-4">
      {/* Trending Posts */}
      <Card className="bg-sidebar-background border-sidebar-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-sidebar-foreground flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending Today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingPosts.map((post, index) => (
            <Link 
              key={post.id} 
              to={`/post/${post.id}`}
              className="block p-3 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <div className="flex items-start space-x-2">
                <span className="text-xs font-bold text-sidebar-muted-foreground w-4">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-sidebar-foreground line-clamp-2 mb-1">
                    {post.title}
                  </h4>
                  <div className="flex items-center space-x-3 text-xs text-sidebar-muted-foreground">
                    <span>{post.community}</span>
                    <div className="flex items-center space-x-1">
                      <ArrowUp className="w-3 h-3" />
                      <span>{post.upvotes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Popular Communities */}
      <Card className="bg-sidebar-background border-sidebar-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-sidebar-foreground flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Popular Communities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestedCommunities.slice(0, 3).map((community, index) => (
            <Link 
              key={community.id}
              to={`/c/${community.name.slice(2)}`}
              className="block p-3 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <div className="flex items-start space-x-2">
                <span className="text-xs font-bold text-sidebar-muted-foreground w-4">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-sidebar-foreground">
                      {community.name}
                    </h4>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-6 px-2 text-xs bg-transparent border-sidebar-border hover:bg-sidebar-accent"
                    >
                      Join
                    </Button>
                  </div>
                  <p className="text-xs text-sidebar-muted-foreground line-clamp-2 mb-1">
                    {community.description}
                  </p>
                  <span className="text-xs text-sidebar-muted-foreground">
                    {community.members.toLocaleString()} members
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Recent Posts Widget */}
      <Card className="bg-sidebar-background border-sidebar-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-sidebar-foreground flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 mx-auto text-sidebar-muted-foreground mb-2" />
            <p className="text-xs text-sidebar-muted-foreground mb-3">
              Your recent posts will appear here
            </p>
            <Button 
              size="sm" 
              asChild
              className="bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground"
            >
              <Link to="/create">Create Post</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Links */}
      <Card className="bg-sidebar-background border-sidebar-border">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link to="/help" className="text-sidebar-muted-foreground hover:text-sidebar-foreground flex items-center">
              Help
            </Link>
            <Link to="/about" className="text-sidebar-muted-foreground hover:text-sidebar-foreground flex items-center">
              About
            </Link>
            <Link to="/careers" className="text-sidebar-muted-foreground hover:text-sidebar-foreground flex items-center">
              Careers
            </Link>
            <Link to="/terms" className="text-sidebar-muted-foreground hover:text-sidebar-foreground flex items-center">
              Terms
            </Link>
            <Link to="/privacy" className="text-sidebar-muted-foreground hover:text-sidebar-foreground flex items-center">
              Privacy
            </Link>
            <Link to="/rules" className="text-sidebar-muted-foreground hover:text-sidebar-foreground flex items-center">
              Rules
            </Link>
          </div>
          <div className="mt-4 pt-3 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-muted-foreground">
              ama Inc © 2024. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
