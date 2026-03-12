import React from 'react';

interface AudioPlayerProps {
  src: string;
  controls?: boolean;
  autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  controls = true,
  autoPlay = false
}) => {
  return (
    <div className="audio-player">
      <audio
        src={src}
        controls={controls}
        autoPlay={autoPlay}
        className="w-full"
      />
    </div>
  );
};

export default AudioPlayer;
