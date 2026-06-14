import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions, FlatList, Animated, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import CartReviewModal from '../../components/CartReviewModal';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

const FEATURED_BANNERS = [
  { id: '1', title: 'Budget Friendly Dinner', subtitle: 'Global Logistics Guaranteed', icon: 'pizza-outline', color: '#fb923c', promo: 'UNDER KES 1000' },
  { id: '2', title: 'Elite Grocery Hub', subtitle: 'Fresh from local drones', icon: 'leaf-outline', color: '#10b981', promo: 'FREE DELIVERY' },
  { id: '3', title: 'Crowd Pleasers', subtitle: 'Trending in your mission zone', icon: 'flame-outline', color: '#3b82f6', promo: 'HOT DEALS' },
];

const DISCOVERY_CATEGORIES = [
  { id: 'crowd', title: 'Crowd Pleasers', icon: 'flame-outline', color: '#fb923c', tag: 'Trending' },
  { id: 'groceries', title: 'Top Groceries', icon: 'cart-outline', color: '#10b981', tag: 'Fresh' },
  { id: 'budget', title: 'Budget Dinner', icon: 'cash-outline', color: '#22c55e', tag: 'Cheap' },
  { id: 'near', title: 'First Near You', icon: 'location-outline', color: '#3b82f6', tag: 'Fast' },
  { id: 'sweets', title: 'Bakeries & Sweets', icon: 'ice-cream-outline', color: '#db2777', tag: 'Sweet' },
  { id: 'restaurants', title: 'Top Restaurants', icon: 'star-outline', color: '#f59e0b', tag: 'Elite' },
  { id: 'performers', title: 'Top Performers', icon: 'ribbon-outline', color: '#6366f1', tag: 'Rated' },
  { id: 'veg', title: 'Fruits & Veg', icon: 'leaf-outline', color: '#22c55e', tag: 'Organic' },
];

const TRENDING_PRODUCTS = [
  { id: 'p1', name: 'Margherita Drone-Hot', price: 1200, icon: 'pizza-outline', color: '#fb923c', weight: 0.8, category: 'budget' },
  { id: 'p2', name: 'Emergency First Aid Kit', price: 4500, icon: 'medkit-outline', color: '#ef4444', weight: 1.2, category: 'near' },
  { id: 'p3', name: 'Premium Espresso Shot', price: 450, icon: 'cafe-outline', color: '#92400e', weight: 0.3, category: 'crowd' },
  { id: 'p4', name: 'Organic Grocery Bundle', price: 2800, icon: 'basket-outline', color: '#10b981', weight: 1.9, category: 'groceries' },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, totalItems, totalPrice } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredProducts = useMemo(() => {
    let base = TRENDING_PRODUCTS;
    if (selectedCategoryId) {
       base = base.filter(p => p.category === selectedCategoryId);
    }
    if (!searchQuery) return base;
    return base.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, selectedCategoryId]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return DISCOVERY_CATEGORIES;
    return DISCOVERY_CATEGORIES.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const renderBanner = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.bannerCard, { backgroundColor: item.color + '15', borderColor: item.color + '30' }]}>
      <View style={styles.bannerInfo}>
        <View style={[styles.promoBadge, { backgroundColor: item.color }]}>
          <Text style={styles.promoText}>{item.promo}</Text>
        </View>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.bannerIconBox}>
        <Ionicons name={item.icon} size={60} color={item.color} style={styles.bannerIcon} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isSearchActive ? (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search local logistics hubs..."
              placeholderTextColor="#64748b"
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => { setIsSearchActive(false); setSearchQuery(""); }}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View>
              <Text style={styles.headerTitle}>Discovery</Text>
              <Text style={styles.headerSubtitle}>Powered by Tustar Co.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.searchToggle} onPress={() => setIsSearchActive(true)}>
                <Ionicons name="search" size={24} color="#00ffcc" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchToggle} onPress={() => setIsCartVisible(true)}>
                 <Ionicons name="cart-outline" size={24} color="#00ffcc" />
                 {totalItems > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{totalItems}</Text></View>}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <CartReviewModal visible={isCartVisible} onClose={() => setIsCartVisible(false)} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!searchQuery && (
          <View style={styles.carouselContainer}>
            <FlatList
              data={FEATURED_BANNERS}
              renderItem={renderBanner}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={width - 40}
              decelerationRate="fast"
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>{searchQuery ? 'TACTICAL RESULTS' : 'TRENDING MISSIONS'}</Text>

        {isLoading ? (
          <View style={styles.loadingBox}><ActivityIndicator color="#00ffcc" /></View>
        ) : (
          <View style={styles.grid}>
            {filteredProducts.length === 0 ? (
               <Text style={{color: '#64748b', textAlign: 'center', width: '100%', padding: 20}}>No mission payloads found in this category.</Text>
            ) : (
              filteredProducts.map((prod) => (
                <View key={prod.id} style={styles.prodCard}>
                  <View style={[styles.prodIconBox, { backgroundColor: prod.color + '10' }]}>
                    <Ionicons name={prod.icon as any} size={42} color={prod.color} />
                    <View style={styles.weightBadge}><Text style={styles.weightText}>{prod.weight}kg</Text></View>
                  </View>
                  <Text style={styles.prodName} numberOfLines={1}>{prod.name}</Text>
                  <View style={styles.prodFooter}>
                    <Text style={styles.prodPrice}>KES {prod.price.toLocaleString()}</Text>
                    <View style={styles.actionRow}>
                      {cart[prod.id] && (
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(prod.id)}>
                          <Ionicons name="remove" size={16} color="#00ffcc" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        style={styles.deployBtn}
                        onPress={() => addToCart(prod)}
                      >
                        <Text style={styles.deployText}>{cart[prod.id] ? cart[prod.id].qty : 'ADD'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>EXPLORE CATEGORIES</Text>
        <View style={styles.grid}>
          {filteredCategories.slice(0, 8).map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.catCard, selectedCategoryId === cat.id && { borderColor: cat.color, borderWidth: 2 }]}
              onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
            >
              <View style={[styles.catIconBox, { backgroundColor: cat.color + '10' }]}>
                <Ionicons name={cat.icon as any} size={24} color={cat.color} />
              </View>
              <Text style={styles.catTitle}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  header: { paddingHorizontal: 25, marginBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  headerSubtitle: { color: '#64748b', fontSize: 10, fontWeight: 'bold', letterSpacing: 4, textTransform: 'uppercase', marginTop: 2 },
  searchToggle: { width: 50, height: 50, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#334155' },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, marginLeft: 10, fontWeight: 'bold' },

  scrollContent: { paddingBottom: 150 },
  carouselContainer: { height: 180, marginBottom: 30 },
  bannerCard: { width: width - 80, height: 180, borderRadius: 30, marginRight: 20, padding: 25, flexDirection: 'row', borderWidth: 1, overflow: 'hidden' },
  bannerInfo: { flex: 1, justifyContent: 'center' },
  promoBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 12 },
  promoText: { color: '#000', fontSize: 10, fontWeight: '900' },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: -0.5 },
  bannerSubtitle: { color: '#94a3b8', fontSize: 11, marginTop: 4, fontWeight: '600' },
  bannerIconBox: { width: 80, justifyContent: 'center', alignItems: 'center' },
  bannerIcon: { opacity: 0.8 },

  sectionTitle: { paddingHorizontal: 25, color: '#475569', fontSize: 12, fontWeight: 'black', letterSpacing: 2, marginBottom: 20, marginTop: 10 },
  grid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  prodCard: { width: COLUMN_WIDTH, backgroundColor: '#0f172a', padding: 15, borderRadius: 30, marginBottom: 15, borderWidth: 1, borderColor: '#1e293b' },
  prodIconBox: { width: '100%', height: 110, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 15, position: 'relative' },
  weightBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#00ffcc15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  weightText: { color: '#00ffcc', fontSize: 8, fontWeight: 'bold' },
  prodName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  prodFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  prodPrice: { color: '#64748b', fontSize: 11, fontWeight: '800' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deployBtn: { backgroundColor: '#00ffcc', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#00ffcc10', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00ffcc30' },
  deployText: { color: '#000', fontSize: 9, fontWeight: 'black' },

  catCard: { width: (width - 60) / 4, backgroundColor: '#0f172a', padding: 10, borderRadius: 20, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  catIconBox: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  catTitle: { color: '#64748b', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },

  loadingBox: { padding: 40, alignItems: 'center' },
  cartBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: '#fff', fontSize: 8, fontWeight: 'black' },
});
