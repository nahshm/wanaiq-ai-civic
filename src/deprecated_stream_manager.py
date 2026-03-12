import logging
import os
from aiortc.contrib.media import MediaPlayer, MediaRelay

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class StreamManager:
    """
    Manages multiple video streams and their sources.
    """
    def __init__(self):
        self._streams = {}
        self._relays = {}
        self._players = {}

    def get_stream_track(self, stream_id, video_path):
        """
        Gets a media track for a given stream_id.
        If the stream doesn't exist, it creates one from the video_path.
        """
        if stream_id not in self._streams:
            if not os.path.exists(video_path):
                logging.error(f"Video file for stream {stream_id} not found at {video_path}")
                return None
            
            logging.info(f"Creating new stream source for stream_id: {stream_id} from {video_path}")
            player = MediaPlayer(video_path)
            if player.video:
                relay = MediaRelay()
                self._relays[stream_id] = relay
                self._players[stream_id] = player
                self._streams[stream_id] = relay.subscribe(player.video)
            else:
                logging.error(f"Could not create video track for {video_path}")
                return None
        
        return self._streams.get(stream_id)

    def remove_stream_track(self, stream_id):
        """
        Cleans up a stream when it's no longer needed.
        In a real application, this would be called when no viewers are left.
        """
        if stream_id in self._streams:
            logging.info(f"Removing stream source for stream_id: {stream_id}")
            # Proper cleanup would involve stopping the player and relay
            del self._streams[stream_id]
            del self._relays[stream_id]
            del self._players[stream_id]
