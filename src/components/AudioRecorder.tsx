import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, audioUrl: string) => void;
  maxDuration?: number; // in seconds
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 300 // 5 minutes default
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm; codecs=opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      const chunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete?.(blob, url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return prev;
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-recorder space-y-4">
      <div className="flex items-center space-x-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className="flex items-center space-x-2"
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Start Recording</span>
            </>
          )}
        </Button>

        {isRecording && (
          <div className="flex items-center space-x-2 text-red-500">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-mono">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {audioUrl && (
        <div className="recorded-audio">
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
