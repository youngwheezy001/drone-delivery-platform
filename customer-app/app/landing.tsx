import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, ActivityIndicator, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Config, discoverActiveNode } from '../constants/Config';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { RadarMap } from '../components/RadarMap';
import { CircleMenu } from '../components/CircleMenu';
import { MissionBriefing } from '../components/MissionBriefing';
import { GlobalStats } from '../components/GlobalStats';
import * as Location from 'expo-location';
import { MOCK_HUBS } from '../constants/MockData';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [hubs, setHubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNode, setActiveNode] = useState(Config.HTTP_URL);
  const [userAddress, setUserAddress] = useState("CALCULATING POSITION...");

  useEffect(() => {
    const initGrid = async () => {
      try {
        const node = await discoverActiveNode();
        setActiveNode(node);
        const res = await fetch(`${node}/api/v1/marketplace/discovery`);
        if (res.ok) {
           const data = await res.json();
           if (data.length > 0) setHubs(data);
           else throw new Error("Empty DB");
        } else {
           throw new Error("Bad Response");
        }
      } catch (e) {
        console.log("Injecting Mock Hubs for Presentation");
        setHubs(MOCK_HUBS);
      } finally {
        setIsLoading(false);
      }
    };
    initGrid();

    // 🌍 FETCH REAL LOCATION FOR HUD
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        let geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        if (geocode.length > 0) {
          const place = geocode[0];
          const city = place.city || place.subregion || place.region || 'UNKNOWN ZONE';
          const street = place.street || place.name || 'SECTOR ALPHA';
          setUserAddress(`${street}, ${city}`.toUpperCase());
        } else {
          setUserAddress("UNMAPPED SECTOR");
        }
      } else {
        setUserAddress("HQ NODE • NAIROBI");
      }
    })();
  }, []);

  const handleSectorSelect = (id: string) => {
    router.push(`/(tabs)?category=${id}`);
  };

  return (
    <View style={styles.container}>
      {/* 🌌 CINEMATIC TACTICAL BACKDROP */}
      <ImageBackground 
        source={require('../assets/images/tactical_bg.png')} 
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <LinearGradient 
          colors={['rgba(2, 6, 23, 0.98)', 'rgba(0, 0, 0, 0.92)']} 
          style={StyleSheet.absoluteFill} 
        />
      </ImageBackground>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* 🛰️ TOP HUD: LOCATION & STATUS */}
        <View style={styles.topHud}>
           <View style={styles.locationBox}>
              <Ionicons name="location-sharp" size={16} color="#00ffcc" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.hudLabel}>YOUR LOCATION</Text>
                <Text style={styles.hudValue} numberOfLines={1} ellipsizeMode="tail">{userAddress}</Text>
              </View>
           </View>
           <TouchableOpacity style={styles.profileBtn} onPress={() => user ? router.push('/support') : router.push('/login')}>
              <LinearGradient colors={['#1e293b', 'rgba(15, 23, 42, 0.4)']} style={styles.profileBtnInner}>
                 <Ionicons name={user ? "person" : "person-outline"} size={20} color="#64748b" />
              </LinearGradient>
           </TouchableOpacity>
        </View>

        <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
        >
          {/* 🛰️ GLOBAL METRICS TICKER */}
          <GlobalStats />

          {/* 🔘 CENTRAL TACTICAL MENU (GLOVO STYLE) */}
          <View style={styles.menuContainer}>
             <CircleMenu onSelect={handleSectorSelect} />
          </View>

          {/* 🧠 AI MISSION INTELLIGENCE */}
          <MissionBriefing />

          {/* 📊 SECTOR STATUS: HUB CAROUSEL */}
          <View style={styles.sectorStatusContainer}>
             <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>STORES NEAR YOU</Text>
                <View style={styles.liveBadge}>
                   <View style={styles.pulseDot} />
                   <Text style={styles.liveText}>OPEN NOW</Text>
                </View>
             </View>
             
             <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hubCarousel}
             >
                {isLoading ? (
                  <View style={styles.loadingCarousel}>
                    <ActivityIndicator color="#00ffcc" />
                    <Text style={{color: '#00ffcc', fontSize: 10, marginTop: 10, fontWeight: 'bold'}}>TUSTAR DELIVERY - LOADING STORES...</Text>
                  </View>
                ) : hubs.map((hub) => (
                  <TouchableOpacity 
                    key={hub.id} 
                    style={styles.hubCard}
                    onPress={() => router.push(`/(tabs)?vendorId=${hub.id}`)}
                  >
                    <LinearGradient colors={['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.6)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.hubIconBox}>
                        <MaterialCommunityIcons name="office-building" size={24} color="#00ffcc" />
                    </View>
                    <Text style={styles.hubName} numberOfLines={1}>{hub.name.toUpperCase()}</Text>
                    <View style={styles.hubMetrics}>
                        <Text style={styles.hubMetricText}>{hub.products?.length || 0} ASSETS</Text>
                        <Text style={styles.hubMetricStatus}>REACHABLE</Text>
                    </View>
                  </TouchableOpacity>
                ))}
             </ScrollView>
          </View>

          {/* 🛰️ RADAR WIDGET (RESIZED & REPOSITIONED) */}
          <View style={styles.radarWidget}>
             <RadarMap hubs={hubs} />
          </View>
          
        </ScrollView>

        {/* 🔗 GRID STATUS BAR */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.statusBar}>
           <Text style={styles.statusText}>UPLINK NODE: {activeNode.split(':').pop()}</Text>
           <View style={{ flexDirection: 'row', gap: 5 }}>
              <View style={[styles.signalBar, { height: 4 }]} />
              <View style={[styles.signalBar, { height: 7 }]} />
              <View style={[styles.signalBar, { height: 10 }]} />
           </View>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  
  topHud: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingVertical: 15,
    zIndex: 100
  },
  locationBox: { flexDirection: 'row', alignItems: 'center' },
  hudLabel: { color: '#64748b', fontSize: 7, fontWeight: '900', letterSpacing: 2 },
  hudValue: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  profileBtn: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  profileBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  menuContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 20 },

  sectorStatusContainer: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  sectionTitle: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0, 255, 204, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ffcc' },
  liveText: { color: '#00ffcc', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  
  hubCarousel: { paddingLeft: 25, paddingRight: 25, gap: 15 },
  loadingCarousel: { width: width - 50, height: 120, alignItems: 'center', justifyContent: 'center' },
  hubCard: { 
    width: 160, 
    height: 120, 
    borderRadius: 25, 
    padding: 15, 
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  hubIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0, 255, 204, 0.05)', alignItems: 'center', justifyContent: 'center' },
  hubName: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 10 },
  hubMetrics: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hubMetricText: { color: '#64748b', fontSize: 8, fontWeight: 'bold' },
  hubMetricStatus: { color: '#00ffcc', fontSize: 7, fontWeight: '900' },

  radarWidget: { marginTop: 40, opacity: 0.8 },

  statusBar: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: 80, 
    paddingHorizontal: 25, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 30 
  },
  statusText: { color: '#64748b', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  signalBar: { width: 3, backgroundColor: '#00ffcc', borderRadius: 1 }
});
