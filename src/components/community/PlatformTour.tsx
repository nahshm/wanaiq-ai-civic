import React, { useMemo } from 'react';
import { PageTour, TourStep } from '@/components/tour/PageTour';
import {
  Compass, Layers, Hash, MessageSquare, Info, PlusCircle, Settings, Shield,
} from 'lucide-react';

const USER_STEPS: TourStep[] = [
  {
    icon: <Compass className="h-8 w-8 text-primary" />,
    title: 'Welcome to Your Community!',
    description: 'This is your civic community hub. Here you can engage with your neighbours, discuss local issues, and participate in decision-making. Let us show you around!',
    placement: 'center',
  },
  {
    icon: <Layers className="h-8 w-8 text-primary" />,
    title: 'Level Selector',
    description: 'These icons represent your County, Constituency, and Ward communities. Click any level to switch between geographic communities you belong to.',
    target: 'tour-level-selector',
    placement: 'right',
  },
  {
    icon: <Hash className="h-8 w-8 text-primary" />,
    title: 'Channel List',
    description: 'Each community has channels organised by category — Posts, Chat, Announcements, and more. Click a channel name to view its content.',
    target: 'tour-channel-list',
    placement: 'right',
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Main Content Area',
    description: "The centre of the screen shows the active channel's content — community posts, live chat, or announcements. This is where the conversation happens!",
    target: 'tour-main-content',
    placement: 'left',
  },
  {
    icon: <Info className="h-8 w-8 text-primary" />,
    title: 'Community Sidebar',
    description: "On the right you'll find community info, rules, and moderators. It helps you understand the community's guidelines at a glance.",
    target: 'tour-sidebar',
    placement: 'left',
  },
];

const ADMIN_STEPS: TourStep[] = [
  {
    icon: <PlusCircle className="h-8 w-8 text-primary" />,
    title: 'Channel Management',
    description: 'As an admin, you can create new channels using this "+" button. Organise discussions with different channel types — feed, chat, or announcements.',
    target: 'tour-add-channel',
    placement: 'right',
  },
  {
    icon: <Settings className="h-8 w-8 text-primary" />,
    title: 'Community Settings',
    description: "Update your community's avatar, banner, and description from the settings. A well-branded community attracts more engagement!",
    target: 'tour-settings',
    placement: 'bottom',
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: 'Moderation Tools',
    description: 'You can manage posts, moderate content, and keep discussions constructive. Look for moderation options on posts and in the community settings.',
    placement: 'center',
  },
];

function getAdminTourKey(communityId: string) {
  return `admin-tour-completed-${communityId}`;
}

const USER_TOUR_KEY = 'platform-tour-completed';

interface PlatformTourProps {
  communityId: string;
  isAdmin: boolean;
  isModerator: boolean;
  userId?: string;
}

export const PlatformTour: React.FC<PlatformTourProps> = ({
  communityId,
  isAdmin,
  isModerator,
  userId,
}) => {
  const isAdminTour = (isAdmin || isModerator);
  const tourKey = isAdminTour ? getAdminTourKey(communityId) : USER_TOUR_KEY;

  const steps = useMemo(
    () => (isAdminTour ? [...USER_STEPS, ...ADMIN_STEPS] : USER_STEPS),
    [isAdminTour]
  );

  // For admin tour, also mark user tour as done
  // We handle this by wrapping — when admin tour completes, the tourKey is set.
  // We also need to set the user key. We'll use a small effect-based approach:
  // Actually, PageTour sets tourKey on complete. For admin, we need to also set USER_TOUR_KEY.
  // Simplest: just check if user tour is already done; if not and admin tour will run, it covers user steps too.
  // On completion PageTour sets the admin key. We need to also set user key.
  // Let's handle this at this level by checking localStorage ourselves.

  if (!userId) return null;

  // If admin tour, check if already done
  if (isAdminTour) {
    const adminDone = localStorage.getItem(tourKey) === 'true';
    if (adminDone) {
      // Check if user tour also needs to run
      const userDone = localStorage.getItem(USER_TOUR_KEY) === 'true';
      if (userDone) return null;
      return <PageTour tourKey={USER_TOUR_KEY} steps={USER_STEPS} userId={userId} />;
    }
    // Admin tour not done — run it. On completion, also mark user tour done.
    return <AdminTourWrapper tourKey={tourKey} steps={steps} userId={userId} />;
  }

  return <PageTour tourKey={USER_TOUR_KEY} steps={USER_STEPS} userId={userId} />;
};

/** Wrapper that marks both admin and user tour keys on completion */
const AdminTourWrapper: React.FC<{ tourKey: string; steps: TourStep[]; userId: string }> = ({ tourKey, steps, userId }) => {
  // We listen for the admin tour key being set, then also set user key
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (localStorage.getItem(tourKey) === 'true') {
        localStorage.setItem(USER_TOUR_KEY, 'true');
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [tourKey]);

  return <PageTour tourKey={tourKey} steps={steps} userId={userId} />;
};
