import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

const { height } = Dimensions.get('window');

type CartReviewModalProps = {
  visible: boolean;
  onClose: () => void;
  hubCid?: string;
  hubLocation?: any;
};

export default function CartReviewModal({ visible, onClose, hubCid, hubLocation }: CartReviewModalProps) {
  const { cart, addToCart, removeFromCart, totalItems, totalPrice, totalWeight } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const items = Object.values(cart);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>MISSION BAG</Text>
              <Text style={styles.subtitle}>{totalItems} TACTICAL NODES READY</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={60} color="#1e293b" />
                <Text style={styles.emptyText}>YOUR MISSION BAG IS EMPTY</Text>
              </View>
            ) : (
              items.map(({ item, qty }) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemIconBox}>
                    <Ionicons name={item.icon || "cube-outline"} size={24} color="#00ffcc" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>{item.weight}kg • KES {item.price.toLocaleString()}</Text>
                  </View>
                  <View style={styles.qtyBox}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                      <Ionicons name="remove" size={16} color="#00ffcc" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                      <Ionicons name="add" size={16} color="#00ffcc" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {items.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statLabel}>TOTAL PAYLOAD</Text>
                  <Text style={styles.statVal}>{totalWeight.toFixed(2)} KG</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.statLabel}>TOTAL COST</Text>
                  <Text style={styles.statVal}>KES {totalPrice.toLocaleString()}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.authBtn}
                onPress={() => {
                  onClose();
                  if (!user) {
                    router.push("/login");
                  } else {
                    router.push({ 
                      pathname: "/checkout", 
                      params: { 
                        cartData: JSON.stringify(items),
                        hubCid: hubCid || "TUSTAR_HQ",
                        hubLocation: hubLocation ? JSON.stringify(hubLocation) : undefined
                      } 
                    });
                  }
                }}
              >
                <Text style={styles.authBtnText}>AUTHORIZE MISSION</Text>
                <Ionicons name="rocket" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#0f172a', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: height * 0.75, borderTopWidth: 1, borderTopColor: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: '#64748b', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  
  itemList: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100, opacity: 0.5 },
  emptyText: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginTop: 20, letterSpacing: 2 },

  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#1e293b40', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  itemIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#00ffcc10', alignItems: 'center', justifyContent: 'center' },
  itemName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  itemMeta: { color: '#64748b', fontSize: 11, marginTop: 4 },
  
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#00ffcc10', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00ffcc30' },
  qtyText: { color: '#fff', fontSize: 14, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },

  footer: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 20, marginTop: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statLabel: { color: '#64748b', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  statVal: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 4 },

  authBtn: { backgroundColor: '#00ffcc', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  authBtnText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }
});
