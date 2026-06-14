import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FLEET_DATA = [
  { id: "DRN-01", name: "Aero Swift v2", role: "VTOL Medical Courier", speed: "80 km/h", payload: "2.0 kg", range: "25 km", wind: "Max 35 km/h", status: "Active in Area", image: "https://images.unsplash.com/photo-1579820010410-c10411aaaa88?q=80&w=600&auto=format&fit=crop" },
  { id: "DRN-02", name: "HeavyLift Titan", role: "Multirotor Bulk Transport", speed: "50 km/h", payload: "5.0 kg", range: "15 km", wind: "Max 25 km/h", status: "At Base (Charging)", image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=600&auto=format&fit=crop" },
  { id: "DRN-03", name: "SkyCruiser X", role: "Fixed-Wing Long Range", speed: "110 km/h", payload: "1.5 kg", range: "80 km", wind: "Max 50 km/h", status: "In Flight (Mission #092)", image: "https://images.unsplash.com/photo-1527011045974-4ec5da898e3b?q=80&w=600&auto=format&fit=crop" },
];

export default function FleetTab() {
  return (
    <View style={styles.pageContainer}>
      <Text style={styles.pageHeader}>Our Fleet</Text>
      <Text style={{color: '#9CA3AF', fontSize: 14, marginTop: -10, marginBottom: 20}}>Next-Gen Operational Aerodynamics</Text>
      
      <ScrollView style={{ flex: 1, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {FLEET_DATA.map((drone, index) => (
          <View key={index} style={styles.dataCard}>
            <Image source={{ uri: drone.image }} style={styles.droneImage} />
            <View style={{ padding: 16 }}>
              <View style={styles.cardHeader}>
                <View style={{flex: 1}}>
                  <Text style={{color: '#fff', fontSize: 20, fontWeight: 'bold'}}>{drone.name}</Text>
                  <Text style={{color: '#00ffcc', fontSize: 12, marginTop: 2}}>{drone.role}</Text>
                </View>
                <View style={[styles.statusBadge, drone.status.includes("Active") ? {borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)'} : {borderColor: '#6B7280'}]}>
                  <Text style={[styles.statusBadgeText, drone.status.includes("Active") && {color: '#10b981'}]}>{drone.status}</Text>
                </View>
              </View>
              <View style={styles.specGrid}>
                <View style={styles.specBox}><Ionicons name="speedometer" size={16} color="#9CA3AF" /><Text style={styles.specLabel}>Top Speed</Text><Text style={styles.specValue}>{drone.speed}</Text></View>
                <View style={styles.specBox}><Ionicons name="cube" size={16} color="#9CA3AF" /><Text style={styles.specLabel}>Max Payload</Text><Text style={styles.specValue}>{drone.payload}</Text></View>
                <View style={styles.specBox}><Ionicons name="pulse" size={16} color="#9CA3AF" /><Text style={styles.specLabel}>Max Range</Text><Text style={styles.specValue}>{drone.range}</Text></View>
                <View style={styles.specBox}><Ionicons name="water" size={16} color="#9CA3AF" /><Text style={styles.specLabel}>Wind Resist.</Text><Text style={styles.specValue}>{drone.wind}</Text></View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: { flex: 1, backgroundColor: '#000', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 100 },
  pageHeader: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20, letterSpacing: 1 },
  dataCard: { backgroundColor: '#111827', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#374151', overflow: 'hidden' },
  droneImage: { width: '100%', height: 160, backgroundColor: '#1F2937' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 0 },
  statusBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#6B7280' },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15, borderTopWidth: 1, borderTopColor: '#1F2937', paddingTop: 15 },
  specBox: { width: '48%', backgroundColor: '#1F2937', padding: 12, borderRadius: 12 },
  specLabel: { color: '#9CA3AF', fontSize: 10, marginTop: 6, textTransform: 'uppercase' },
  specValue: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
});