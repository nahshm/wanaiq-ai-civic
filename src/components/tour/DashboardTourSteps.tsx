import { TourStep } from '@/components/tour/PageTour';
import {
  LayoutGrid, FileText, Users, Target, BarChart3, Sword, Shield,
} from 'lucide-react';

export const DASHBOARD_TOUR_KEY = 'dashboard-tour-completed';

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    icon: <LayoutGrid className="h-8 w-8 text-primary" />,
    title: 'Welcome to Your Dashboard!',
    description: 'This is your civic command centre. Track your actions, monitor community issues, complete quests, and measure your impact — all from one place.',
    placement: 'center',
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Quick Actions',
    description: 'Use the quick action bar to report issues, track projects, or jump into your community with a single click.',
    target: 'tour-quick-actions',
    placement: 'bottom',
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    title: 'Overview & Stats',
    description: 'The overview tab shows your civic impact at a glance — actions taken, issues resolved, and your engagement score.',
    target: 'tour-dashboard-tabs',
    placement: 'bottom',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Citizen Identity',
    description: 'Your identity panel on the left shows your profile, civic score, and community standing. Build your reputation through engagement!',
    target: 'tour-citizen-identity',
    placement: 'right',
  },
  {
    icon: <Sword className="h-8 w-8 text-primary" />,
    title: 'Quests & Leaderboard',
    description: 'Complete civic quests to earn points and climb the leaderboard. Check the right sidebar for active challenges!',
    target: 'tour-quest-widget',
    placement: 'left',
  },
];
