import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Config, discoverActiveNode } from '../../constants/Config';
import { useAuth } from '../../context/AuthContext';
import { TelemetryHUD } from '../../components/TelemetryHUD';
import { LiveTrackingMap } from '../../components/LiveTrackingMap';
import { DeliveryStatusCard } from '../../components/DeliveryStatusCard';
import { DroneScanFeed } from '../../components/DroneScanFeed';
import { DroneTelemetry, FlightPhase, TelemetryPacket } from '../../types';

export default function OrdersScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Tracking" | "History">("Tracking");
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [activeMission, setActiveMission] = useState<any>(null);
  const [loadingMission, setLoadingMission] = useState(true);
  const [telemetry, setTelemetry] = useState<DroneTelemetry | null>(null);
  const [status, setStatus] = useState<FlightPhase>("SCHEDULED");
  
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (activeTab === "History") fetchHistory();
    if (activeTab === "Tracking") fetchActiveMission();
    
    return () => {
      if (ws.current) ws.current.close();
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeMission && (activeMission.status === "IN_TRANSIT" || activeMission.status === "DISPATCHED")) {
      connectTelemetry(activeMission.id);
    } else {
      setTelemetry(null);
    }
  }, [activeMission]);

  const fetchActiveMission = async () => {
    setLoadingMission(true);
    try {
      const res = await fetch(`${Config.HTTP_URL}/api/v1/deliveries/history/${user?.email}`);
      if (res.ok) {
        const missions = await res.json();
        const latest = missions.find((m: any) => ["SCHEDULED", "DISPATCHED", "IN_TRANSIT", "ROUTE_CALCULATED", "PREPARING"].includes(m.status));
        if (latest) {
          setActiveMission(latest);
          setStatus(latest.status);
        } else {
          setActiveMission(null);
        }
      }
    } catch (e) {}
    setLoadingMission(false);
  };

  const connectTelemetry = async (deliveryId: string) => {
    if (ws.current) ws.current.close();
    
    // Discover Active Node and convert to ws://
    const activeHttpNode = await discoverActiveNode();
    const activeWsNode = activeHttpNode.replace('http://', 'ws://').replace('https://', 'wss://');
    const wsUrl = `${activeWsNode}/api/v1/telemetry/stream/${deliveryId}`;
    console.log(`🛰️ CONNECTING TELEMETRY: ${wsUrl}`);
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onmessage = (e) => {
      try {
        const data: TelemetryPacket = JSON.parse(e.data);
        setTelemetry(data.telemetry);
        setStatus(data.status);
      } catch (err) {
        console.error("Telemetry Parse Error", err);
      }
    };

    ws.current.onerror = (e) => console.log("Telemetry Error", e);
    ws.current.onclose = () => console.log("Telemetry Link Terminated");
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${Config.HTTP_URL}/api/v1/deliveries/history/${user?.email}`);
      if (res.ok) setHistory(await res.json());
    } catch (e) {}
    setLoadingHistory(false);
  };

  const handleSOS = () => {
    Alert.alert(
      "🛑 TACTICAL EMERGENCY",
      "Immediate drone abort signal transmitted. Logistics hub notified.",
      [{ text: "ACKNOWLEDGE", style: "destructive" }]
    );
  };

  const currentRoute = activeMission?.route_json?.map((wp: [number, number]) => ({
    latitude: wp[0],
    longitude: wp[1]
  })) || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Active Missions</Text>
          <Text style={styles.headerSubtitle}>GLOBAL LOGISTICS NETWORK</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={[styles.sosBtn, { borderColor: '#3b82f6', backgroundColor: '#3b82f620' }]} onPress={() => Alert.alert("Tustar Courier", "P2P Dispatch Interface opening...")}>
            <Ionicons name="paper-plane-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {["Tracking", "History"].map((tab) => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]} 
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "Tracking" ? (
        <View style={{flex: 1}}>
          <DroneScanFeed />
          <LiveTrackingMap 
            droneLocation={telemetry || (activeMission ? { latitude: activeMission.origin_lat, longitude: activeMission.origin_lon, altitude_m: 0, speed_ms: 0 } : null)}
            route={currentRoute}
            status={status}
          />
          
          <View style={styles.trackerOverlay}>
            {telemetry && <TelemetryHUD telemetry={telemetry} />}

            <DeliveryStatusCard 
              status={status}
              missionId={activeMission?.id || "TUSTAR-NX"}
              eta={status === "ARRIVED" ? "DOCKING" : "CALCULATING..."}
              scheduledAt={activeMission?.scheduled_at}
              aiAssessment={activeMission?.ai_assessment}
              progress={telemetry ? 0.5 : 0} 
              onContactHub={() => router.push({ pathname: "/chat", params: { orderId: activeMission?.id, hubId: activeMission?.company_id || "HUB-01" } })}
            />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loadingHistory ? (
            <ActivityIndicator color="#00ffcc" style={{marginTop: 50}} />
          ) : history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#1e293b" />
              <Text style={styles.emptyText}>No archival logs found.</Text>
            </View>
          ) : (
            history.map((h: any) => (
              <TouchableOpacity key={h.id} style={styles.historyCard} onPress={() => {}}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyId}>#{h.id.substring(0,8).toUpperCase()}</Text>
                  <View style={styles.completedBadge}><Text style={styles.completedText}>ARCHIVED</Text></View>
                </View>
                <View style={styles.historyBody}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.historyDetail}>Delivery Success • {h.package_weight_kg} kg • {new Date(h.created_at).toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  header: { 
    paddingHorizontal: 25, 
    marginBottom: 25, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 28, 
    fontWeight: '900', 
    letterSpacing: -1.5,
    textTransform: 'uppercase'
  },
  headerSubtitle: { 
    color: '#00ffcc', 
    fontSize: 8, 
    fontWeight: '900', 
    letterSpacing: 4, 
    marginTop: 2,
    opacity: 0.8
  },
  sosBtn: { 
    width: 52, 
    height: 52, 
    borderRadius: 20, 
    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(239, 68, 68, 0.3)' 
  },
  
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(0, 255, 204, 0.03)', 
    marginHorizontal: 25, 
    padding: 6, 
    borderRadius: 24, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(0, 255, 204, 0.1)' 
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 18 },
  activeTab: { backgroundColor: 'rgba(0, 255, 204, 0.1)' },
  tabText: { color: 'rgba(0, 255, 204, 0.3)', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  activeTabText: { color: '#00ffcc' },

  trackerOverlay: { 
    position: 'absolute', 
    bottom: 30, 
    left: 15, 
    right: 15 
  },

  scrollContent: { padding: 25, paddingBottom: 150 },
  historyCard: { 
    backgroundColor: '#0f172a', 
    padding: 24, 
    borderRadius: 32, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  historyId: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  completedBadge: { 
    backgroundColor: 'rgba(0, 255, 204, 0.05)', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 204, 0.1)'
  },
  completedText: { color: '#00ffcc', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  historyBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyDetail: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  
  emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.1 },
  emptyText: { color: '#fff', fontSize: 11, marginTop: 15, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
});

