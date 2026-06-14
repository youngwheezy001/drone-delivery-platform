import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FleetStatusProps {
  activeDrones: number;
}

export const FleetStatus: React.FC<FleetStatusProps> = ({ activeDrones }) => {
  return (
    <View style={styles.fleetStatus}>
      <View style={styles.fleetHeader}>
         <Text style={styles.fleetTitle}>FLEET STATUS</Text>
         <Text style={styles.fleetVal}>{activeDrones} ACTIVE DRONES</Text>
      </View>
      <View style={styles.fleetBar}>
        <View style={styles.fleetFill} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fleetStatus: { 
    margin: 25, 
    backgroundColor: '#0f172a', 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  fleetHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12 
  },
  fleetTitle: { 
    color: '#64748b', 
    fontSize: 9, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
  fleetVal: { 
    color: '#00ffcc', 
    fontSize: 9, 
    fontWeight: 'bold' 
  },
  fleetBar: { 
    height: 6, 
    backgroundColor: '#1e293b', 
    borderRadius: 3, 
    overflow: 'hidden' 
  },
  fleetFill: { 
    width: '85%', 
    height: '100%', 
    backgroundColor: '#00ffcc' 
  },
});
