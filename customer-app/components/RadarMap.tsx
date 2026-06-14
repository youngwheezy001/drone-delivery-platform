import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Config, discoverActiveNode } from '../constants/Config';
import { Hub } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

interface RadarMapProps {
  hubs: Hub[];
}

export const RadarMap: React.FC<RadarMapProps> = ({ hubs }) => {
  const [fleet, setFleet] = useState<any[]>([]);
  const [activeNode, setActiveNode] = useState(Config.HTTP_URL);
  const [userLocation, setUserLocation] = useState(Config.HQ_LOCATION);

  // 🌍 LIVE GPS TRACKING
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  // 🛰️ TACTICAL FLEET SCAN: Fetching active drones for the radar
  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const node = await discoverActiveNode();
        setActiveNode(node);
        const res = await fetch(`${node}/api/v1/fleet/status`);
        if (res.ok) setFleet(await res.json());
      } catch (e) {}
    };
    fetchFleet();
    const interval = setInterval(fetchFleet, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.radarCard}>
       <MapView
          style={styles.radarMap}
          mapType="hybrid"
          region={{
            ...userLocation,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          pitchEnabled={false}
          rotateEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
       >
          <Circle 
            center={userLocation} 
            radius={5000} 
            fillColor="rgba(0, 255, 204, 0.05)" 
            strokeColor="#00ffcc20" 
          />
          
          {/* 📍 LIVE USER LOCATION */}
          <Marker coordinate={userLocation}>
             <View style={styles.userMarker} />
          </Marker>
          
          {/* HUB MARKERS */}
          {hubs.map(hub => (
            <Marker 
              key={hub.id} 
              coordinate={{ 
                latitude: hub.latitude || Config.HQ_LOCATION.latitude, 
                longitude: hub.longitude || Config.HQ_LOCATION.longitude 
              }}
            >
               <View style={styles.radarMarker}>
                  <LinearGradient colors={['#00ffcc', '#009977']} style={styles.radarMarkerInner} />
               </View>
            </Marker>
          ))}

          {/* 🚁 TACTICAL DRONE MARKERS */}
          {fleet.map(drone => (
            <Marker 
              key={drone.id} 
              coordinate={{ 
                latitude: drone.coords[0], 
                longitude: drone.coords[1] 
              }}
            >
               <Image 
                 source={require('../assets/images/drone-marker-white.png')} 
                 style={{ width: 14, height: 14, opacity: 0.9, shadowColor: '#fff', shadowOpacity: 0.8, shadowRadius: 5 }} 
                 resizeMode="contain"
               />
            </Marker>
          ))}
       </MapView>
       
       <LinearGradient 
         colors={['rgba(15, 23, 42, 0.9)', 'transparent']} 
         style={styles.radarOverlay}
       >
          <Ionicons name="scan-outline" size={20} color="#00ffcc" />
          <View>
            <Text style={styles.radarInfo}>{hubs.length} HUBS • {fleet.length} UAVs</Text>
            <Text style={styles.radarStatus}>TACTICAL GRID SCAN ACTIVE</Text>
          </View>
       </LinearGradient>
       
       {/* SCANLINE EFFECT */}
       <View style={styles.scanLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  radarCard: { 
    marginHorizontal: 15, 
    height: 250, 
    borderRadius: 35, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)', 
    backgroundColor: '#000' 
  },
  radarMap: { 
    width: '100%', 
    height: '100%', 
    opacity: 0.6 
  },
  radarOverlay: { 
    position: 'absolute', 
    top: 15, 
    left: 15, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(0, 255, 204, 0.2)' 
  },
  radarInfo: { 
    color: '#00ffcc', 
    fontSize: 10, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
  radarStatus: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2
  },
  radarMarker: { 
    width: 20, 
    height: 20, 
    backgroundColor: 'rgba(0, 255, 204, 0.1)', 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(0, 255, 204, 0.3)' 
  },
  radarMarkerInner: { 
    width: 6, 
    height: 6, 
    borderRadius: 3 
  },
  userMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5
  },
  scanLine: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 255, 204, 0.3)',
    shadowColor: '#00ffcc',
    shadowOpacity: 0.5,
    shadowRadius: 10
  }
});
