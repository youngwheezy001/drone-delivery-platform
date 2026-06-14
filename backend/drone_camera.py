import os
import asyncio
import json
import websockets
import cv2
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from av import VideoFrame

class WebcamVideoStreamTrack(VideoStreamTrack):
    def __init__(self):
        super().__init__()
        self.cap = cv2.VideoCapture(0)

    async def recv(self):
        pts, time_base = await self.next_timestamp()
        
        ret, frame = self.cap.read()
        if not ret:
            # Fallback to black frame if camera is unavailable
            import numpy as np
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            
        # OpenCV uses BGR, WebRTC expects RGB
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        video_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        video_frame.pts = pts
        video_frame.time_base = time_base
        
        return video_frame

async def run_drone_camera():
    drone_id = "DRONE-001"
    
    # 🛰️ MISSION CONTROL SYNC: Dynamic host discovery
    SIGNALING_HOST = os.getenv("SIGNALING_HOST", "127.0.0.1")
    uri = f"ws://{SIGNALING_HOST}:8000/api/v1/telemetry/webrtc/{drone_id}"

    pc = RTCPeerConnection()

    # --- FLIGHT DYNAMICS ENGINE ---
    # Simulated physics state
    state = {
        "alt": 45.0,
        "vel": 12.5,
        "gforce": 1.0,
        "pitch": 0,
        "roll": 0
    }

    webcam_track = WebcamVideoStreamTrack()
    pc.addTrack(webcam_track)

    # --- NEW: MANUAL CONTROL DATA CHANNEL ---
    channel = pc.createDataChannel("control")

    @channel.on("open")
    def on_open():
        print("🕹️ MANUAL CONTROL LINK ESTABLISHED. Awaiting pilot commands...")

    @channel.on("message")
    def on_message(message):
        # 🧪 PHYSICS OVERRIDE: React to WASD
        if message == "W":
            state["vel"] += 2.0
            state["pitch"] = 5
        elif message == "S":
            state["vel"] = max(0, state["vel"] - 2.0)
            state["pitch"] = -5
        elif message == "A":
            state["roll"] = -10
            state["gforce"] = 1.4
        elif message == "D":
            state["roll"] = 10
            state["gforce"] = 1.4
        elif message == "SPACE":
            state["vel"] = 0
            state["pitch"] = 0
            state["roll"] = 0
            state["alt"] -= 5.0 # Dropping fast!
            state["gforce"] = 0.8
        
        # Decay effects back to level flight
        async def decay():
            await asyncio.sleep(0.5)
            state["pitch"] = 0
            state["roll"] = 0
            state["gforce"] = 1.0
        asyncio.create_task(decay())

    # 📡 HUD BROADCAST LOOP: 10Hz Telemetry
    async def telemetry_loop():
        while True:
            if channel.readyState == "open":
                payload = json.dumps({
                    "type": "telemetry",
                    "data": state
                })
                channel.send(payload)
            await asyncio.sleep(0.1)

    asyncio.create_task(telemetry_loop())

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