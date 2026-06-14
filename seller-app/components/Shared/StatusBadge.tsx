import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case "SCHEDULED": return { main: '#fb923c', bg: '#fb923c15' };
      case "DISPATCHED": return { main: '#00ffcc', bg: '#00ffcc15' };
      case "PREPARING": return { main: '#f97316', bg: '#f9731615' };
      case "READY": return { main: '#10b981', bg: '#10b98115' };
      case "EN_ROUTE": return { main: '#3b82f6', bg: '#3b82f615' };
      default: return { main: '#64748b', bg: '#64748b15' };
    }
  };

  const colors = getStatusColor();
  
  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
        <View style={[styles.statusDot, { backgroundColor: colors.main }]} />
        <Text style={[styles.statusText, { color: colors.main }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 10, 
    gap: 6 
  },
  statusDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3 
  },
  statusText: { 
    fontSize: 10, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
});
