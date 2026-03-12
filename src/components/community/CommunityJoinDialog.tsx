import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, Trophy, ShieldCheck } from 'lucide-react';
import Confetti from 'react-confetti-boom';

interface CommunityJoinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  communityName: string;
  communityDescription?: string;
  memberCount?: number;
  rules?: string[];
  onJoin: () => Promise<void>;
}

/**
 * Dialog shown before joining a community
 * Displays community info, rules, and benefits
 */
export const CommunityJoinDialog = ({
  isOpen,
  onClose,
  communityName,
  communityDescription = 'Join this community to participate in discussions and shape civic engagement.',
  memberCount,
  rules = [
    'Be respectful and constructive',
    'No self-promotion or spam',
    'Stay on topic'
  ],
  onJoin
}: CommunityJoinDialogProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await onJoin();
      setIsSuccess(true);
      setShowConfetti(true);
      
      // Auto-close after showing success
      setTimeout(() => {
        onClose();
        // Reset state after close animation
        setTimeout(() => {
          setIsSuccess(false);
          setShowConfetti(false);
        }, 300);
      }, 2000);
    } catch (error) {
      console.error('Failed to join community:', error);
      setIsJoining(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        {showConfetti && (
          <Confetti
            mode="boom"
            particleCount={50}
            colors={['#18492e', '#3b82f6', '#f59e0b']}
          />
        )}

        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                Welcome to c/{communityName}!
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {communityDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Member Count */}
              {memberCount && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{memberCount.toLocaleString()} members</span>
                </div>
              )}

              {/* Community Rules */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Community Rules</h4>
                <ul className="space-y-2">
                  {rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-civic-green mt-0.5">✓</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Member Benefits */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Member Benefits</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-civic-blue" />
                    <span>Vote on proposals</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-civic-orange" />
                    <span>Earn badges</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-civic-green" />
                    <span>Track promises</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-civic-blue" />
                    <span>Join discussions</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} disabled={isJoining}>
                Cancel
              </Button>
              <Button
                onClick={handleJoin}
                disabled={isJoining}
                className="bg-civic-green hover:bg-civic-green/90 text-white"
              >
                {isJoining ? 'Joining...' : 'Join Community →'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-civic-green/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-civic-green" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Welcome!</h3>
                <p className="text-sm text-muted-foreground">
                  You're now a member of c/{communityName}
                </p>
              </div>
              <Badge variant="outline" className="border-civic-green text-civic-green">
                ✨ New quest unlocked
              </Badge>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
