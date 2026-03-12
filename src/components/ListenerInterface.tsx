import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Participant {
  user_id: string;
  role: 'host' | 'speaker' | 'listener';
  is_muted?: boolean;
  is_speaking?: boolean;
}

interface ListenerInterfaceProps {
  spaceId: string;
  activeSpeaker: string | null;
  participants: Participant[];
}

const ListenerInterface: React.FC<ListenerInterfaceProps> = ({
  spaceId,
  activeSpeaker,
  participants
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = React.useState(false);

  useEffect(() => {
    // In a real implementation, this would connect to WebRTC audio stream
    // For now, we'll simulate audio connection
    console.log('Connecting to audio stream for space:', spaceId);
  }, [spaceId]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const activeSpeakerData = participants.find(p => p.user_id === activeSpeaker);

  return (
    <div className="listener-interface space-y-4">
      {/* Active Speaker Display */}
      <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-white/10">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Volume2 className="w-8 h-8 text-white" />
            </div>

            {activeSpeaker ? (
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {activeSpeakerData?.user_id || 'Unknown Speaker'}
                </h3>
                <p className="text-gray-300">
                  {activeSpeakerData?.role === 'host' ? 'Host' : 'Speaker'}
                </p>
                {activeSpeakerData?.is_speaking && (
                  <div className="flex justify-center space-x-1 mt-2">
                    <div className="w-2 h-6 bg-green-500 rounded-full animate-pulse" />
                    <div className="w-2 h-6 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-6 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Waiting for speakers</h3>
                <p className="text-gray-300">No one is speaking right now</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audio Controls */}
      <div className="flex justify-center">
        <Button
          onClick={toggleMute}
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="flex items-center space-x-2"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-5 h-5" />
              <span>Unmute</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              <span>Mute</span>
            </>
          )}
        </Button>
      </div>

      {/* Hidden audio element for WebRTC stream */}
      <audio
        ref={audioRef}
        autoPlay
        className="hidden"
      />

      {/* Listener Stats */}
      <div className="text-center text-gray-400 text-sm">
        <p>{participants.filter(p => p.role === 'speaker' || p.role === 'host').length} speakers • {participants.filter(p => p.role === 'listener').length} listeners</p>
      </div>
    </div>
  );
};

export default ListenerInterface;
