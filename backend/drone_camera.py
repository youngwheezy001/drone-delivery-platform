import asyncio
import json
import cv2
import websockets
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from av import VideoFrame

class WebcamVideoStreamTrack(VideoStreamTrack):
    def __init__(self):
        super().__init__()
        self.cap = cv2.VideoCapture(0) # Grabs the default laptop camera

    async def recv(self):
        pts, time_base = await self.next_timestamp()
        ret, frame = self.cap.read()
        
        if not ret:
            return None

        video_frame = VideoFrame.from_ndarray(frame, format="bgr24")
        video_frame.pts = pts
        video_frame.time_base = time_base
        return video_frame

async def run_drone_camera():
    drone_id = "DRONE-001"
    uri = f"ws://localhost:8000/api/v1/telemetry/webrtc/{drone_id}"

    pc = RTCPeerConnection()
    webcam_track = WebcamVideoStreamTrack()
    pc.addTrack(webcam_track)

    # --- NEW: MANUAL CONTROL DATA CHANNEL ---
    channel = pc.createDataChannel("control")

    @channel.on("open")
    def on_open():
        print("🕹️ MANUAL CONTROL LINK ESTABLISHED. Awaiting pilot commands...")

    @channel.on("message")
    def on_message(message):
        # This acts as the physical flight controller
        if message == "W":
            print("⬆️  THRUST FORWARD")
        elif message == "S":
            print("⬇️  REVERSE THRUST")
        elif message == "A":
            print("⬅️  BANK LEFT")
        elif message == "D":
            print("➡️  BANK RIGHT")
        elif message == "SPACE":
            print("🛑 EMERGENCY BRAKE ENGAGED")
    # ----------------------------------------

    try:
        async with websockets.connect(uri) as websocket:
            print(f"🚁 Drone {drone_id} connected to Mission Control Signaling Server!")

            offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            connected = False

            # Helper function to resend the offer
            async def send_offer():
                await websocket.send(json.dumps({
                    "type": "offer",
                    "offer": {
                        "sdp": pc.localDescription.sdp,
                        "type": pc.localDescription.type
                    }
                }))

            # Send the first ping
            print("📡 Video feed offer sent. Awaiting dashboard connection...")
            await send_offer()

            while True:
                try:
                    # Wait 3 seconds for the dashboard to reply
                    message = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                    data = json.loads(message)

                    if data.get("type") == "answer":
                        print("✅ Dashboard accepted the feed. Streaming LIVE!")
                        answer = RTCSessionDescription(sdp=data["answer"]["sdp"], type=data["answer"]["type"])
                        await pc.setRemoteDescription(answer)
                        connected = True
                        
                        # Once connected, keep the script running indefinitely to stream the video
                        while True:
                            await asyncio.sleep(1)

                except asyncio.TimeoutError:
                    # If the dashboard didn't answer within 3 seconds, fire another ping!
                    if not connected:
                        print("⏱️ Dashboard offline or asleep. Retrying connection ping...")
                        await send_offer()

    except Exception as e:
        print(f"Connection lost: {e}")
    finally:
        print("Shutting down optical sensors...")
        await pc.close()
        webcam_track.cap.release()

if __name__ == "__main__":
    print("Initiating Drone Optical Sensors...")
    asyncio.run(run_drone_camera())