import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Config, discoverActiveNode } from '../constants/Config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import PaymentModal from '../components/PaymentModal';
import { MissionStats } from '../components/MissionStats';
import { TimingToggle } from '../components/TimingToggle';
import { CartSummary } from '../components/CartSummary';
import { MissionPlan, CartEntry } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width, height } = Dimensions.get('window');

export default function CheckoutScreen() {
  const { user, token } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { cart, clearCart, totalWeight: contextWeight, totalPrice: contextPrice } = useCart();
  
  const [destination, setDestination] = useState<any>(null);
  const [isARMode, setIsARMode] = useState(false);
  const [arLocked, setArLocked] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planData, setPlanData] = useState<MissionPlan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [activeNode, setActiveNode] = useState(Config.HTTP_URL);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const mapRef = useRef<MapView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // 📦 Parse Cart Data
  const cartItems: CartEntry[] = params.cartData ? JSON.parse(params.cartData as string) : Object.values(cart);
  const totalWeight = params.cartData ? cartItems.reduce((s: number, i: any) => s + ((i.item.weight_kg || i.item.weight || 0.5) * i.qty), 0) : contextWeight;
  const totalCartPrice = params.cartData ? cartItems.reduce((s: number, i: any) => s + (i.item.price * i.qty), 0) : contextPrice;
  const displayTitle = cartItems.length > 0 ? `${cartItems.length} NODE LOGISTICS` : `MISSION: ${params.name || 'MANUAL SORTIE'}`;
  
  const hubLocation = params.hubLocation ? JSON.parse(params.hubLocation as string) : Config.HQ_LOCATION;

  useEffect(() => {
    const initDiscovery = async () => {
      const node = await discoverActiveNode();
      setActiveNode(node);
    };
    initDiscovery();

    // 🌍 FETCH REAL LOCATION INSTANTLY
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getLastKnownPositionAsync({});
        if (location) {
          const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
          setUserLocation(coords);
          mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 1000);
        }
        
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(loc => {
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserLocation(coords);
        }).catch(() => {});
      }
    })();
  }, []);

  const handleMapPress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setDestination(coords);
    setIsARMode(true);
  };

  const calculateMission = async (dest: any) => {
    setIsPlanning(true);
    setPlanData(null);
    try {
      const node = await discoverActiveNode();
      const res = await fetch(`${node}/api/v1/deliveries/plan`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_id: user?.email || "lewis@tustar.io",
          origin_lat: hubLocation.latitude,
          origin_lon: hubLocation.longitude,
          destination_lat: dest.latitude,
          destination_lon: dest.longitude,
          package_weight_kg: totalWeight,
          scheduled_at: scheduledTime?.toISOString()
        })
      });

      const data = await res.json();
      const errorMessage = Array.isArray(data?.detail) ? data.detail[0]?.msg : data?.detail;
      if (res.ok) setPlanData(data);
      else Alert.alert("Mission Planning Failed 🛑", typeof errorMessage === 'string' ? errorMessage : "Unable to calculate flight path.");
    } catch (err: any) {
      Alert.alert("Mission Control Offline 🛑", "Failed to reach Mission Control.");
    } finally {
      setIsPlanning(false);
    }
  };

  const formattedRoute = planData?.route_waypoints?.map((wp: [number, number]) => ({
    latitude: wp[0],
    longitude: wp[1]
  })) || [];

  if (isARMode) {
    if (!permission) return <View style={styles.arContainer} />;
    if (!permission.granted) {
      return (
        <View style={[styles.arContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="camera-outline" size={64} color="#00ffcc" style={{marginBottom: 20}} />
          <Text style={{color: '#fff', marginBottom: 20, textAlign: 'center', marginHorizontal: 40}}>CAMERA ACCESS REQUIRED FOR TETHER DROP TARGETING.</Text>
          <TouchableOpacity style={styles.arLockBtn} onPress={requestPermission}>
             <Text style={styles.arLockText}>GRANT PERMISSION</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.arContainer}>
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
        {arLocked && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />}
        <View style={styles.arOverlay}>
          <View style={styles.arHeader}>
            <Ionicons name="scan-outline" size={32} color="#00ffcc" />
            <Text style={styles.arTitle}>AUGMENTED REALITY DROP-ZONE</Text>
            <Text style={styles.arSubtitle}>Pan camera to scan your backyard or balcony. Ensure a 3x3 meter clearing.</Text>
          </View>
          
          <View style={styles.arCrosshairContainer}>
            <View style={[styles.crosshairBracket, styles.tl]} />
            <View style={[styles.crosshairBracket, styles.tr]} />
            <View style={[styles.crosshairBracket, styles.bl]} />
            <View style={[styles.crosshairBracket, styles.br]} />
            {arLocked ? (
              <Ionicons name="checkmark-circle" size={64} color="#00ffcc" />
            ) : (
              <View style={styles.centerDot} />
            )}
          </View>

          <View style={styles.arFooter}>
             {!arLocked ? (
               <TouchableOpacity 
                 style={styles.arLockBtn} 
                 onPress={() => {
                   setArLocked(true);
                   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                   setTimeout(() => {
                     setIsARMode(false);
                     calculateMission(destination);
                     setTimeout(() => {
                        setShowPayment(true);
                     }, 500);
                   }, 1500);
                 }}
               >
                 <Text style={styles.arLockText}>PLACE TETHER TARGET (X)</Text>
               </TouchableOpacity>
             ) : (
               <Text style={styles.arSuccessText}>TARGET LOCKED. COMPUTING DESCENT VECTOR...</Text>
             )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        ref={mapRef}
        style={styles.map} 
        initialRegion={{ ...Config.HQ_LOCATION, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        onPress={handleMapPress}
        mapType="hybrid"
      >
        <Marker coordinate={hubLocation}>
           <View style={styles.hubMarker}>
              <View style={styles.hubMarkerPulse} />
              <Ionicons name="business" size={20} color="#00ffcc" />
           </View>
        </Marker>

        {userLocation && (
          <Marker coordinate={userLocation}>
             <View style={styles.userMarker} />
          </Marker>
        )}

        {destination && (
          <Marker coordinate={destination}>
             <View style={styles.targetMarker}>
                <Ionicons name="location" size={24} color="#ef4444" />
             </View>
          </Marker>
        )}

        {formattedRoute.length > 0 && (
          <Polyline 
            coordinates={formattedRoute} 
            strokeColor="#00ffcc" 
            strokeWidth={4} 
            lineDashPattern={[2, 10]} 
          />
        )}
      </MapView>

      <LinearGradient colors={['rgba(0,0,0,0.8)', '#0f172a', '#000']} style={styles.detailsOverlay}>
        <ScrollView style={styles.detailsCard} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.header}>
            <View style={{flex: 1}}>
              <Text style={styles.missionTitle}>{displayTitle.toUpperCase()}</Text>
              <View style={styles.metricRow}>
                 <MaterialCommunityIcons name="weight-kilogram" size={12} color="#64748b" />
                 <Text style={styles.missionSub}>PAYLOAD: {totalWeight.toFixed(2)}KG</Text>
              </View>
            </View>
            <LinearGradient colors={['rgba(0,255,204,0.1)', 'transparent']} style={styles.priceBox}>
              <Text style={styles.priceVal}>KES {(totalCartPrice + (planData?.estimated_price_kes || 0)).toLocaleString()}</Text>
              {planData && <Text style={{color: '#00ffcc', fontSize: 8, fontWeight: 'bold'}}>INCL. FLIGHT KES {planData.estimated_price_kes}</Text>}
            </LinearGradient>
          </View>

          <CartSummary cartItems={cartItems} />

          {!destination ? (
            <View style={styles.promptBox}>
              <View style={styles.promptIconBox}>
                <Ionicons name="locate-outline" size={28} color="#00ffcc" />
              </View>
              <Text style={styles.promptTitle}>TACTICAL ORIGIN ESTABLISHED</Text>
              <Text style={styles.promptText}>Select approximate delivery area on the map.</Text>
              {userLocation && (
                <TouchableOpacity 
                  style={[styles.arScanBtn, { backgroundColor: '#3b82f6', marginTop: 15 }]} 
                  onPress={() => {
                    setDestination(userLocation);
                    setIsARMode(true);
                  }}
                >
                  <Ionicons name="navigate-circle" size={20} color="#fff" />
                  <Text style={[styles.arScanText, { color: '#fff' }]}>USE CURRENT LOCATION</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : !arLocked ? (
            <View style={styles.promptBox}>
              <Text style={styles.promptTitle}>GPS ACCURACY INSUFFICIENT</Text>
              <Text style={styles.promptText}>Tether drops require exact positioning.</Text>
              <TouchableOpacity style={styles.arScanBtn} onPress={() => setIsARMode(true)}>
                <Ionicons name="scan" size={20} color="#000" />
                <Text style={styles.arScanText}>LAUNCH AR PRECISION SCAN</Text>
              </TouchableOpacity>
            </View>
          ) : isPlanning ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#00ffcc" />
              <Text style={styles.loadingText}>CALCULATING FLIGHT TRAJECTORY...</Text>
            </View>
          ) : planData ? (
            <View style={{ gap: 20 }}>
              <MissionStats planData={planData} />
              <TimingToggle 
                scheduledTime={scheduledTime}
                onSelectImmediate={() => setScheduledTime(null)}
                onSelectScheduled={() => {
                  const future = new Date();
                  future.setHours(future.getHours() + 2);
                  setScheduledTime(future);
                }}
              />
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.payBtn, (!destination || isPlanning) && styles.payBtnDisabled]}
            disabled={!destination || isPlanning}
            onPress={() => setShowPayment(true)}
          >
            <LinearGradient 
              colors={!destination || isPlanning ? ['#1e293b', '#1e293b'] : ['#00ffcc', '#00cccc']} 
              style={styles.payBtnGradient}
            >
              <Text style={styles.payText}>AUTHORIZE MISSION</Text>
              <Ionicons name="shield-checkmark" size={18} color="#000" style={{marginLeft: 10}} />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      <PaymentModal 
        visible={showPayment} 
        onClose={() => setShowPayment(false)}
        onSuccess={async (phone: string) => {
          setShowPayment(false);
          setIsAuthorizing(true);
          try {
            const node = await discoverActiveNode();
            
            // 1. Authorize Delivery
            const res = await fetch(`${node}/api/v1/deliveries/authorize`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                customer_id: user?.email || "lewis@tustar.io",
                origin_lat: hubLocation.latitude,
                origin_lon: hubLocation.longitude,
                destination_lat: destination.latitude,
                destination_lon: destination.longitude,
                package_weight_kg: totalWeight,
                scheduled_at: scheduledTime?.toISOString(),
                company_id: params.hubCid || "TUSTAR_HQ"
              })
            });
            
            if (res.ok) {
              const data = await res.json();
              const deliveryId = data.delivery_id;
              
              // 2. Call Real Daraja STK Push API
              const payRes = await fetch(`${node}/api/v1/fintech/checkout/${deliveryId}?phone_number=${phone}`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (!payRes.ok) {
                const errData = await payRes.json().catch(() => ({}));
                Alert.alert("Payment Failed 🛑", errData.detail || "M-Pesa STK push failed.");
                setIsAuthorizing(false);
                return;
              }
              
              // 3. Poll for Daraja Callback
              const interval = setInterval(async () => {
                try {
                  const statusRes = await fetch(`${node}/api/v1/fintech/transaction/${deliveryId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    if (statusData.status === "CLEARED") {
                      clearInterval(interval);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      clearCart();
                      router.replace('/(tabs)/orders');
                    } else if (statusData.status === "FAILED") {
                      clearInterval(interval);
                      setIsAuthorizing(false);
                      Alert.alert("Payment Cancelled", "M-Pesa transaction failed or was cancelled.");
                    }
                  }
                } catch (e) {
                  // Keep polling
                }
              }, 3000);
              
            } else {
              const errData = await res.json().catch(() => ({}));
              const errorMessage = Array.isArray(errData?.detail) ? errData.detail[0]?.msg : errData?.detail;
              Alert.alert("Authorization Failed 🛑", typeof errorMessage === 'string' ? errorMessage : "Database conflict.");
              setIsAuthorizing(false);
            }
          } catch (e) {
            Alert.alert("Mission Control Offline 🛑", "Uplink timed out.");
            setIsAuthorizing(false);
          }
        }}
        amount={(totalCartPrice + (planData?.estimated_price_kes || 0)).toString()}
      />
      {isAuthorizing && (
        <View style={styles.authOverlay}>
          <ActivityIndicator color="#00ffcc" size="large" />
          <Text style={styles.authText}>WAITING FOR M-PESA PIN...</Text>
          <Text style={styles.authSub}>CHECK YOUR PHONE TO AUTHORIZE</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { width: width, height: height * 0.45 },
  hubMarker: { width: 40, height: 40, backgroundColor: 'rgba(0,255,204,0.1)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#00ffcc' },
  hubMarkerPulse: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,255,204,0.2)' },
  targetMarker: { shadowColor: '#ef4444', shadowOpacity: 0.8, shadowRadius: 10 },
  
  detailsOverlay: { flex: 1 },
  detailsCard: { padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  missionTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 },
  missionSub: { color: '#64748b', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  priceBox: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,255,204,0.2)' },
  priceVal: { color: '#00ffcc', fontSize: 16, fontWeight: '900' },

  promptBox: { alignItems: 'center', padding: 40, backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: 30, borderWidth: 1, borderStyle: 'dashed', borderColor: '#1e293b' },
  promptIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#00ffcc10', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  promptTitle: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  promptText: { color: '#64748b', fontSize: 10, marginTop: 8, fontWeight: 'bold' },

  loadingBox: { alignItems: 'center', padding: 30 },
  loadingText: { color: '#00ffcc', fontSize: 10, fontWeight: '900', marginTop: 15, letterSpacing: 2 },

  payBtn: { marginTop: 35, borderRadius: 24, overflow: 'hidden' },
  payBtnGradient: { padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  payBtnDisabled: { opacity: 0.5 },
  payText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  authOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  authText: { color: '#00ffcc', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: 20 },
  authSub: { color: '#64748b', fontSize: 9, fontWeight: 'bold', marginTop: 10, letterSpacing: 1 },
  userMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5
  },
  
  // AR Scanner Styles
  arContainer: { flex: 1, backgroundColor: '#000' },
  arOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,255,204,0.05)', justifyContent: 'space-between', padding: 40 },
  arHeader: { alignItems: 'center', marginTop: 40 },
  arTitle: { color: '#00ffcc', fontSize: 16, fontWeight: '900', letterSpacing: 2, marginTop: 15 },
  arSubtitle: { color: '#fff', fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 18, opacity: 0.8 },
  arCrosshairContainer: { alignSelf: 'center', width: 200, height: 200, justifyContent: 'center', alignItems: 'center' },
  crosshairBracket: { position: 'absolute', width: 40, height: 40, borderColor: '#00ffcc', borderWidth: 4 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  centerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  arFooter: { alignItems: 'center', marginBottom: 40 },
  arLockBtn: { backgroundColor: '#00ffcc', paddingVertical: 18, paddingHorizontal: 30, borderRadius: 30 },
  arLockText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  arSuccessText: { color: '#00ffcc', fontSize: 12, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  
  arScanBtn: { flexDirection: 'row', backgroundColor: '#00ffcc', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center', gap: 10, marginTop: 20 },
  arScanText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 }
});
