import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Post } from '@/types';
import { Shield, TrendingUp, MessageCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AboutPostCardProps {
  post: Post;
  verification?: {
    verificationScore: number;
    verifiedCount: number;
    unverifiedCount: number;
    needsVerificationCount: number;
  };
  viewCount?: number;
}

export function AboutPostCard({ post, verification, viewCount = 0 }: AboutPostCardProps) {
  const voteScore = post.upvotes - post.downvotes;
  const upvotePercentage = post.upvotes + post.downvotes > 0
    ? Math.round((post.upvotes / (post.upvotes + post.downvotes)) * 100)
    : 0;

  return (
    <Card className="shadow-md shadow-black/5 dark:shadow-black/20 border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          About this Post
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Author Info */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Author</p>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{post.author.displayName}</p>
            {post.author.isVerified && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 px-2 py-0.5">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          {post.author.role && (
            <p className="text-xs text-muted-foreground capitalize">{post.author.role}</p>
          )}
        </div>

        <Separator className="bg-border/60" />

        {/* Verification Status */}
        {verification && (
          <>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Verification Status</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Community Verified</span>
                  <span className="font-bold text-base text-primary">{verification.verificationScore}%</span>
                </div>
                <div className="relative">
                  <Progress value={verification.verificationScore} className="h-2.5 bg-muted/50" />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="text-center space-y-1">
                    <div className="font-bold text-lg text-green-600 dark:text-green-500">{verification.verifiedCount}</div>
                    <div className="text-[10px] text-muted-foreground">Verified</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="font-bold text-lg text-red-600 dark:text-red-500">{verification.unverifiedCount}</div>
                    <div className="text-[10px] text-muted-foreground">Disputed</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="font-bold text-lg text-amber-600 dark:text-amber-500">{verification.needsVerificationCount}</div>
                    <div className="text-[10px] text-muted-foreground">Unclear</div>
                  </div>
                </div>
              </div>
            </div>
            <Separator className="bg-border/60" />
          </>
        )}

        {/* Engagement Stats */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Engagement</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 rounded-xl p-3.5 border border-green-200/50 dark:border-green-800/30">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-500 mx-auto mb-1.5" />
              <p className="text-[10px] text-muted-foreground text-center mb-0.5">Upvotes</p>
              <p className="font-bold text-xl text-green-600 dark:text-green-500 text-center">{post.upvotes}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-3.5 border border-blue-200/50 dark:border-blue-800/30">
              <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-500 mx-auto mb-1.5" />
              <p className="text-[10px] text-muted-foreground text-center mb-0.5">Comments</p>
              <p className="font-bold text-xl text-blue-600 dark:text-blue-500 text-center">{post.commentCount}</p>
            </div>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 border border-border/40">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground font-medium">Upvote Ratio</span>
              <span className="font-bold text-foreground">{upvotePercentage}%</span>
            </div>
            <Progress value={upvotePercentage} className="h-2 bg-muted/50" />
          </div>
        </div>

        {/* View Count */}
        {viewCount > 0 && (
          <>
            <Separator className="bg-border/60" />
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">
                {viewCount.toLocaleString()} views
              </span>
            </div>
          </>
        )}

        <Separator className="bg-border/60" />

        {/* Post Age */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Posted</p>
          <p className="font-medium text-sm">{formatDistanceToNow(post.createdAt, { addSuffix: true })}</p>
        </div>

        {/* Content Sensitivity */}
        {post.contentSensitivity && post.contentSensitivity !== 'public' && (
          <>
            <Separator className="bg-border/60" />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Content Type</p>
              <Badge
                variant="outline"
                className={`
                  ${post.contentSensitivity === 'crisis'
                    ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                    : 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400'
                  }
                `}
              >
                {post.contentSensitivity === 'crisis' ? 'Crisis Report' : 'Sensitive Topic'}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
