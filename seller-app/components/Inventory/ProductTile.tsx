import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ImageBackground, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Product } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

// 🖼️ TACTICAL ASSET MAPPING (LOCAL FALLBACKS)
const CATEGORY_ASSETS: Record<string, { icon: string; color: string; image?: any }> = {
  "Medicine": { icon: "medkit", color: "#ef4444" },
  "Food": { icon: "food", color: "#f59e0b", image: require('../../assets/products/food.png') },
  "Electronics": { icon: "hardware-chip", color: "#3b82f6" },
  "Logistics": { icon: "drone", color: "#00ffcc" },
  "Industrial": { icon: "construct", color: "#8b5cf6" }
};

interface ProductTileProps {
  product: Product;
  onPress: (product: Product) => void;
}

export const ProductTile = ({ product, onPress }: ProductTileProps) => {
  const isOverweight = product.weight_kg > 2.0;
  const asset = CATEGORY_ASSETS[product.category_id] || { icon: "cube", color: "#00ffcc" };

  return (
    <TouchableOpacity 
      style={styles.eliteProdCard} 
      onPress={() => onPress(product)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : asset.image ? (
            <Image source={asset.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
             <LinearGradient 
                colors={['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.8)']} 
                style={StyleSheet.absoluteFill} 
             />
          )}
          
          <LinearGradient 
             colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']} 
             style={StyleSheet.absoluteFill} 
          />

          {(!product.image_url && !asset.image) && (
            <View style={styles.iconOverlay}>
                {asset.icon === 'drone' ? (
                    <MaterialCommunityIcons name="drone" size={42} color={asset.color} />
                ) : asset.icon === 'food' ? (
                    <MaterialCommunityIcons name="food-variant" size={42} color={asset.color} />
                ) : (
                    <Ionicons name={asset.icon as any} size={42} color={asset.color} />
                )}
            </View>
          )}

          <View style={styles.weightBadge}>
             <Text style={styles.weightText}>{product.weight_kg}kg</Text>
          </View>
          
          {product.stock < 5 && (
             <LinearGradient colors={['#ef4444', '#991b1b']} style={styles.stockAlert}>
                 <Text style={styles.stockText}>LOW STOCK: {product.stock}</Text>
             </LinearGradient>
          )}
      </View>

      <View style={styles.detailsBox}>
          <Text style={styles.prodName} numberOfLines={1}>{product.name}</Text>
          <View style={styles.priceRow}>
             <Text style={styles.priceText}>KES {product.price.toLocaleString()}</Text>
          </View>
          
          <View style={styles.metricsRow}>
             <View style={styles.metricItem}>
                <Ionicons name="stats-chart" size={10} color="#64748b" />
                <Text style={styles.metricText}>{(product.price * product.stock).toLocaleString()} value</Text>
             </View>
             <MaterialCommunityIcons 
                name={!isOverweight ? "airplane-check" : "truck-delivery"} 
                size={14} 
                color={!isOverweight ? "#00ffcc" : "#ef4444"} 
             />
          </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  eliteProdCard: { 
    width: COLUMN_WIDTH, 
    height: 220,
    backgroundColor: 'rgba(30, 41, 59, 0.3)', 
    borderRadius: 30, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden'
  },
  imageContainer: { 
    width: '100%', 
    height: 130, 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden'
  },
  iconOverlay: { opacity: 0.5 },
  weightBadge: { 
    position: 'absolute', 
    top: 15, 
    left: 15, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  weightText: { color: '#00ffcc', fontSize: 8, fontWeight: '900' },
  stockAlert: { 
    position: 'absolute', 
    bottom: -8, 
    alignSelf: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 10,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  stockText: { color: '#fff', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  
  detailsBox: { padding: 15, flex: 1, justifyContent: 'space-between' },
  prodName: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  priceRow: { marginTop: 4 },
  priceText: { color: '#00ffcc', fontSize: 16, fontWeight: '900' },
  
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  metricItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricText: { color: '#64748b', fontSize: 8, fontWeight: 'bold' }
});
