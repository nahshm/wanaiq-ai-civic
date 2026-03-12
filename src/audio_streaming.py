import asyncio
import json
import logging
from aiortc import RTCPeerConnection, RTCSessionDescription, MediaStreamTrack

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

pcs = set()

class AudioStreaming:
    """
    Manages a WebRTC peer connection for a single audio streaming client in Baraza.
    """
    def __init__(self, audio_track: MediaStreamTrack):
        self.audio_track = audio_track
        self.pc = RTCPeerConnection()
        self.pc.on("connectionstatechange", self.on_connection_state_change)

    async def on_connection_state_change(self):
        logging.info(f"Audio connection state is {self.pc.connectionState}")
        if self.pc.connectionState == "failed":
            await self.pc.close()
            pcs.discard(self)

    async def handle_offer(self, sdp, type):
        """
        Handles an SDP offer from a client for audio streaming.
        """
        offer = RTCSessionDescription(sdp=sdp, type=type)
        await self.pc.setRemoteDescription(offer)

        # Add the audio track to the connection
        if self.audio_track:
            self.pc.addTrack(self.audio_track)

        # Create and return answer
        answer = await self.pc.createAnswer()
        await self.pc.setLocalDescription(answer)

        return {"sdp": self.pc.localDescription.sdp, "type": self.pc.localDescription.type}

    async def stop_stream(self):
        logging.info("Closing audio peer connection")
        await self.pc.close()
