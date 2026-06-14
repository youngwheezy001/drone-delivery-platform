import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Metrics } from '../../types';

interface MetricsBarProps {
  metrics: Metrics;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics }) => {
  return (
    <View style={styles.metricsContainer}>
      <View style={styles.metricBox}>
        <Text style={styles.metricLabel}>FLIGHTS</Text>
        <Text style={styles.metricValue}>{metrics.flightsToday}</Text>
      </View>
      <View style={styles.metricBox}>
        <Text style={styles.metricLabel}>REVENUE</Text>
        <Text style={styles.metricValue}>K{metrics.revenueToday}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metricsContainer: { 
    flexDirection: 'row', 
    gap: 15, 
    marginBottom: 20 
  },
  metricBox: { 
    flex: 1, 
    backgroundColor: '#0f172a', 
    padding: 15, 
    borderRadius: 20, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  metricLabel: { 
    color: '#64748b', 
    fontSize: 8, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  metricValue: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});
