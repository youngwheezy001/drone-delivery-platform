import React, { createContext, useContext, useState, useMemo } from 'react';

// 🛰️ THE LOGISTICS CART CONTEXT
// Centralized state for 'Mission Bag' management across Discover & Marketplace.

type CartItem = {
  item: any;
  qty: number;
};

type CartContextType = {
  cart: Record<string, CartItem>;
  addToCart: (item: any) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalWeight: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  const addToCart = (item: any) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { item, qty: (prev[item.id]?.qty || 0) + 1 }
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      if (!prev[itemId]) return prev;
      const newCart = { ...prev };
      if (newCart[itemId].qty > 1) {
        newCart[itemId] = { ...newCart[itemId], qty: newCart[itemId].qty - 1 };
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const clearCart = () => setCart({});

  const totalItems = useMemo(() => 
    Object.values(cart).reduce((sum, payload) => sum + payload.qty, 0), 
  [cart]);

  const totalPrice = useMemo(() => 
    Object.values(cart).reduce((sum, payload) => sum + (payload.item.price * payload.qty), 0), 
  [cart]);

  const totalWeight = useMemo(() => 
    Object.values(cart).reduce((sum, payload) => sum + (payload.item.weight * payload.qty), 0), 
  [cart]);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      totalItems, 
      totalPrice, 
      totalWeight 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
