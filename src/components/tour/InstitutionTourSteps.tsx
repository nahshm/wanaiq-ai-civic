import { TourStep } from '@/components/tour/PageTour';
import {
  Building2, Shield, Users, FileText, MessageSquare,
} from 'lucide-react';

export const INSTITUTION_TOUR_KEY = 'institution-tour-completed';

export const INSTITUTION_TOUR_STEPS: TourStep[] = [
  {
    icon: <Building2 className="h-8 w-8 text-primary" />,
    title: 'Welcome to the Institution Page!',
    description: 'This page shows a government institution\'s profile, mandate, and the issues citizens have raised about it.',
    placement: 'center',
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: 'Institution Profile',
    description: 'View the institution\'s mandate, contact details, and verification status. Learn what this institution is responsible for.',
    target: 'tour-institution-profile',
    placement: 'right',
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Tabs & Information',
    description: 'Switch between tabs to see detailed information, civic issues directed at this institution, and leadership details.',
    target: 'tour-institution-tabs',
    placement: 'bottom',
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Civic Issues',
    description: 'Citizens can raise and track issues directed at this institution. Support issues to get them prioritised and resolved faster.',
    target: 'tour-institution-issues',
    placement: 'left',
  },
];
