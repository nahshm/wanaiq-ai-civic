import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Users, MessageCircle, Settings, PhoneOff } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import SpeakerList from './SpeakerList';
import ListenerInterface from './ListenerInterface';
import ReactionButtons from './ReactionButtons';

interface BarazaRoomProps {
  spaceId: string;
  userId: string;
  userRole: 'host' | 'speaker' | 'listener';
  onLeaveRoom: () => void;
}

interface Participant {
  user_id: string;
  role: 'host' | 'speaker' | 'listener';
  is_muted?: boolean;
  is_speaking?: boolean;
}

const BarazaRoom: React.FC<BarazaRoomProps> = ({
  spaceId,
  userId,
  userRole,
  onLeaveRoom
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    connectToBaraza();

    // Fetch initial participants
    fetchParticipants();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [spaceId]);

  const connectToBaraza = () => {
    const ws = new WebSocket(`ws://localhost:5000/ws/baraza/${spaceId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to Baraza space');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from Baraza space');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'participant_joined':
        setParticipants(prev => [...prev, data.participant]);
        break;
      case 'participant_left':
        setParticipants(prev => prev.filter(p => p.user_id !== data.user_id));
        break;
      case 'speaker_changed':
        setActiveSpeaker(data.speaker_id);
        break;
      case 'mute_status_changed':
        setParticipants(prev => prev.map(p =>
          p.user_id === data.user_id ? { ...p, is_muted: data.is_muted } : p
        ));
        break;
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/baraza/speakers/${spaceId}`);
      const data = await response.json();
      setParticipants(data.speakers || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Send mute status to server
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'toggle_mute',
        user_id: userId,
        is_muted: !isMuted
      }));
    }
  };

  const requestToSpeak = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'request_speak',
        user_id: userId
      }));
    }
  };

  return (
    <div className="baraza-room min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">Baraza Space</h1>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{participants.length} participants</span>
            </Badge>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "secondary"}
              size="sm"
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            {userRole === 'listener' && (
              <Button onClick={requestToSpeak} variant="outline" size="sm">
                Request to Speak
              </Button>
            )}

            <Button onClick={onLeaveRoom} variant="destructive" size="sm">
              <PhoneOff className="w-4 h-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Audio Area */}
          <div className="lg:col-span-2">
            <Card className="bg-black/20 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Live Conversation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userRole === 'speaker' || userRole === 'host' ? (
                  <AudioRecorder
                    onRecordingComplete={(blob, url) => {
                      console.log('Recording completed:', url);
                      // Handle recording upload/storage
                    }}
                  />
                ) : (
                  <ListenerInterface
                    spaceId={spaceId}
                    activeSpeaker={activeSpeaker}
                    participants={participants}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SpeakerList
              participants={participants}
              activeSpeaker={activeSpeaker}
              userRole={userRole}
              onToggleMute={(userId) => {
                // Handle mute toggle for hosts
              }}
            />

            <ReactionButtons
              onReaction={(reaction) => {
                if (wsRef.current) {
                  wsRef.current.send(JSON.stringify({
                    type: 'send_reaction',
                    user_id: userId,
                    reaction
                  }));
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarazaRoom;
