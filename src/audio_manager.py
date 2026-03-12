import logging
import os
from aiortc.contrib.media import MediaPlayer, MediaRelay

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class AudioManager:
    """
    Manages multiple audio streams and their sources for Baraza spaces.
    """
    def __init__(self):
        self._streams = {}
        self._relays = {}
        self._players = {}

    def get_stream_track(self, space_id, audio_path):
        """
        Gets an audio media track for a given space_id.
        If the stream doesn't exist, it creates one from the audio_path.
        """
        if space_id not in self._streams:
            if not os.path.exists(audio_path):
                logging.error(f"Audio file for space {space_id} not found at {audio_path}")
                return None

            logging.info(f"Creating new audio stream source for space_id: {space_id} from {audio_path}")
            player = MediaPlayer(audio_path)
            if player.audio:
                relay = MediaRelay()
                self._relays[space_id] = relay
                self._players[space_id] = player
                self._streams[space_id] = relay.subscribe(player.audio)
            else:
                logging.error(f"Could not create audio track for {audio_path}")
                return None

        return self._streams.get(space_id)

    def remove_stream_track(self, space_id):
        """
        Cleans up an audio stream when it's no longer needed.
        In a real application, this would be called when no listeners are left.
        """
        if space_id in self._streams:
            logging.info(f"Removing audio stream source for space_id: {space_id}")
            # Proper cleanup would involve stopping the player and relay
            del self._streams[space_id]
            del self._relays[space_id]
            del self._players[space_id]
