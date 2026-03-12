import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface VideoRecorderProps {
  setVideoUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ setVideoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorderRef.current = new MediaRecorder(stream, options);
    const chunks: Blob[] = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
      <Button onClick={recording ? stopRecording : startRecording}>
        {recording ? 'Stop Recording' : 'Start Recording'}
      </Button>
    </div>
  );
};

export default VideoRecorder;
