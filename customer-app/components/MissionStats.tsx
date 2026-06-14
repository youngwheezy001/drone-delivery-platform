import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MissionPlan } from '../types';

interface MissionStatsProps {
  planData: MissionPlan;
}

export const MissionStats: React.FC<MissionStatsProps> = ({ planData }) => {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statLab}>DISTANCE</Text>
        <Text style={styles.statVal}>{planData.estimated_distance_km} KM</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statLab}>EST. TIME</Text>
        <Text style={styles.statVal}>{planData.eta_minutes} MINS</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statLab}>STATUS</Text>
        <Text style={[styles.statVal, { color: '#10b981' }]}>VIABLE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#0f172a', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  statItem: { 
    alignItems: 'center' 
  },
  statLab: { 
    color: '#64748b', 
    fontSize: 8, 
    fontWeight: '900', 
    marginBottom: 5 
  },
  statVal: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});
