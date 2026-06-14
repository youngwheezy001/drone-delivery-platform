import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function CustomNavBar({ activeTab, setActiveTab }: Props) {
  return (
    <View style={styles.navBar}>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Map")}>
        <Ionicons name="map" size={24} color={activeTab === "Map" ? "#00ffcc" : "#6B7280"} />
        <Text style={[styles.navText, activeTab === "Map" && styles.navTextActive]}>Dispatch</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("History")}>
        <Ionicons name="list" size={24} color={activeTab === "History" ? "#00ffcc" : "#6B7280"} />
        <Text style={[styles.navText, activeTab === "History" && styles.navTextActive]}>History</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Fleet")}>
        <Ionicons name="airplane" size={24} color={activeTab === "Fleet" ? "#00ffcc" : "#6B7280"} />
        <Text style={[styles.navText, activeTab === "Fleet" && styles.navTextActive]}>Fleet</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Profile")}>
        <Ionicons name="person" size={24} color={activeTab === "Profile" ? "#00ffcc" : "#6B7280"} />
        <Text style={[styles.navText, activeTab === "Profile" && styles.navTextActive]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111827', paddingHorizontal: 30, paddingTop: 16, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#374151' },
  navItem: { alignItems: 'center' },
  navText: { color: '#6B7280', fontSize: 10, marginTop: 4, fontWeight: '600' },
  navTextActive: { color: '#00ffcc' },
});