import { useState, useEffect, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface DroneTelemetryHUD {
  alt: number;
  vel: number;
  gforce: number;
  pitch: number;
  roll: number;
}

export const useWebRTC = (signalingUrl: string, droneId: string | null) => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [telemetry, setTelemetry] = useState<DroneTelemetryHUD>({
    alt: 0,
    vel: 0,
    gforce: 1.0,
    pitch: 0,
    roll: 0
  });

  const pc = useRef<RTCPeerConnection | null>(null);
  const signalingWs = useRef<WebSocket | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);

  const sendCommand = useCallback((command: string) => {
    if (dataChannel.current && dataChannel.current.readyState === 'open') {
      dataChannel.current.send(command);
    }
  }, []);

  useEffect(() => {
    if (!droneId) return;

    const connect = () => {
      console.log(`📡 Initializing WebRTC Link for ${droneId}...`);
      setConnectionStatus('connecting');

      signalingWs.current = new WebSocket(`${signalingUrl}/${droneId}`);
      
      pc.current = new RTCPeerConnection(ICE_SERVERS);

      // Listen for incoming media tracks
      pc.current.ontrack = (event) => {
        console.log("🎬 Optical stream received!");
        setRemoteStream(event.streams[0]);
        setConnectionStatus('connected');
      };

      // Handle ICE Candidates
      pc.current.onicecandidate = (event) => {
        if (event.candidate && signalingWs.current?.readyState === WebSocket.OPEN) {
          signalingWs.current.send(JSON.stringify({
            type: 'candidate',
            candidate: event.candidate
          }));
        }
      };

      // Listen for Data Channel (Drone script creates it)
      pc.current.ondatachannel = (event) => {
        console.log("🕹️ Tactical Data Channel Established!");
        dataChannel.current = event.channel;

        dataChannel.current.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data.type === 'telemetry') {
              setTelemetry(data.data);
            }
          } catch (e) {
            console.warn("Telemetry parse error:", e);
          }
        };
      };

      signalingWs.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'offer') {
          console.log("📥 Received Mission Offer from Drone");
          await pc.current?.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.current?.createAnswer();
          await pc.current?.setLocalDescription(answer);
          
          signalingWs.current?.send(JSON.stringify({
            type: 'answer',
            answer: {
              sdp: pc.current?.localDescription?.sdp,
              type: pc.current?.localDescription?.type
            }
          }));
        } else if (data.type === 'candidate') {
          console.log("📥 Received ICE Candidate");
          await pc.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else if (data.type === 'telemetry') {
          // TACTICAL INJECTION: Allows our backend bash Python script to stream dummy HUD data without native WebRTC DataChannels
          setTelemetry(data.data);
        }
      };

      signalingWs.current.onerror = (err) => {
        // Suppress raw WebSocket object errors to prevent console spam
        console.warn("🛸 Tactical Optical Link offline or awaiting signal.");
        setConnectionStatus('error');
      };
    };

    connect();

    return () => {
      console.log("🚨 Closing WebRTC Link...");
      signalingWs.current?.close();
      pc.current?.close();
      setRemoteStream(null);
      setConnectionStatus('disconnected');
    };
  }, [signalingUrl, droneId]);

  return { remoteStream, connectionStatus, sendCommand, telemetry };
};
