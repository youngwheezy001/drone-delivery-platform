import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, ActivityIndicator, Dimensions, ImageBackground } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Config, discoverActiveNode } from '../../constants/Config';
import { PromoCarousel } from '../../components/PromoCarousel';
import { Skeleton } from '../../components/Skeleton';
import { useCart } from '../../context/CartContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CartReviewModal from '../../components/CartReviewModal';
import { LinearGradient } from 'expo-linear-gradient';
import { getLocalImage } from '../../assets/items';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';

const { width } = Dimensions.get('window');

// 🛡️ TACTICAL IMAGE COMPONENT WITH FAILOVER & PROGRESS INDICATOR
const TacticalImage = ({ uri, style, name }: { uri: string; style: any; name?: string }) => {
  const fallbackSource = name ? getLocalImage(name) : null;
  const imageSource = fallbackSource ? fallbackSource : uri;
  
  if (!imageSource) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' }]}>
        <Ionicons name="cube-outline" size={24} color="#00ffcc" />
      </View>
    );
  }

  return (
    <ExpoImage 
      source={imageSource} 
      style={style} 
      contentFit="cover" 
      transition={200} 
    />
  );
};

export default function ShopHomeScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const { cart, addToCart, removeFromCart, totalItems, totalPrice } = useCart();
  
  const params = useLocalSearchParams();
  const categoryParam = params.category as string | undefined;
  const vendorParam = params.vendorId as string | undefined;

  const [discoveryData, setDiscoveryData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeNode, setActiveNode] = useState(Config.HTTP_URL);
  const [weatherState, setWeatherState] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAddToCart = (item: any) => {
    addToCart(item);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToastMessage(`[${item.name}] SECURED IN PAYLOAD`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // HUB DISCOVERY (AGGREGATED & RESILIENT)
  useEffect(() => {
    const discoverMarketplace = async () => {
      setIsDataLoading(true);
      try {
        const node = await discoverActiveNode();
        setActiveNode(node);
        
        const [dRes, cRes, hRes] = await Promise.all([
          fetch(`${node}/api/v1/marketplace/discovery`),
          fetch(`${node}/api/v1/marketplace/categories`),
          fetch(`${node}/api/v1/health/tactical`)
        ]);

        if (dRes.ok) {
           let hubs = await dRes.json();
           
           // Apply vendor filter if present
           if (vendorParam) {
               hubs = hubs.filter((h: any) => h.id === vendorParam);
               if (hubs.length === 1) {
                   setSelectedVendor(hubs[0]); // Automatically open the vendor if specific vendor selected
               }
           }
           
           // Apply category filter if present
           if (categoryParam) {
               hubs = hubs.map((h: any) => {
                   const c = categoryParam.toLowerCase();
                   const filteredProducts = h.products.filter((p: any) => {
                       if (c === 'anything') return true;
                       
                       const catName = (p.category?.name || "").toLowerCase();
                       const prodName = (p.name || "").toLowerCase();
                       const prodDesc = (p.description || "").toLowerCase();
                       
                       if (c === 'pharmacy' || c === 'health') return catName === 'medicine';
                       if (c === 'groceries' || c === 'food') return catName === 'food';
                       
                       // Specific food items
                       if (c === 'pizza') return prodName.includes('pizza');
                       if (c === 'burger') return prodName.includes('burger');
                       if (c === 'drinks') return prodName.includes('coke') || prodName.includes('soda') || prodDesc.includes('drink');
                       
                       return catName === c || prodName.includes(c);
                   });
                   return { ...h, products: filteredProducts };
               }).filter((h: any) => h.products.length > 0); // Only show hubs that have products in this category
           }

           setDiscoveryData(hubs);
        }
        if (cRes.ok) setCategories(await cRes.json());
        if (hRes.ok) {
           const hData = await hRes.json();
           setWeatherState(hData.weather);
        }
      } catch (e) {
        console.error("🛑 MISSION UPLINK FAILURE:", e);
      } finally {
        setIsDataLoading(false);
      }
    };
    discoverMarketplace();
  }, []);

  const renderProductItem = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.cardProduct} onPress={() => handleAddToCart(item)}>
      <View style={styles.cardProductIcon}>
        <TacticalImage uri={item.image_url} style={StyleSheet.absoluteFill} name={item.name} />
        <LinearGradient colors={['transparent', 'rgba(15,23,42,0.8)']} style={StyleSheet.absoluteFill} />
      </View>
      <View style={{ marginTop: 10 }}>
        <Text style={styles.cardProductName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardProductPrice}>KES {item.price}</Text>
      </View>
      <View style={styles.cardProductAdd}>
        <Ionicons name="add" size={16} color="#000" />
      </View>
    </TouchableOpacity>
  );

  if (selectedVendor) {
    return (
      <View style={styles.container}>
        <View style={styles.storeHeader}>
          <TouchableOpacity onPress={() => setSelectedVendor(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.storeTitle}>{selectedVendor.name}</Text>
            <Text style={styles.storeSubtitle}>SECTOR: {selectedVendor.region}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{padding: 20}}>
            {selectedVendor.products && selectedVendor.products.map((item: any) => (
              <TouchableOpacity key={item.id} style={styles.itemCard}>
                <View style={styles.itemIconBox}>
                   <TacticalImage uri={item.image_url} style={StyleSheet.absoluteFill} name={item.name} />
                </View>
                <View style={{flex: 1, marginLeft: 15}}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                     <Text style={styles.itemPrice}>KES {item.price}</Text>
                     <View style={styles.weightTag}><Text style={styles.weightText}>{item.weight_kg}kg</Text></View>
                  </View>
                </View>
                <View style={styles.qtyContainer}>
                  {cart[item.id] && (
                    <>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                        <Ionicons name="remove" size={20} color="#00ffcc" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{cart[item.id].qty}</Text>
                    </>
                  )}
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(item)}>
                    <Ionicons name="add" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
        </ScrollView>
        {totalItems > 0 && (
          <LinearGradient colors={['#00ffcc', '#00cccc']} style={styles.cartBar}>
            <View>
              <Text style={styles.cartBarTitle}>{totalItems} ITEMS SELECTED</Text>
              <Text style={styles.cartBarPrice}>TOTAL: KES {totalPrice.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => setIsCartVisible(true)}>
              <Text style={styles.checkoutBtnText}>AUTHORIZE MISSION</Text>
              <Ionicons name="chevron-forward" size={16} color="#00ffcc" />
            </TouchableOpacity>
          </LinearGradient>
        )}
        <CartReviewModal visible={isCartVisible} onClose={() => setIsCartVisible(false)} hubCid={selectedVendor?.company_id} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* ⬅️ DEPLOYING TACTICAL BACK NAVIGATION */}
          <TouchableOpacity onPress={() => router.replace('/landing')} style={styles.backBtnSmall}>
             <Ionicons name="arrow-back" size={22} color="#00ffcc" />
          </TouchableOpacity>
          <View style={styles.brandBadge}>
            <MaterialCommunityIcons name="drone" size={20} color="#00ffcc" />
          </View>
          <View>
            <Text style={styles.welcomeText}>OPERATOR: {user?.email?.split('@')[0] || 'GUEST'}</Text>
            <Text style={styles.brandText}>TUSTAR MERCANTILE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.cartIcon} onPress={() => setIsCartVisible(true)}>
          <Ionicons name="cart-outline" size={22} color="#00ffcc" />
          {totalItems > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{totalItems}</Text></View>}
        </TouchableOpacity>
      </View>

      {/* ⛈️ STORM GROUNDING BANNER */}
      {weatherState?.is_grounded && (
        <View style={{ backgroundColor: '#ef4444', padding: 12, alignItems: 'center' }}>
           <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' }}>
             ⚠️ Delivery Network Paused: Severe Weather
           </Text>
           <Text style={{ color: '#fee2e2', fontSize: 10, marginTop: 4 }}>
             Winds: {weatherState.wind_speed_kmh} km/h | Expected delays on all orders
           </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 150}}>
        <PromoCarousel />
        
        <View style={styles.statusHUD}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>GRID UPLINK: {activeNode.split(':').pop()} • ACTIVE</Text>
        </View>

        <Text style={styles.sectionTitle}>MISSION LOGISTICS HUBS</Text>
        {isDataLoading ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <ActivityIndicator color="#00ffcc" size="large" />
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '900', marginTop: 15, letterSpacing: 2 }}>DECRYPTING HUB MANIFESTS...</Text>
            </View>
        ) : (
            discoveryData.map((hub: any) => (
                <View key={hub.id} style={styles.hubSection}>
                    <View style={styles.hubHeader}>
                        <View>
                            <Text style={styles.hubName}>{hub.name}</Text>
                            <Text style={styles.hubSector}>SECTOR: {hub.region || "NAIROBI CENTRAL"}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedVendor(hub)}>
                            <Text style={styles.viewAllText}>ACCESS GRID</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}>
                        {hub.products.map((prod: any) => renderProductItem(prod))}
                        {hub.products.length === 0 && (
                           <View style={styles.emptyHubCard}><Text style={styles.emptyText}>OFFLINEHUB</Text></View>
                        )}
                    </ScrollView>
                </View>
            ))
        )}

        <View style={styles.radarContainer}>
           <LinearGradient colors={['#00ffcc10', 'transparent']} style={styles.radarCircle}>
              <View style={styles.radarLine} />
           </LinearGradient>
           <View style={{ marginLeft: 20 }}>
              <Text style={styles.radarTitle}>TACTICAL SCAN ACTIVE</Text>
              <Text style={styles.radarSub}>{discoveryData.length} NODES IDENTIFIED IN GRID</Text>
           </View>
        </View>
      </ScrollView>
      <CartReviewModal visible={isCartVisible} onClose={() => setIsCartVisible(false)} />
      {toastMessage && (
        <View style={styles.toastContainer}>
           <Ionicons name="checkmark-circle" size={20} color="#000" />
           <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backBtnSmall: { paddingRight: 10 },
  brandBadge: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#00ffcc10', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00ffcc30' },
  welcomeText: { color: '#64748b', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  brandText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: -0.5 },
  cartIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(30, 41, 59, 0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(51, 65, 85, 0.5)' },
  cartBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: '#fff', fontSize: 8, fontWeight: 'black' },
  
  statusHUD: { marginHorizontal: 25, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ffcc', marginRight: 10 },
  statusText: { color: '#64748b', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },

  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginLeft: 25, marginTop: 30, marginBottom: 18 },
  hubSection: { marginBottom: 35 },
  hubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 25, marginBottom: 15 },
  hubName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  hubSector: { color: '#64748b', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  viewAllText: { color: '#00ffcc', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  
  cardProduct: { width: 150, backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 15, borderRadius: 28, marginRight: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  cardProductIcon: { width: '100%', height: 100, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  cardProductName: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 12 },
  cardProductPrice: { color: '#00ffcc', fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  cardProductAdd: { position: 'absolute', bottom: 15, right: 15, width: 28, height: 28, borderRadius: 14, backgroundColor: '#00ffcc', alignItems: 'center', justifyContent: 'center' },
  
  storeHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingBottom: 25 },
  backBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(30, 41, 59, 0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(51, 65, 85, 0.5)' },
  storeTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  storeSubtitle: { color: '#64748b', fontSize: 10, fontWeight: '900', marginTop: 2 },
  
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 18, borderRadius: 28, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  itemName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  itemDesc: { color: '#64748b', fontSize: 12, marginTop: 4 },
  itemPrice: { color: '#00ffcc', fontSize: 18, fontWeight: '900', marginTop: 10 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00ffcc', alignItems: 'center', justifyContent: 'center' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#00ffcc10', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00ffcc30' },
  qtyText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  cartBar: { position: 'absolute', bottom: 110, left: 20, right: 20, padding: 22, borderRadius: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 20, shadowColor: '#00ffcc', shadowOpacity: 0.3, shadowRadius: 20 },
  cartBarTitle: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  cartBarPrice: { color: '#000', fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  checkoutBtn: { backgroundColor: '#000', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkoutBtnText: { color: '#00ffcc', fontSize: 11, fontWeight: '900' },
  
  itemIconBox: { width: 70, height: 70, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00ffcc10' },
  weightTag: { backgroundColor: '#0006', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  weightText: { color: '#64748b', fontSize: 9, fontWeight: 'bold' },
  
  radarContainer: { marginHorizontal: 25, marginTop: 40, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.2)', padding: 25, borderRadius: 35, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  radarCircle: { width: 65, height: 65, borderRadius: 32.5, borderColor: '#00ffcc40', borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  radarLine: { position: 'absolute', width: '60%', height: 2, backgroundColor: '#00ffcc', top: '50%', left: '50%', opacity: 0.4 },
  radarTitle: { color: '#00ffcc', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  radarSub: { color: '#64748b', fontSize: 9, fontWeight: 'bold', marginTop: 4 },
  emptyHubCard: { width: 140, height: 180, backgroundColor: 'rgba(30,41,59,0.2)', borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emptyText: { color: '#475569', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  toastContainer: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: '#00ffcc', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 9999, elevation: 10, shadowColor: '#00ffcc', shadowOpacity: 0.5, shadowRadius: 10 },
  toastText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1, textAlign: 'center' }
});