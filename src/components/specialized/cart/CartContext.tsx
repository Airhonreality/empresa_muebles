'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type CartItemType = 'prefabricado' | 'catalogo';

export interface CartItem {
  tipo: CartItemType;
  ref_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  imagen_url?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (ref_id: string, cantidad: number) => void;
  removeItem: (ref_id: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'veta_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error cargando carrito:', e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isLoaded]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.ref_id === newItem.ref_id);
      if (existing) {
        return prev.map((item) =>
          item.ref_id === newItem.ref_id
            ? { ...item, cantidad: item.cantidad + newItem.cantidad }
            : item
        );
      }
      return [...prev, newItem];
    });
  };

  const updateQuantity = (ref_id: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeItem(ref_id);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.ref_id === ref_id ? { ...item, cantidad } : item
      )
    );
  };

  const removeItem = (ref_id: string) => {
    setItems((prev) => prev.filter((item) => item.ref_id !== ref_id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((acc, item) => acc + item.precio_unitario * item.cantidad, 0);
  const itemCount = items.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
}
