import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, StatusBar, RefreshControl, Image, Modal, BackHandler, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { jwtDecode } from 'jwt-decode';
import { Config, discoverActiveNode } from './constants/Config';
import { LinearGradient } from 'expo-linear-gradient';

// Import Types
import { Order, Product, Category, Metrics, ChatMessage, Hub } from './types';

// Import Components
import { LoginScreen } from './components/Auth/LoginScreen';
import { OrderCard } from './components/Orders/OrderCard';
import { MetricsBar } from './components/Orders/MetricsBar';
import { ProductTile } from './components/Inventory/ProductTile';
import { ProductModal } from './components/Inventory/ProductModal';
import { ChatModal } from './components/Shared/ChatModal';
import { SettingsModal } from './components/Shared/SettingsModal';
import { POSIntegrationPanel } from './components/Settings/POSIntegrationPanel';

export default function App() {
  // --- CORE STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);
  const [isStandaloneForced, setIsStandaloneForced] = useState(false);
  const [tabletIdentity, setTabletIdentity] = useState("TUSTAR_HQ"); 
  const [authToken, setAuthToken] = useState("MOCK_PRESENTATION_TOKEN");
  const [activeNode, setActiveNode] = useState(Config.HTTP_URL);

  // --- DISCOVERY STATE (FOR LOGIN) ---
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [isHubsLoading, setIsHubsLoading] = useState(false);
  const [hasDiscoveryTimedOut, setHasDiscoveryTimedOut] = useState(false);
  const [manualIP, setManualIP] = useState("");

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<"ORDERS" | "INVENTORY" | "POS">("ORDERS");
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [language, setLanguage] = useState("ENGLISH");

  // --- ORDERS & METRICS STATE ---
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ flightsToday: 0, revenueToday: "0", avgPrepTime: "0m 0s" });
  const [isDemoMode, setIsDemoMode] = useState(false);

  // --- INVENTORY STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // --- BOOTSTRAP ---
  useEffect(() => {
    const bootstrap = async () => {
      const node = await discoverActiveNode();
      setActiveNode(node);
      discoverHubs(node);

      const savedToken = await SecureStore.getItemAsync('AUTH_TOKEN');
      const savedCid = await SecureStore.getItemAsync('COMPANY_ID');
      if (savedToken && savedCid) {
         setAuthToken(savedToken);
         setTabletIdentity(savedCid);
         setIsAuthenticated(true);
      }
    };
    bootstrap();
  }, []);

  const discoverHubs = async (node: string) => {
    setIsHubsLoading(true);
    try {
      const res = await fetch(`${node}/api/v1/marketplace/discovery`);
      if (res.ok) setHubs(await res.json());
    } catch (e) {
      setHasDiscoveryTimedOut(true);
    } finally {
      setIsHubsLoading(false);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    try {
      // Bypassing Backend Authentication for Presentation / Testing
      setTimeout(() => {
        setAuthToken("MOCK_PRESENTATION_TOKEN");
        setTabletIdentity("TUSTAR_HQ");
        SecureStore.setItemAsync('AUTH_TOKEN', "MOCK_PRESENTATION_TOKEN");
        SecureStore.setItemAsync('COMPANY_ID', "TUSTAR_HQ");
        setIsAuthenticated(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 500);
    } catch (e) {
      Alert.alert("CONNECTION FAILURE", "Unable to establish uplink to grid node.");
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('AUTH_TOKEN');
    await SecureStore.deleteItemAsync('COMPANY_ID');
    setIsAuthenticated(false);
    setShowLogoutWarning(false);
  };

  // --- HUB ACTIONS ---
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchMetrics();
      fetchInventory();
    }
  }, [isAuthenticated, activeTab]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${activeNode}/api/v1/deliveries/seller/active?company_id=${encodeURIComponent(tabletIdentity)}`, { 
        headers: { 'Authorization': `Bearer ${authToken}` } 
      });
      if (res.ok) setActiveOrders(await res.json());
    } catch (e) {}
  };

  const handleUpdateOrder = async (id: string, newStatus: string) => {
    try {
      await fetch(`${activeNode}/api/v1/deliveries/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
    } catch (e) {}
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${activeNode}/api/v1/deliveries/seller/stats?company_id=${encodeURIComponent(tabletIdentity)}`, { 
        headers: { 'Authorization': `Bearer ${authToken}` } 
      });
      if (res.ok) setMetrics(await res.json());
    } catch (e) {}
  };

  const fetchInventory = async () => {
    setIsInventoryLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${activeNode}/api/v1/marketplace/my-inventory`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${activeNode}/api/v1/marketplace/categories`)
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (cRes.ok) setCategories(await cRes.json());
    } catch (e) {}
    setIsInventoryLoading(false);
  };

  const handleSaveProduct = async (prod: Product) => {
    try {
      if (prod.id) {
        await fetch(`${activeNode}/api/v1/marketplace/products/${prod.id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ price: prod.price, description: prod.description, is_trending: prod.is_trending })
        });
      }
      setIsEditingProduct(false);
      fetchInventory();
    } catch (e) {}
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <LoginScreen 
          isHubsLoading={isHubsLoading}
          hubs={hubs}
          hasDiscoveryTimedOut={hasDiscoveryTimedOut}
          manualIP={manualIP}
          onManualIPChange={setManualIP}
          onManualConnect={() => discoverHubs(`http://${manualIP}:8000`)}
          onLaunchDemo={() => { setIsDemoMode(true); setIsAuthenticated(true); }} 
          onLogin={handleLogin}
          onRefreshPolling={() => discoverHubs(activeNode)}
          isStandaloneMode={isStandaloneMode}
          isStandaloneForced={isStandaloneForced}
          onToggleStandalone={setIsStandaloneForced}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#000']} style={StyleSheet.absoluteFill} />
        
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="light-content" />
          
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <LinearGradient colors={['#00ffcc', '#00cccc']} style={styles.brandIcon}>
                <MaterialCommunityIcons name="drone" size={24} color="#000" />
              </LinearGradient>
              <View>
                <Text style={styles.headerTitle}>{tabletIdentity} OPERATIONS</Text>
                <View style={styles.uplinkHUD}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.uplinkText}>GRID UPLINK ACTIVE • {activeNode.split(':').pop()}</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.headerBtn}>
                <Ionicons name="settings-sharp" size={18} color="#00ffcc" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowLogoutWarning(true)} style={[styles.headerBtn, { borderColor: '#ef444430' }]}>
                <Ionicons name="power" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={styles.tab} 
              onPress={() => setActiveTab("ORDERS")}
            >
              <Text style={[styles.tabText, activeTab === "ORDERS" && styles.tabTextActive]}>MISSION MANIFEST</Text>
              {activeTab === "ORDERS" && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.tab} 
              onPress={() => setActiveTab("INVENTORY")}
            >
              <Text style={[styles.tabText, activeTab === "INVENTORY" && styles.tabTextActive]}>MERCANTILE DEPOT</Text>
              {activeTab === "INVENTORY" && <View style={styles.tabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.tab} 
              onPress={() => setActiveTab("POS")}
            >
              <Text style={[styles.tabText, activeTab === "POS" && styles.tabTextActive]}>POS API</Text>
              {activeTab === "POS" && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={false} onRefresh={() => activeTab === 'ORDERS' ? fetchOrders() : fetchInventory()} tintColor="#00ffcc" />}
          >
            {activeTab === "ORDERS" ? (
              <View style={{ paddingBottom: 100 }}>
                <MetricsBar metrics={metrics} />
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>ACTIVE SORTIES</Text>
                    <Text style={styles.sectionCount}>{activeOrders.length} IN FLIGHT</Text>
                </View>
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} onChat={() => {}} onUpdateStatus={handleUpdateOrder} />
                ))}
                {activeOrders.length === 0 && (
                  <View style={styles.emptyManifest}>
                    <Ionicons name="shield-checkmark-outline" size={48} color="#1e293b" />
                    <Text style={styles.emptyText}>SECTOR CLEAR • NO ACTIVE MISSIONS</Text>
                  </View>
                )}
              </View>
            ) : activeTab === "INVENTORY" ? (
              <View style={[styles.invGrid, { paddingBottom: 100 }]}>
                 <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>STOCK TELEMETRY</Text>
                </View>
                {isInventoryLoading ? (
                  <View style={{ width: '100%', alignItems: 'center', marginTop: 50 }}>
                    <ActivityIndicator color="#00ffcc" />
                  </View>
                ) : products.map(prod => (
                  <ProductTile key={prod.id} product={prod} onPress={(p) => { setCurrentProduct(p); setIsEditingProduct(true); }} />
                ))}
              </View>
            ) : activeTab === "POS" ? (
              <POSIntegrationPanel />
            ) : null}
          </ScrollView>

          <Modal visible={showLogoutWarning} transparent={true} animationType="fade">
            <View style={styles.modalBackdrop}>
               <View style={styles.logoutModal}>
                  <Ionicons name="alert-circle" size={48} color="#ef4444" style={{ marginBottom: 15 }} />
                  <Text style={styles.modalTitle}>TERMINATE UPLINK?</Text>
                  <Text style={styles.modalSub}>Decoupling this terminal will pause all local telemetry feeds.</Text>
                  
                  <View style={{ flexDirection: 'row', gap: 15, width: '100%', marginTop: 30 }}>
                     <TouchableOpacity style={styles.modalBtnSec} onPress={() => setShowLogoutWarning(false)}>
                        <Text style={styles.modalBtnTextSec}>ABORT</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.modalBtnPri} onPress={handleLogout}>
                        <Text style={styles.modalBtnTextPri}>CONFIRM</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            </View>
          </Modal>

          {currentProduct && (
            <ProductModal 
              visible={isEditingProduct} 
              product={currentProduct} 
              categories={categories} 
              onClose={() => setIsEditingProduct(false)} 
              onUpdateProduct={setCurrentProduct} 
              onSave={handleSaveProduct} 
            />
          )}
          <SettingsModal visible={showSettings} language={language} onClose={() => setShowSettings(false)} onSelectLanguage={setLanguage} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 25, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  uplinkHUD: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ffcc', marginRight: 8 },
  uplinkText: { color: '#64748b', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  headerBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(30,41,59,0.3)', alignItems: 'center', justifyContent: 'center' },
  
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', position: 'relative' },
  tabIndicator: { position: 'absolute', bottom: 0, width: '40%', height: 3, backgroundColor: '#00ffcc', borderRadius: 2 },
  tabText: { color: '#64748b', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tabTextActive: { color: '#fff' },
  
  content: { flex: 1, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 15, width: '100%', paddingHorizontal: 5 },
  sectionTitle: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  sectionCount: { color: '#00ffcc', fontSize: 9, fontWeight: '900', opacity: 0.6 },
  
  invGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  emptyManifest: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
  emptyText: { color: '#64748b', fontSize: 10, fontWeight: '900', marginTop: 20, letterSpacing: 2 },
  
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  logoutModal: { backgroundColor: '#0f172a', padding: 35, borderRadius: 30, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  modalSub: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  modalBtnPri: { flex: 1, padding: 18, backgroundColor: '#ef4444', borderRadius: 15, alignItems: 'center' },
  modalBtnSec: { flex: 1, padding: 18, backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalBtnTextPri: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  modalBtnTextSec: { color: '#94a3b8', fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});