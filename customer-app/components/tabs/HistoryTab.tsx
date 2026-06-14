import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  historyLogs: any[];
  loadingHistory: boolean;
  authEmail: string;
}

export default function HistoryTab({ historyLogs, loadingHistory, authEmail }: Props) {
  return (
    <View style={styles.pageContainer}>
      <Text style={styles.pageHeader}>My Flight Logs</Text>
      <Text style={{color: '#00ffcc', fontSize: 12, marginTop: -15, marginBottom: 20}}>Authorized User: {authEmail || 'CUST-APP-LIVE-01'}</Text>
      
      {loadingHistory ? (
        <ActivityIndicator size="large" color="#00ffcc" style={{ marginTop: 50 }} />
      ) : historyLogs.length === 0 ? (
        <Text style={styles.emptyText}>No flights found for your account.</Text>
      ) : (
        <ScrollView style={{ flex: 1, paddingBottom: 20 }}>
          {historyLogs.map((log, index) => (
            <View key={index} style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardId}>#{log.id.substring(0,8).toUpperCase()}</Text>
                <Text style={styles.cardSubText}>{log.date}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.statPill}><Ionicons name="checkmark-circle" size={16} color="#10b981" /><Text style={styles.statText}>{log.status}</Text></View>
                <View style={styles.statPill}><Ionicons name="swap-horizontal" size={16} color="#9CA3AF" /><Text style={styles.statText}>{log.distance_km} km</Text></View>
                <View style={styles.statPill}><Ionicons name="cube" size={16} color="#9CA3AF" /><Text style={styles.statText}>{log.weight} kg</Text></View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: { flex: 1, backgroundColor: '#000', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 100 },
  pageHeader: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20, letterSpacing: 1 },
  emptyText: { color: '#6B7280', fontSize: 16, textAlign: 'center', marginTop: 40 },
  dataCard: { backgroundColor: '#111827', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#1F2937', paddingBottom: 10, marginBottom: 10 },
  cardId: { color: '#00ffcc', fontWeight: 'bold', fontSize: 14 },
  cardSubText: { color: '#9CA3AF', fontSize: 12 },
  cardBody: { flexDirection: 'row', gap: 16 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: '#D1D5DB', fontSize: 14, fontWeight: '500' },
});