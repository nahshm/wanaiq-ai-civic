import { TourStep } from '@/components/tour/PageTour';
import {
  Building2, Shield, Target, MessageSquare, FileText, Users,
} from 'lucide-react';

export const OFFICE_HUB_TOUR_KEY = 'office-hub-tour-completed';

export const OFFICE_HUB_TOUR_STEPS: TourStep[] = [
  {
    icon: <Building2 className="h-8 w-8 text-primary" />,
    title: 'Welcome to the Office Hub!',
    description: 'This is the accountability hub for a government office. Here you can track promises, projects, and engage directly with your representative.',
    placement: 'center',
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: 'Office Profile',
    description: 'The left panel shows the office holder\'s profile, verification status, and key statistics about their term in office.',
    target: 'tour-office-profile',
    placement: 'right',
  },
  {
    icon: <Target className="h-8 w-8 text-primary" />,
    title: 'Promises & Projects',
    description: 'Track campaign promises and government projects. See their status, progress, and hold officials accountable.',
    target: 'tour-office-tabs',
    placement: 'bottom',
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Ask Questions',
    description: 'Submit questions directly to the office holder. Upvote questions from other citizens to push for answers.',
    target: 'tour-office-questions',
    placement: 'left',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Community Issues',
    description: 'View and track civic issues raised by constituents in this jurisdiction. Support important issues to get them prioritised.',
    target: 'tour-office-issues',
    placement: 'left',
  },
];
