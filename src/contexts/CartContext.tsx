
'use client';

import React, { createContext, useState, useContext, useCallback } from "react";
import { toast } from "react-hot-toast";
import { CartItem, Product } from "../types/pos";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateDiscount: (productId: number, discount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: (taxRate?: number) => number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} is currently out of stock.`);
      return;
    }

    setItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const newQuantity = currentQuantity + quantity;

      if (newQuantity > product.stock) {
        toast.error(`Only ${product.stock} units available.`);
        return prev;
      }

      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prev, { product, quantity, discount: 0 }];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;

      if (quantity > item.product.stock) {
        toast.error(`Only ${item.product.stock} units available.`);
        return prev;
      }

      return prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i));
    });
  }, [removeItem]);

  const updateDiscount = useCallback((productId: number, discount: number) => {
    setItems((prev) => prev.map((item) => (item.product.id === productId ? { ...item, discount } : item)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getSubtotal = useCallback(() => {
    return items.reduce((total, item) => {
      return total + (item.product.price * item.quantity) - item.discount;
    }, 0);
  }, [items]);

  const getTotal = useCallback((taxRate = 0) => {
    const subtotal = getSubtotal();
    return subtotal + (subtotal * taxRate / 100);
  }, [getSubtotal]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateDiscount,
        clearCart,
        getSubtotal,
        getTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
