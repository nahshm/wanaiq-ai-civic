import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, TrendingUp, Users, MessageCircle, Sparkles, Shield, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';

export const EmptyFeedState = () => {
  const { user } = useAuth();
  const authModal = useAuthModal();

  const highlights = [
    {
      icon: <Eye className="w-5 h-5 text-primary" />,
      title: 'Track Promises',
      description: 'Hold elected officials accountable by tracking their campaign promises.',
    },
    {
      icon: <Shield className="w-5 h-5 text-primary" />,
      title: 'Report Issues',
      description: 'Flag civic issues in your ward, constituency, or county.',
    },
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: 'Join Communities',
      description: 'Connect with fellow citizens in topic-based and location-based groups.',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="relative inline-block mb-4">
          <Sparkles className="w-14 h-14 text-primary mx-auto" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          Welcome to the National Town Hall
        </h2>
        <p className="text-muted-foreground text-base max-w-lg mx-auto">
          This is where all civic activity across Kenya comes together — posts, projects, accountability updates, and community discussions.
        </p>
      </div>

      {/* Value props */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
        {highlights.map((item, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">{item.icon}</div>
              <h3 className="font-medium text-sm mb-1 text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {user ? (
          <Button size="lg" asChild>
            <Link to="/submit">
              <PlusCircle className="w-5 h-5 mr-2" />
              Create a Post
            </Link>
          </Button>
        ) : (
          <Button size="lg" onClick={() => authModal.open('signup')}>
            <PlusCircle className="w-5 h-5 mr-2" />
            Create an Account
          </Button>
        )}
        <Button size="lg" variant="outline" asChild>
          <Link to="/communities">
            <Users className="w-5 h-5 mr-2" />
            Browse Communities
          </Link>
        </Button>
      </div>
    </div>
  );
};
