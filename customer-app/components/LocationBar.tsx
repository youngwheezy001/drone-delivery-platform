import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationBarProps {
  address: string;
  isLoading: boolean;
}

export const LocationBar: React.FC<LocationBarProps> = ({ address, isLoading }) => {
  return (
    <View style={styles.locationBar}>
      <View style={styles.locIcon}>
        <Ionicons name="navigate" size={16} color="#00ffcc" />
      </View>
      <View style={styles.locTextContainer}>
        <Text style={styles.locLabel}>CURRENT NODE</Text>
        <Text style={styles.addressText} numberOfLines={1}>{address}</Text>
      </View>
      {isLoading && <ActivityIndicator size="small" color="#00ffcc" />}
    </View>
  );
};

const styles = StyleSheet.create({
  locationBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0f172a', 
    marginHorizontal: 20, 
    padding: 18, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#1e293b', 
    marginBottom: 25 
  },
  locIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    backgroundColor: '#00ffcc15', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  locTextContainer: { 
    marginLeft: 15, 
    flex: 1 
  },
  locLabel: { 
    color: '#64748b', 
    fontSize: 8, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
  addressText: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: 'bold', 
    marginTop: 2 
  },
});
