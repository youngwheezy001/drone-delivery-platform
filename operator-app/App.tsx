import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert, SafeAreaView } from 'react-native';

const API_URL = "http://10.0.7.147:8000"; 
// Replace with dynamic node discovery in production

export default function App() {
  const [activeTab, setActiveTab] = useState<"MISSIONS" | "MAINTENANCE">("MISSIONS");
  const [missions, setMissions] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      if (activeTab === "MISSIONS") {
        const response = await fetch(`${API_URL}/api/v1/deliveries/seller/active`);
        const data = await response.json();
        const loadable = data.filter((m: any) => m.status === 'PREPARING' || m.status === 'READY');
        setMissions(loadable);
      } else {
        const response = await fetch(`${API_URL}/api/v1/fleet/maintenance`);
        const data = await response.json();
        setMaintenance(data);
      }
    } catch (e) {
      console.log("Error fetching data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleClearTakeoff = async (id: string) => {
    Alert.alert(
      "CONFIRM TAKEOFF",
      `Are you sure the payload for mission ${id} is securely locked and the drone area is clear?`,
      [
        { text: "CANCEL", style: "cancel" },
        { 
          text: "CLEAR FOR TAKEOFF", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/api/v1/deliveries/${id}/takeoff-clearance`, { method: 'POST' });
              if (res.ok) {
                Alert.alert("SUCCESS", "Drone released to Auto-Dispatcher.");
                fetchData();
              } else {
                Alert.alert("ERROR", "Failed to clear drone.");
              }
            } catch (e) {
              Alert.alert("NETWORK ERROR", "Could not reach HQ.");
            }
          } 
        }
      ]
    );
  };

  const handleRepairDrone = async (drone_id: string) => {
    Alert.alert(
      "CONFIRM REPAIR",
      `Mark drone ${drone_id} as repaired and clear it for flight duty?`,
      [
        { text: "CANCEL", style: "cancel" },
        { 
          text: "REPAIR COMPLETE", 
          style: "default",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/api/v1/fleet/maintenance/${drone_id}/repair`, { method: 'POST' });
              if (res.ok) {
                Alert.alert("SUCCESS", "Drone cleared for flight duty.");
                fetchData();
              } else {
                Alert.alert("ERROR", "Failed to repair drone.");
              }
            } catch (e) {
              Alert.alert("NETWORK ERROR", "Could not reach HQ.");
            }
          } 
        }
      ]
    );
  };

  const renderMission = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.missionId}>{item.id}</Text>
        <View style={styles.statusBadge}>
           <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>WEIGHT: {item.weight}kg</Text>
        <Text style={styles.detailText}>DIST: {item.distance_km}km</Text>
      </View>

      <TouchableOpacity 
        style={styles.takeoffButton}
        onPress={() => handleClearTakeoff(item.id)}
      >
        <Text style={styles.takeoffText}>CLEAR FOR TAKEOFF</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMaintenance = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.missionId}>{item.id}</Text>
        <View style={[styles.statusBadge, { borderColor: '#ef4444', backgroundColor: '#ef444420' }]}>
           <Text style={[styles.statusText, { color: '#ef4444' }]}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>BATTERY: {item.battery_health}%</Text>
        <Text style={styles.detailText}>MILEAGE: {Math.floor(item.distance_flown_km)}km</Text>
      </View>

      <TouchableOpacity 
        style={[styles.takeoffButton, { borderColor: '#10b981', backgroundColor: '#10b98110' }]}
        onPress={() => handleRepairDrone(item.id)}
      >
        <Text style={[styles.takeoffText, { color: '#10b981' }]}>CERTIFY REPAIR COMPLETE</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GROUND CREW TERMINAL</Text>
        <Text style={styles.headerSub}>HUB OPS • NAIROBI KILIMANI</Text>
      </View>

      <View style={styles.tabsContainer}>
         <TouchableOpacity 
           style={[styles.tab, activeTab === "MISSIONS" && styles.activeTab]}
           onPress={() => setActiveTab("MISSIONS")}
         >
           <Text style={[styles.tabText, activeTab === "MISSIONS" && styles.activeTabText]}>MISSIONS</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.tab, activeTab === "MAINTENANCE" && styles.activeTab]}
           onPress={() => setActiveTab("MAINTENANCE")}
         >
           <Text style={[styles.tabText, activeTab === "MAINTENANCE" && styles.activeTabText]}>MAINTENANCE</Text>
         </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00ffcc" style={{ marginTop: 50 }} />
      ) : activeTab === "MISSIONS" ? (
        missions.length === 0 ? (
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>NO PAYLOADS AWAITING LOAD</Text>
          </View>
        ) : (
          <FlatList
            data={missions}
            keyExtractor={item => item.id}
            renderItem={renderMission}
            contentContainerStyle={styles.list}
          />
        )
      ) : (
        maintenance.length === 0 ? (
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>ALL DRONES OPERATIONAL</Text>
          </View>
        ) : (
          <FlatList
            data={maintenance}
            keyExtractor={item => item.id}
            renderItem={renderMaintenance}
            contentContainerStyle={styles.list}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#111',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#00ffcc',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerSub: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 4,
    letterSpacing: 4,
    marginTop: 4
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#00ffcc'
  },
  tabText: {
    color: '#666',
    fontWeight: 'bold',
    letterSpacing: 1
  },
  activeTabText: {
    color: '#00ffcc'
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  missionId: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: '#ffaa0020',
    borderWidth: 1,
    borderColor: '#ffaa00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#ffaa00',
    fontSize: 10,
    fontWeight: '900',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  detailText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  takeoffButton: {
    backgroundColor: '#00ffcc10',
    borderWidth: 2,
    borderColor: '#00ffcc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  takeoffText: {
    color: '#00ffcc',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#444',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  }
});
