import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Dimensions, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface SidebarMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function SidebarMenu({ visible, onClose }: SidebarMenuProps) {
  const { signOut, user } = useAuth();

  const MENU_ITEMS = [
    { id: 'home', label: 'Homepage', icon: 'home-outline', action: () => { router.replace('/landing'); onClose(); } },
    { id: 'account', label: 'My Account', icon: 'person-outline', action: () => { router.push('/(tabs)/profile'); onClose(); } },
    { id: 'orders', label: 'My Orders', icon: 'receipt-outline', action: () => { router.push('/(tabs)/orders'); onClose(); } },
    { id: 'chat', label: 'Live Chat', icon: 'chatbubbles-outline', action: () => { router.push('/support'); onClose(); } },
    { id: 'help', label: 'Help & FAQ', icon: 'help-circle-outline', action: () => { router.push('/(tabs)/profile'); onClose(); } },
    { id: 'terms', label: 'Terms & Conditions', icon: 'document-text-outline', action: () => { onClose(); } },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose} 
      />
      
      <Animated.View style={styles.menuContainer}>
        <View style={styles.header}>
          <View style={styles.profileBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || 'G'}</Text>
            </View>
            <View>
              <Text style={styles.userEmail} numberOfLines={1}>{user?.email || 'Guest'}</Text>
              <Text style={styles.statusBadge}>Verified Logistics User</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.menuList}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.action}>
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={22} color="#00ffcc" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]} 
            onPress={() => { signOut(); onClose(); }}
          >
            <View style={[styles.iconBox, { backgroundColor: '#ef444420' }]}>
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            </View>
            <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.versionHeader}>POWERED BY</Text>
          <Text style={styles.brandText}>TUSTAR CO.</Text>
          <Text style={styles.versionFooter}>AERIAL LOGISTICS v7.0.0</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  menuContainer: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    bottom: 0, 
    width: width * 0.8, 
    backgroundColor: '#0f172a',
    paddingTop: 60,
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    marginBottom: 40 
  },
  profileBox: { flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1 },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#1e293b', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: '#00ffcc' 
  },
  avatarText: { color: '#00ffcc', fontWeight: 'bold', fontSize: 20 },
  userEmail: { color: '#fff', fontSize: 16, fontWeight: 'bold', width: width * 0.4 },
  statusBadge: { color: '#64748b', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  menuList: { paddingHorizontal: 15 },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 10,
    backgroundColor: 'transparent'
  },
  iconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: '#1e293b', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  menuLabel: { color: '#fff', fontSize: 15, fontWeight: '800', marginLeft: 15 },
  logoutItem: { marginTop: 20, backgroundColor: '#ef444405' },

  footer: { 
    position: 'absolute', 
    bottom: 40, 
    left: 0, 
    right: 0, 
    alignItems: 'center' 
  },
  versionHeader: { color: '#334155', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  brandText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 4, marginVertical: 4 },
  versionFooter: { color: '#334155', fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
});
