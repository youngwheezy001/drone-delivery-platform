import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const DroneScanFeed = () => {
  const [scanAnim] = useState(new Animated.Value(0));
  const [noiseAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(noiseAnim, { toValue: 0.2, duration: 100, useNativeDriver: true }),
        Animated.timing(noiseAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* 🟢 SIMULATED THERMAL BASE */}
      <LinearGradient 
        colors={['#064e3b', '#022c22']} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* 📡 STATIC NOISE OVERLAY */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity: noiseAnim }]} />

      {/* 🧭 HUD GRID */}
      <View style={styles.gridContainer}>
        {[...Array(6)].map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i+1)*16}%` }]} />
        ))}
        {[...Array(4)].map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i+1)*25}%` }]} />
        ))}
      </View>

      {/* 🎯 TARGETING CROSSHAIR */}
      <View style={styles.crosshairContainer}>
        <View style={styles.crosshair} />
      </View>

      {/* 🛰️ SCANLINE */}
      <Animated.View 
        style={[
          styles.scanLine, 
          { transform: [{ translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }) }] }
        ]} 
      />

      {/* 📊 TELEMETRY OVERLAY */}
      <View style={styles.telemetryOverlay}>
         <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>BVLOS LINK</Text>
            <Text style={styles.telemetryValue}>98%</Text>
         </View>
         <View style={[styles.telemetryRow, { marginTop: 4 }]}>
            <Text style={styles.telemetryLabel}>THERMAL SCAN</Text>
            <Text style={styles.telemetryValue}>ACTIVE</Text>
         </View>
      </View>

      <View style={styles.cornerBranding}>
         <MaterialCommunityIcons name="drone" size={10} color="#00ffcc" />
         <Text style={styles.brandingText}>TUSTAR OPTICS v4.2</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    height: 150, 
    borderRadius: 20, 
    overflow: 'hidden', 
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 204, 0.2)',
    marginHorizontal: 15,
    marginBottom: 15
  },
  gridContainer: { ...StyleSheet.absoluteFillObject, opacity: 0.1 },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#00ffcc' },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#00ffcc' },
  
  crosshairContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  crosshair: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#00ffcc', opacity: 0.3 },
  
  scanLine: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    height: 2, 
    backgroundColor: 'rgba(0, 255, 204, 0.4)', 
    shadowColor: '#00ffcc', 
    shadowOpacity: 0.5, 
    shadowRadius: 10 
  },
  
  telemetryOverlay: { position: 'absolute', top: 12, left: 12 },
  telemetryRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  telemetryLabel: { color: 'rgba(0, 255, 204, 0.4)', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  telemetryValue: { color: '#00ffcc', fontSize: 7, fontWeight: '900' },
  
  cornerBranding: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  brandingText: { color: 'rgba(0, 255, 204, 0.4)', fontSize: 6, fontWeight: '900', letterSpacing: 1.5 }
});
