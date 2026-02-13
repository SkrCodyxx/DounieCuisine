"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Dish, DishVariant } from "@/lib/schema";

interface Side {
  id: number;
  name: string;
  price: number;
}

interface CartItem {
  dish: Dish;
  quantity: number;
  specialRequests?: string;
  variant?: DishVariant;
  selectedSide?: Side;
}

interface CartContextType {
  items: CartItem[];
  addItem: (dish: Dish, quantity?: number, specialRequests?: string, variant?: DishVariant, selectedSide?: Side) => void;
  removeItem: (dishId: number, variantId?: number) => void;
  updateQuantity: (dishId: number, quantity: number, variantId?: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  tip: number;
  tipPercentage: number | null;
  setTip: (amount: number) => void;
  setTipPercentage: (percent: number | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "dounie-cuisine-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tip, setTipState] = useState(0);
  const [tipPercentage, setTipPercentageState] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
    setMounted(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, mounted]);

  const addItem = (dish: Dish, quantity = 1, specialRequests?: string, variant?: DishVariant, selectedSide?: Side) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.dish.id === dish.id &&
          (!variant || item.variant?.id === variant.id) &&
          (!selectedSide || item.selectedSide?.id === selectedSide.id)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [...prev, { dish, quantity, specialRequests, variant, selectedSide }];
    });

    const variantText = variant ? ` (${variant.label})` : "";
    const price = variant
      ? parseFloat(String(variant.price || "0")).toFixed(2)
      : dish.price
        ? parseFloat(String(dish.price)).toFixed(2)
        : "0.00";

    toast({
      title: "Ajoute au panier",
      description: `${dish.name}${variantText} - $${price} CAD x${quantity}`,
    });
  };

  const removeItem = (dishId: number, variantId?: number) => {
    setItems((prev) =>
      prev.filter((item) => !(item.dish.id === dishId && (!variantId || item.variant?.id === variantId)))
    );
  };

  const updateQuantity = (dishId: number, quantity: number, variantId?: number) => {
    const clamped = Math.max(1, Math.floor(quantity));
    if (clamped <= 0) {
      removeItem(dishId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.dish.id === dishId && (!variantId || item.variant?.id === variantId)
          ? { ...item, quantity: clamped }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setTipState(0);
    setTipPercentageState(null);
  };

  const setTip = (amount: number) => {
    const subtotal = getTotalPrice();
    setTipState(Math.min(Math.max(0, amount), subtotal * 0.5));
    setTipPercentageState(null);
  };

  const setTipPercentage = (percent: number | null) => {
    setTipPercentageState(percent);
    if (percent !== null) {
      setTipState((getTotalPrice() * percent) / 100);
    } else {
      setTipState(0);
    }
  };

  const getTotalItems = () => items.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPrice = () =>
    items.reduce((sum, item) => {
      let price = item.variant
        ? parseFloat(String(item.variant.price || "0"))
        : parseFloat(String(item.dish.price || "0"));
      if (item.selectedSide) price += item.selectedSide.price;
      return sum + price * item.quantity;
    }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        tip,
        tipPercentage,
        setTip,
        setTipPercentage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
