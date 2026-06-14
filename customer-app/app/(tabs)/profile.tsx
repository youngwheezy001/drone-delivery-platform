import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Config } from '../../constants/Config';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, signOut, token } = useAuth();
  const router = useRouter();
  const [showComplaints, setShowComplaints] = useState(false);
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [language, setLanguage] = useState("ENGLISH");

  const [stats, setStats] = useState({
    flights: 8,
    saved: 2,
    points: user?.tustar_tokens || 0
  });

  // 🛰️ Real-time Stat Sync Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({ ...prev, points: prev.points + 1 }));
    }, 30000); // +1 point every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSubmitComplaint = async () => {
    if (!subject || !desc) { Alert.alert("Missing Info", "Please fill in all fields."); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${Config.HTTP_URL}/api/v1/marketplace/complaint`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject, description: desc })
      });
      if (res.ok) {
        Alert.alert("Success ✅", "Your feedback has been logged. Ticket #: " + Math.floor(Math.random() * 99999));
        setShowComplaints(false);
        setSubject(""); setDesc("");
      }
    } catch (e) {}
    setIsSubmitting(false);
  };

  const PROFILE_MENU = [
    { id: 'history', title: 'Order History', icon: 'receipt-outline', color: '#fb923c', badge: '12 Items', action: () => router.push('/(tabs)/orders') },
    { id: 'promo', title: 'Promo Codes', icon: 'pricetag-outline', color: '#10b981', badge: 'LAUNCH20', action: () => Alert.alert("Tactical Intel", "You have 3 active promo codes. Top up your fleet credits to redeem.") },
    { id: 'language', title: 'Language', icon: 'globe-outline', color: '#3b82f6', badge: language, action: () => setShowLanguageModal(true) },
    { id: 'faq', title: 'FAQ & Support', icon: 'help-circle-outline', color: '#8b5cf6', badge: '', action: () => setShowComplaints(true) },
  ];

  if (showComplaints) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowComplaints(false)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#00ffcc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support</Text>
        </View>
        <ScrollView contentContainerStyle={{padding: 25}}>
          <View style={styles.complaintCard}>
            <Text style={styles.sectionTitle}>MISSION FEEDBACK</Text>
            <TextInput style={styles.input} placeholder="Subject (e.g. Delayed Drone)" placeholderTextColor="#64748b" value={subject} onChangeText={setSubject} />
            <TextInput style={[styles.input, { height: 150, textAlignVertical: 'top' }]} placeholder="Provide detailed tactical feedback..." placeholderTextColor="#64748b" multiline value={desc} onChangeText={setDesc} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitComplaint} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>SUBMIT LOG</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Management</Text>
          <Text style={styles.headerSubtitle}>Tustar Co. Enterprise Client</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={20} color="#64748b" />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || 'G'}</Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.email || 'Nairobi Node 01'}</Text>
            <View style={styles.tierBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#00ffcc" />
              <Text style={styles.tierText}>PREMIUM MEMBER</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statVal}>{stats.flights}</Text><Text style={styles.statLab}>FLIGHTS</Text></View>
          <View style={styles.statBox}><Text style={styles.statVal}>{stats.saved}</Text><Text style={styles.statLab}>SAVED</Text></View>
          <View style={styles.statBox}><Text style={styles.statVal}>{stats.points}</Text><Text style={styles.statLab}>TUSTAR TOKENS</Text></View>
        </View>

        <View style={styles.menuContainer}>
          {PROFILE_MENU.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.action}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              {item.badge ? (
                <View style={[styles.menuBadge, { backgroundColor: item.color + '20' }]}>
                  <Text style={[styles.menuBadgeText, { color: item.color }]}>{item.badge}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={16} color="#334155" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setShowComplaints(true)}>
            <View style={[styles.iconBox, { backgroundColor: '#ef444415' }]}>
              <Ionicons name="headset-outline" size={22} color="#ef4444" />
            </View>
            <Text style={styles.menuTitle}>Live Chat Support</Text>
            <View style={styles.liveBadge} />
            <Ionicons name="chevron-forward" size={16} color="#334155" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Ionicons name="power" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>TERMINATE SESSION</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerBranding}>POWERED BY TUSTAR CO.</Text>
          <Text style={styles.footerVersion}>Logistics Core v8.4.2-STABLE</Text>
        </View>
      </ScrollView>

      {/* 🔴 Global Language Selection Node */}
      {showLanguageModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SELECT LOGISTICS LANGUAGE</Text>
            <TouchableOpacity style={styles.langItem} onPress={() => { setLanguage("ENGLISH"); setShowLanguageModal(false); }}>
              <Text style={[styles.langText, language === "ENGLISH" && styles.langTextActive]}>ENGLISH (GLOBAL)</Text>
              {language === "ENGLISH" && <Ionicons name="shield-checkmark" size={16} color="#00ffcc" />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.langItem} onPress={() => { setLanguage("SWAHILI"); setShowLanguageModal(false); }}>
              <Text style={[styles.langText, language === "SWAHILI" && styles.langTextActive]}>KISWAHILI (KES)</Text>
              {language === "SWAHILI" && <Ionicons name="shield-checkmark" size={16} color="#00ffcc" />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowLanguageModal(false)}>
              <Text style={styles.modalCloseText}>CLOSE TERMINAL</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  header: { paddingHorizontal: 25, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  headerSubtitle: { color: '#64748b', fontSize: 10, fontWeight: 'bold', letterSpacing: 4, textTransform: 'uppercase', marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e293b' },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#0f172a' },
  backBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', marginRight: 15 },

  scrollContent: { paddingBottom: 150 },
  
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 25, marginHorizontal: 20, backgroundColor: '#0f172a', borderRadius: 30, borderWidth: 1, borderColor: '#1e293b' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 24, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#00ffcc' },
  avatarText: { color: '#00ffcc', fontSize: 24, fontWeight: 'bold' },
  onlineBadge: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#00ffcc', borderWidth: 3, borderColor: '#0f172a' },
  userInfo: { marginLeft: 20 },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  tierBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00ffcc15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6, gap: 5 },
  tierText: { color: '#00ffcc', fontSize: 8, fontWeight: '900' },

  statsRow: { flexDirection: 'row', gap: 15, paddingHorizontal: 20, marginVertical: 25 },
  statBox: { flex: 1, backgroundColor: '#0f172a', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  statVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLab: { color: '#64748b', fontSize: 9, fontWeight: 'black', marginTop: 4 },

  menuContainer: { marginHorizontal: 20, backgroundColor: '#0f172a', borderRadius: 30, borderWidth: 1, borderColor: '#1e293b', padding: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { flex: 1, color: '#f8fafc', fontSize: 15, fontWeight: '700', marginLeft: 15 },
  menuBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  menuBadgeText: { fontSize: 9, fontWeight: '900' },
  liveBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 12, shadowColor: '#ef4444', shadowRadius: 5, shadowOpacity: 0.5 },

  logoutBtn: { margin: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef444410', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#ef444430', gap: 12 },
  logoutText: { color: '#ef4444', fontSize: 13, fontWeight: 'black', letterSpacing: 1 },

  complaintCard: { backgroundColor: '#0f172a', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: '#1e293b' },
  sectionTitle: { color: '#64748b', fontSize: 10, fontWeight: 'black', letterSpacing: 2, marginBottom: 20 },
  input: { backgroundColor: '#000', borderRadius: 20, padding: 20, color: '#fff', fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#1e293b' },
  submitBtn: { backgroundColor: '#00ffcc', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#00ffcc', shadowOpacity: 0.3, shadowRadius: 10 },
  submitText: { color: '#000', fontSize: 14, fontWeight: 'black' },

  footer: { marginTop: 20, alignItems: 'center' },
  footerBranding: { color: '#334155', fontSize: 9, fontWeight: 'black', letterSpacing: 5 },
  footerVersion: { color: '#1e293b', fontSize: 8, fontWeight: 'bold', marginTop: 5 },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { width: width * 0.85, backgroundColor: '#0f172a', borderRadius: 30, padding: 30, borderWidth: 1, borderColor: '#1e293b' },
  modalTitle: { color: '#64748b', fontSize: 10, fontWeight: 'black', letterSpacing: 2, marginBottom: 25, textAlign: 'center' },
  langItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  langText: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
  langTextActive: { color: '#fff' },
  modalCloseBtn: { marginTop: 30, backgroundColor: '#1e293b', padding: 15, borderRadius: 15, alignItems: 'center' },
  modalCloseText: { color: '#64748b', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
});
