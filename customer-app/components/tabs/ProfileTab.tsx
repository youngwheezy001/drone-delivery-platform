import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  authEmail: string | undefined;
  signOut: () => Promise<void>;
}

export default function ProfileTab({ authEmail, signOut }: Props) {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);

  return (
    <View style={styles.pageContainer}>
      <Text style={styles.pageHeader}>Account Profile</Text>
      
      <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}><Ionicons name="person" size={40} color="#111827" /></View>
          <View>
            <Text style={styles.profileName}>{(authEmail || "Client").split('@')[0]}</Text>
            <Text style={styles.profileId}>{authEmail || "Drone Logistics Network"}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}><Ionicons name="location" size={20} color="#9CA3AF" style={{marginRight: 10}}/><Text style={styles.settingText}>Saved Addresses</Text></View>
            <Text style={{color: '#6B7280'}}>2 Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}><Ionicons name="card" size={20} color="#9CA3AF" style={{marginRight: 10}}/><Text style={styles.settingText}>Payment Methods</Text></View>
            <Text style={{color: '#6B7280'}}>Visa •••• 4242</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}><Ionicons name="notifications" size={20} color="#9CA3AF" style={{marginRight: 10}}/><Text style={styles.settingText}>Push Notifications</Text></View>
            <Switch value={pushNotifs} onValueChange={setPushNotifs} trackColor={{ false: '#374151', true: '#00ffcc' }} thumbColor="#fff" />
          </View>
          <View style={styles.settingRow}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}><Ionicons name="finger-print" size={20} color="#9CA3AF" style={{marginRight: 10}}/><Text style={styles.settingText}>Biometric Login</Text></View>
            <Switch value={biometricAuth} onValueChange={setBiometricAuth} trackColor={{ false: '#374151', true: '#00ffcc' }} thumbColor="#fff" />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={{color: '#000', fontWeight: 'bold', fontSize: 16}}>Secure Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: { flex: 1, backgroundColor: '#000', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 100 },
  pageHeader: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20, letterSpacing: 1 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, backgroundColor: '#111827', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#374151' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#00ffcc', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  profileName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  profileId: { color: '#9CA3AF', fontSize: 14, marginTop: 4 },
  sectionTitle: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 10, marginLeft: 5 },
  settingsGroup: { backgroundColor: '#111827', borderRadius: 16, borderWidth: 1, borderColor: '#374151', overflow: 'hidden', marginBottom: 25 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  settingText: { color: '#D1D5DB', fontSize: 16, fontWeight: '500' },
  logoutButton: { backgroundColor: '#00ffcc', padding: 16, borderRadius: 16, alignItems: 'center' },
});