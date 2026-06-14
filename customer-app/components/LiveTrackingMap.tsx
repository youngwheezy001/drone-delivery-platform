import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Config } from '../constants/Config';
import { DroneTelemetry } from '../types';

interface LiveTrackingMapProps {
  droneLocation: DroneTelemetry | null;
  route: { latitude: number; longitude: number }[];
  status: string;
}

const TACTICAL_DARK_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#00ffcc" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#00ffcc", "opacity": 0.5 }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#0f172a" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] }
];

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ droneLocation, route, status }) => {
  const HQ_LOCATION = Config.HQ_LOCATION;
  const [weatherCenter, setWeatherCenter] = useState(HQ_LOCATION);

  useEffect(() => {
    const interval = setInterval(() => {
      const loopSec = 60;
      const offset = (Date.now() % (loopSec * 1000)) / (loopSec * 1000);
      setWeatherCenter({
        latitude: HQ_LOCATION.latitude + (offset * 0.05),
        longitude: HQ_LOCATION.longitude + (offset * 0.1)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [HQ_LOCATION]);

  return (
    <MapView 
      style={styles.map} 
      provider={PROVIDER_GOOGLE}
      customMapStyle={TACTICAL_DARK_STYLE}
      initialRegion={{ 
        ...HQ_LOCATION, 
        latitudeDelta: 0.1, 
        longitudeDelta: 0.1 
      }} 
    >
      {/* 🌩️ PROCEDURAL WEATHER OVERLAY */}
      <Circle 
        center={weatherCenter}
        radius={4500}
        fillColor="rgba(0, 100, 255, 0.15)"
        strokeColor="rgba(0, 100, 255, 0.3)"
        strokeWidth={2}
      />

      <Marker coordinate={HQ_LOCATION}>
        <View style={styles.hubMarker} />
      </Marker>

      {route.length > 0 && (
        <>
          {/* Layer 1: Atmospheric Aura */}
          <Polyline 
            coordinates={route} 
            strokeColor="rgba(0, 255, 204, 0.05)" 
            strokeWidth={16} 
          />
          {/* Layer 2: Glowing Core */}
          <Polyline 
            coordinates={route} 
            strokeColor="rgba(0, 255, 204, 0.2)" 
            strokeWidth={6} 
          />
          {/* Layer 3: Pulse Signal */}
          <Polyline 
            coordinates={route} 
            strokeColor="#fff" 
            strokeWidth={2} 
            lineDashPattern={[2, 4]} 
          />

          <Marker coordinate={route[route.length - 1]}>
             <View style={styles.destMarker}>
                <Ionicons name="location" size={16} color="#000" />
             </View>
          </Marker>
        </>
      )}

      {droneLocation && (
        <Marker 
          coordinate={{ 
            latitude: droneLocation.latitude, 
            longitude: droneLocation.longitude 
          }}
        >
          <View style={styles.droneMarkerContainer}>
             <Image 
                source={require('../assets/images/drone-marker-white.png')} 
                style={{ 
                  width: 32, 
                  height: 32,
                  shadowColor: '#fff',
                  shadowOpacity: 1,
                  shadowRadius: 10,
                }}
                resizeMode="contain"
             />
             <View style={styles.scanLine} />
          </View>
        </Marker>
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: { 
    flex: 1 
  },
  hubMarker: { 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: '#00ffcc', 
    borderWidth: 3, 
    borderColor: '#000',
    shadowColor: '#00ffcc',
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  destMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00ffcc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  droneMarkerContainer: { 
    alignItems: 'center', 
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#00ffcc',
  },
  scanLine: { 
    position: 'absolute', 
    top: '50%', 
    width: '100%', 
    height: 1, 
    backgroundColor: 'rgba(0, 255, 204, 0.5)', 
  },
});
