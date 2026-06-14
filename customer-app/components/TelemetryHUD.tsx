import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DroneTelemetry } from '../types';

interface TelemetryHUDProps {
  telemetry: any; // Using any for flexibility with new payload fields
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ telemetry }) => {
  return (
    <View style={styles.container}>
      {/* HUD Header */}
      <View style={styles.hudHeader}>
        <View className="flex-row items-center">
          <View style={styles.pulseDot} />
          <Text style={styles.hudTitle}>UAV_LINK_ACTIVE</Text>
        </View>
        <Text style={styles.hudSub}>CRYPTO_LINK: SECURE</Text>
      </View>

      <View style={styles.teleRow}>
        <View style={styles.teleItem}>
          <Text style={styles.teleLab}>ALTITUDE</Text>
          <View style={styles.valRow}>
            <Text style={styles.teleVal}>{telemetry.altitude_m?.toFixed(0) || "0"}</Text>
            <Text style={styles.unit}>M</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.teleItem}>
          <Text style={styles.teleLab}>VELOCITY</Text>
          <View style={styles.valRow}>
            <Text style={styles.teleVal}>{(telemetry.speed_ms * 3.6).toFixed(0)}</Text>
            <Text style={styles.unit}>KM/H</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.teleItem}>
          <Text style={styles.teleLab}>BATTERY</Text>
          <View style={styles.valRow}>
            <Text style={[styles.teleVal, (telemetry.battery || 78) < 20 && {color: '#ef4444'}]}>
              {telemetry.battery || 78}
            </Text>
            <Text style={styles.unit}>%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
    paddingHorizontal: 20,
    paddingVertical: 18, 
    borderRadius: 32, 
    marginBottom: 20, 
    borderWidth: 1.5, 
    borderColor: 'rgba(0, 255, 204, 0.25)',
    shadowColor: '#00ffcc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ffcc',
    marginRight: 8,
  },
  hudTitle: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  hudSub: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 7,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  teleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  teleItem: { 
    flex: 1,
    alignItems: 'center' 
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  teleLab: { 
    color: 'rgba(255, 255, 255, 0.4)', 
    fontSize: 7, 
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  teleVal: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  unit: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  }
});
