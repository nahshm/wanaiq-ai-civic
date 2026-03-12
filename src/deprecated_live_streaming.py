import asyncio
import json
import logging
from aiortc import RTCPeerConnection, RTCSessionDescription, MediaStreamTrack

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

pcs = set()

class LiveStreaming:
    """
    Manages a WebRTC peer connection for a single streaming client.
    """
    def __init__(self, video_track: MediaStreamTrack):
        self.video_track = video_track
        self.pc = RTCPeerConnection()
        self.pc.on("connectionstatechange", self.on_connection_state_change)

    async def on_connection_state_change(self):
        logging.info(f"Connection state is {self.pc.connectionState}")
        if self.pc.connectionState == "failed":
            await self.pc.close()
            pcs.discard(self)

    async def handle_offer(self, sdp, type):
        """
        Handles an SDP offer from a client.
        """
        offer = RTCSessionDescription(sdp=sdp, type=type)
        await self.pc.setRemoteDescription(offer)

        # Add the video track to the connection
        if self.video_track:
            self.pc.addTrack(self.video_track)

        # Create and return answer
        answer = await self.pc.createAnswer()
        await self.pc.setLocalDescription(answer)

        return {"sdp": self.pc.localDescription.sdp, "type": self.pc.localDescription.type}

    async def stop_stream(self):
        logging.info("Closing peer connection")
        await self.pc.close()
