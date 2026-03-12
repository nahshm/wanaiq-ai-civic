import React, { useState, useEffect } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommunitySetupReminderProps {
  communityId: string;
  hasAvatar: boolean;
  hasBanner: boolean;
  hasRules: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  onUpdateNow: () => void;
}

const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getDismissKey(communityId: string) {
  return `community-setup-dismissed-${communityId}`;
}

function isDismissed(communityId: string): boolean {
  try {
    const raw = localStorage.getItem(getDismissKey(communityId));
    if (!raw) return false;
    const dismissedAt = Number(raw);
    return Date.now() - dismissedAt < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

export const CommunitySetupReminder: React.FC<CommunitySetupReminderProps> = ({
  communityId,
  hasAvatar,
  hasBanner,
  hasRules,
  isAdmin,
  isModerator,
  onUpdateNow,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!(isAdmin || isModerator)) return;
    if (hasAvatar && hasBanner && hasRules) return;
    if (isDismissed(communityId)) return;
    setVisible(true);
  }, [communityId, hasAvatar, hasBanner, hasRules, isAdmin, isModerator]);

  if (!visible) return null;

  const missingItems = [
    !hasAvatar && 'avatar',
    !hasBanner && 'banner',
    !hasRules && 'rules',
  ].filter(Boolean);

  const message = `Your community is missing ${missingItems.join(', ')}. Complete your setup to stand out!`;

  const handleDismiss = () => {
    try {
      localStorage.setItem(getDismissKey(communityId), String(Date.now()));
    } catch { /* ignore */ }
    setVisible(false);
  };

  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <ImagePlus className="h-4 w-4 text-primary" />
      </div>
      <p className="flex-1 text-foreground">{message}</p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="default" onClick={onUpdateNow}>
          Update Now
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss}>
          Later
        </Button>
        <button
          onClick={handleDismiss}
          className="ml-1 rounded-sm p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
