import React from 'react';

interface VideoPlayerProps {
  src: string;
  controls?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, controls = true }) => {
  return (
    <div className="video-player">
      <video src={src} controls={controls} className="w-full h-auto" />
    </div>
  );
};

export default VideoPlayer;
