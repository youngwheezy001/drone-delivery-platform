import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Stat {
  label: string;
  value: string;
  icon: string;
  color: string;
}

const GLOBAL_METRICS: Stat[] = [
  { label: 'TOTAL SORTIES', value: '45,802', icon: 'airplane-takeoff', color: '#00ffcc' },
  { label: 'FLIGHT HOURS', value: '12,490h', icon: 'timer-outline', color: '#3b82f6' },
  { label: 'GRID COVERAGE', value: '98.4%', icon: 'radio-outline', color: '#ef4444' },
  { label: 'UAV FLEET', value: '342 Active', icon: 'drone', color: '#fbbf24' }
];

export const GlobalStats = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
         <Ionicons name="stats-chart" size={14} color="#64748b" />
         <Text style={styles.headerText}>GLOBAL GRID MANIFEST</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {GLOBAL_METRICS.map((stat, i) => (
          <View key={stat.label} style={styles.statCard}>
            <LinearGradient 
              colors={['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.6)']} 
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.statHeader}>
               <View style={[styles.iconBox, { backgroundColor: `${stat.color}15` }]}>
                  {stat.icon === 'drone' ? (
                     <MaterialCommunityIcons name="drone" size={14} color={stat.color} />
                  ) : stat.icon === 'airplane-takeoff' ? (
                     <MaterialCommunityIcons name="airplane-takeoff" size={14} color={stat.color} />
                  ) : (
                     <Ionicons name={stat.icon as any} size={14} color={stat.color} />
                  )}
               </View>
               <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            
            <View style={styles.statusIndicator}>
               <View style={[styles.pulseDot, { backgroundColor: stat.color }]} />
               <Text style={styles.statusText}>VERIFIED</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 10, marginBottom: 30 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    marginBottom: 15,
    gap: 8 
  },
  headerText: { 
    color: '#64748b', 
    fontSize: 9, 
    fontWeight: '900', 
    letterSpacing: 2 
  },
  scrollContent: { paddingLeft: 25, paddingRight: 25, gap: 15 },
  statCard: { 
    width: 140, 
    height: 110, 
    borderRadius: 22, 
    padding: 15, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'space-between'
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: '#64748b', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 5 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  pulseDot: { width: 4, height: 4, borderRadius: 2 },
  statusText: { color: '#64748b', fontSize: 6, fontWeight: '900', letterSpacing: 1 }
});
