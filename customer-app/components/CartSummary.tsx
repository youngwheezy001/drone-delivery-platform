import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CartEntry } from '../types';

interface CartSummaryProps {
  cartItems: CartEntry[];
}

export const CartSummary: React.FC<CartSummaryProps> = ({ cartItems }) => {
  if (cartItems.length === 0) return null;

  return (
    <View style={styles.cartList}>
       {cartItems.map((entry, idx) => (
         <View key={idx} style={styles.cartRow}>
           <Text style={styles.cartItemText}>{entry.qty}x {entry.item.name}</Text>
           <Text style={styles.cartItemPrice}>
             KES {(entry.item.price * entry.qty).toLocaleString()}
           </Text>
         </View>
       ))}
    </View>
  );
};

const styles = StyleSheet.create({
  cartList: { 
    marginBottom: 20, 
    backgroundColor: '#0f172a', 
    padding: 15, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  cartRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  cartItemText: { 
    color: '#94a3b8', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  cartItemPrice: { 
    color: '#00ffcc', 
    fontSize: 12, 
    fontWeight: '900' 
  },
});
