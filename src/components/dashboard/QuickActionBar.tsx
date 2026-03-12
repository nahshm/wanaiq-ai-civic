import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertTriangle,
  MessageSquare,
  ClipboardList,
  Bell,
  User,
  Plus,
} from 'lucide-react';

const actions = [
  { label: 'Report Issue', icon: AlertTriangle, to: '/report-an-issue', color: 'text-red-400', bg: 'hover:bg-red-500/10' },
  { label: 'Discussion', icon: MessageSquare, to: '/communities', color: 'text-blue-400', bg: 'hover:bg-blue-500/10' },
  { label: 'Track Project', icon: ClipboardList, to: '/projects', color: 'text-green-400', bg: 'hover:bg-green-500/10' },
  { label: 'Alerts', icon: Bell, to: '/accountability', color: 'text-amber-400', bg: 'hover:bg-amber-500/10' },
];

export const QuickActionBar = () => {
  const { user } = useAuth();

  // Get username for profile link
  const { data: profile } = useQuery({
    queryKey: ['quick-action-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-gradient-to-r from-primary/5 via-muted/50 to-primary/5 border border-border/60 backdrop-blur-sm">
      {actions.map(({ label, icon: Icon, to, color, bg }) => (
        <Button
          key={label}
          variant="ghost"
          size="sm"
          className={`flex-1 h-9 text-xs gap-1.5 rounded-lg ${bg} transition-all`}
          asChild
        >
          <Link to={to}>
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        </Button>
      ))}
      {profile?.username && (
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-9 text-xs gap-1.5 rounded-lg hover:bg-purple-500/10 transition-all"
          asChild
        >
          <Link to={`/resume/${profile.username}`}>
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Resume</span>
          </Link>
        </Button>
      )}
    </div>
  );
};

export default QuickActionBar;
