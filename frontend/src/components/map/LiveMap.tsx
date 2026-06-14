"use client"; // Required in Next.js for components that use browser APIs like window/document

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import mqtt from 'mqtt';

// Fix for default Leaflet marker icons in Next.js
const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Drone Icon (Red to stand out)
const droneIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function LiveMap() {
    const [isMounted, setIsMounted] = useState(false);
    
    // State to hold active drones
    // Key: drone_id, Value: { lat, lon, battery }
    const [drones, setDrones] = useState<Record<string, any>>({});

    // Prevents SSR (Server-Side Rendering) issues with Leaflet in Next.js
    useEffect(() => {
        setIsMounted(true);
        
        // MQTT Connection
        const brokerUrl = `wss://${process.env.NEXT_PUBLIC_MQTT_BROKER_URL}:${process.env.NEXT_PUBLIC_MQTT_PORT}/mqtt`;
        console.log("Connecting to MQTT Broker:", brokerUrl);
        
        const client = mqtt.connect(brokerUrl, {
            username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
            password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
            protocol: 'wss'
        });

        client.on('connect', () => {
            console.log("OK: [Frontend] Connected to HiveMQ Cloud!");
            client.subscribe('drones/+/telemetry', (err) => {
                if (!err) {
                    console.log("OK: [Frontend] Subscribed to drones/+/telemetry");
                }
            });
        });

        client.on('message', (topic, message) => {
            try {
                const droneId = topic.split('/')[1];
                const payload = JSON.parse(message.toString());
                
                // Update drone state instantly
                setDrones(prev => ({
                    ...prev,
                    [droneId]: {
                        lat: payload.lat,
                        lon: payload.lon,
                        battery: payload.battery,
                        last_seen: new Date()
                    }
                }));
            } catch (err) {
                console.error("Failed to parse MQTT message:", err);
            }
        });

        return () => {
            if (client) client.end();
        };
    }, []);

    if (!isMounted) return <div className="h-full w-full bg-gray-900 animate-pulse rounded-xl"></div>;

    return (
        <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-2xl border border-gray-700 relative">
            <MapContainer 
                center={[-1.283, 36.778]} // Centered on Nairobi
                zoom={14} 
                className="h-full w-full z-0"
                scrollWheelZoom={true}
            >
                {/* Dark Mode Map Tiles to fit our "Go Big" theme */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                
                {/* Render All Active Drones from MQTT State */}
                {Object.entries(drones).map(([id, drone]) => (
                    <Marker key={id} position={[drone.lat, drone.lon]} icon={droneIcon}>
                        <Popup className="font-semibold text-gray-800">
                            <strong>{id}</strong><br/>
                            Battery: {drone.battery}%
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
            
            {/* Overlay to show active drone count */}
            <div className="absolute top-4 left-4 z-[1000] bg-gray-900/90 border border-gray-700 p-4 rounded-xl shadow-lg backdrop-blur-md">
                <h3 className="text-white font-bold mb-1">Airborne Fleet</h3>
                <div className="text-3xl text-emerald-400 font-black">{Object.keys(drones).length}</div>
            </div>
        </div>
    );
}