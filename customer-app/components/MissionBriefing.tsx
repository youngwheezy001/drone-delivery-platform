import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const INTEL_STRINGS = [
  "SECTOR 7: HIGH DELIVERY DENSITY — GRID REBALANCING IN PROGRESS",
  "ATMOSPHERIC TELEMETRY: 100% SIGNAL STRENGTH — OPTIMAL FLIGHT CORRIDOR",
  "UAV SWARM HEALTH: NOMINAL across all local hub nodes",
  "MISSION AUTH READY: Biometric secure-link established",
  "NAIROBI CENTRAL GRID: No flight obstructions detected",
  "BEYOND VISUAL LINE OF SIGHT (BVLOS): Active authorization granted",
  "GEOFENCE INTEGRITY: Verified for active sector delivery"
];

export const MissionBriefing = () => {
  const [index, setIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const cycleIntel = () => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.delay(4000),
        Animated.timing(fadeAnim, { toValue: 0, duration: 1000, useNativeDriver: true })
      ]).start(() => {
        setIndex((prev) => (prev + 1) % INTEL_STRINGS.length);
      });
    };

    cycleIntel();
    const interval = setInterval(cycleIntel, 6500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.6)']} 
        style={styles.glass}
      >
        <View style={styles.header}>
            <View style={styles.aiIcon}>
               <Ionicons name="hardware-chip" size={12} color="#00ffcc" />
            </View>
            <Text style={styles.headerText}>AI MISSION INTELLIGENCE</Text>
        </View>
        <Animated.View style={[styles.intelBox, { opacity: fadeAnim }]}>
           <Text style={styles.intelText}>{INTEL_STRINGS[index]}</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginHorizontal: 25, 
    marginTop: 10,
    marginBottom: 20
  },
  glass: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8
  },
  aiIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerText: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2
  },
  intelBox: {
    minHeight: 30,
    justifyContent: 'center'
  },
  intelText: {
    color: '#00ffcc',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 16
  }
});
