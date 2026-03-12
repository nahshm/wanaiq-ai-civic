import { Lock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LockedPostOverlayProps {
  communityName: string;
  memberCount?: number;
  onJoinClick: () => void;
  isJoining?: boolean;
}

/**
 * Overlay component for posts from communities the user hasn't joined
 * Shows a preview of the content but requires joining to interact
 */
export const LockedPostOverlay = ({
  communityName,
  memberCount,
  onJoinClick,
  isJoining = false
}: LockedPostOverlayProps) => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
      <div className="max-w-md p-8 text-center space-y-6">
        {/* Lock Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-civic-green/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-civic-green" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            Join c/{communityName} to participate
          </h3>
          <p className="text-sm text-muted-foreground">
            Preview only - Join to vote, comment, and contribute
          </p>
        </div>

        {/* Community Stats */}
        {memberCount && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{memberCount.toLocaleString()} members</span>
          </div>
        )}

        {/* Join Button */}
        <Button
          onClick={onJoinClick}
          disabled={isJoining}
          size="lg"
          className="w-full bg-civic-green hover:bg-civic-green/90 text-white shadow-lg hover:shadow-xl transition-all"
        >
          {isJoining ? 'Joining...' : `Join Community →`}
        </Button>

        <p className="text-xs text-muted-foreground">
          Joining is free and takes seconds
        </p>
      </div>
    </div>
  );
};
