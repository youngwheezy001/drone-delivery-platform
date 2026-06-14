"use client";

import { useEffect, useRef, useState } from 'react';

export default function WebRTCPlayer({ droneId }: { droneId: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<RTCDataChannel | null>(null); // NEW: The control link
    const ws = useRef<WebSocket | null>(null);
    
    const [status, setStatus] = useState<string>("Disconnected");
    const [isManualMode, setIsManualMode] = useState(false); // NEW: Toggles keyboard listening
    const [isFeedActive, setIsFeedActive] = useState(false);

    useEffect(() => {
        if (!isFeedActive) {
            setStatus("Disconnected");
            setIsManualMode(false);
            ws.current?.close();
            peerConnection.current?.close();
            return;
        }

        ws.current = new WebSocket(`ws://localhost:8000/api/v1/telemetry/webrtc/${droneId}`);

        ws.current.onopen = () => {
            setStatus("Waiting for drone camera...");
            peerConnection.current = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            // Catch the video feed
            peerConnection.current.ontrack = (event) => {
                if (videoRef.current && event.streams[0]) {
                    videoRef.current.srcObject = event.streams[0];
                    setStatus("LIVE - Camera Connected");
                }
            };

            // NEW: Catch the Data Channel for Manual Control
            peerConnection.current.ondatachannel = (event) => {
                dataChannel.current = event.channel;
                dataChannel.current.onopen = () => console.log("Data channel opened!");
            };

            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate && ws.current) {
                    ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
                }
            };
        };

        ws.current.onmessage = async (message) => {
            if (!peerConnection.current) return;
            const data = JSON.parse(message.data);

            if (data.type === 'offer') {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);
                ws.current?.send(JSON.stringify({ type: 'answer', answer }));
            } else if (data.type === 'candidate') {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        };

        return () => {
            ws.current?.close();
            peerConnection.current?.close();
        };
    }, [droneId]);

    // NEW: Keyboard Event Listener for W/A/S/D
    useEffect(() => {
        if (!isManualMode) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toUpperCase();
            // Allow W, A, S, D, and Spacebar
            if (['W', 'A', 'S', 'D', ' '].includes(key)) {
                e.preventDefault(); // Stops the browser window from scrolling
                const command = key === ' ' ? 'SPACE' : key;
                
                // Blast the command directly to Python!
                if (dataChannel.current && dataChannel.current.readyState === 'open') {
                    dataChannel.current.send(command);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isManualMode]);

    return (
        <div className="flex flex-col gap-4">
            <button 
                onClick={() => setIsFeedActive(!isFeedActive)}
                className={`w-full px-4 py-2 text-xs font-bold border rounded transition-all flex items-center justify-center gap-2 ${
                    isFeedActive 
                        ? 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20' 
                        : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                }`}
            >
                <span className={`w-2 h-2 rounded-full ${isFeedActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                {isFeedActive ? 'TERMINATE FEED (RE-ASSIGN UAV)' : 'ESTABLISH VIDEO UPLINK'}
            </button>

            <div className={`relative w-full h-[250px] bg-black rounded-lg overflow-hidden border-2 shadow-inner flex flex-col justify-center items-center transition-colors ${isManualMode ? 'border-red-500 shadow-red-500/50' : 'border-gray-700'}`}>
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute top-0 left-0 w-full h-full object-cover z-0"
                />
                
                <div className="absolute top-2 left-2 z-10 bg-black/60 px-2 py-1 rounded text-xs flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status.includes('LIVE') ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
                    <span className="text-gray-200">{status}</span>
                </div>
                
                {isManualMode && (
                    <div className="absolute bottom-2 right-2 z-10 bg-red-600/80 px-3 py-1 rounded font-bold text-white text-xs animate-pulse tracking-widest">
                        MANUAL OVERRIDE ACTIVE
                    </div>
                )}
            </div>

            <button 
                onClick={() => setIsManualMode(!isManualMode)}
                disabled={!status.includes('LIVE')}
                className={`w-full px-4 py-3 font-bold border rounded transition-all ${
                    isManualMode 
                        ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50'
                }`}
            >
                {isManualMode ? 'DISABLE OVERRIDE (RESUME AI)' : 'ENGAGE MANUAL CONTROL'}
            </button>
            
            {isManualMode && (
                <p className="text-center text-xs text-gray-400 mt-[-8px]">
                    Use <strong className="text-white">W A S D</strong> to maneuver. <strong className="text-white">SPACE</strong> to brake.
                </p>
            )}
        </div>
    );
}