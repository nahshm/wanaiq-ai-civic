import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Crown, User } from 'lucide-react';

interface Participant {
  user_id: string;
  role: 'host' | 'speaker' | 'listener';
  is_muted?: boolean;
  is_speaking?: boolean;
}

interface SpeakerListProps {
  participants: Participant[];
  activeSpeaker: string | null;
  userRole: 'host' | 'speaker' | 'listener';
  onToggleMute?: (userId: string) => void;
}

const SpeakerList: React.FC<SpeakerListProps> = ({
  participants,
  activeSpeaker,
  userRole,
  onToggleMute
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'host':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'speaker':
        return <Mic className="w-4 h-4 text-green-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'host':
        return 'default';
      case 'speaker':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="bg-black/20 border-white/10">
      <CardHeader>
        <CardTitle className="text-white text-lg">Participants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {participants.map((participant) => (
            <div
              key={participant.user_id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                activeSpeaker === participant.user_id
                  ? 'bg-green-500/20 border border-green-500/50'
                  : 'bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  {getRoleIcon(participant.role)}
                  <span className="text-white font-medium">
                    {participant.user_id}
                  </span>
                </div>

                <Badge variant={getRoleBadgeVariant(participant.role)}>
                  {participant.role}
                </Badge>

                {participant.is_muted && (
                  <MicOff className="w-4 h-4 text-red-500" />
                )}

                {participant.is_speaking && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse" />
                    <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>

              {userRole === 'host' && participant.role !== 'host' && onToggleMute && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleMute(participant.user_id)}
                  className="text-white hover:bg-white/10"
                >
                  {participant.is_muted ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          ))}

          {participants.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No participants yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeakerList;
