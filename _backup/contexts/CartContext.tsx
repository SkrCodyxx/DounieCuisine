import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Dish, DishVariant } from "@shared/schema";

interface Side {
  id: number;
  name: string;
  description?: string;
  price: number;
}

interface CartItem {
  dish: Dish;
  quantity: number;
  specialRequests?: string;
  variant?: DishVariant; // Variante flexible sélectionnée (remplace selectedVariant et selectedSize)
  selectedSide?: Side; // Accompagnement sélectionné
}

interface CartContextType {
  items: CartItem[];
  addItem: (dish: Dish, quantity?: number, specialRequests?: string, variant?: DishVariant, selectedSide?: Side) => void;
  removeItem: (dishId: number, variantId?: number) => void;
  updateQuantity: (dishId: number, quantity: number, variantId?: number) => void;
  updateItemSide: (dishId: number, variantId: number | undefined, selectedSide?: Side) => void;
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
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [tip, setTipState] = useState<number>(0);
  const [tipPercentage, setTipPercentageState] = useState<number | null>(null);

  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Plus d'authentification client - commandes directes uniquement
  const isAuthenticated = false;

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (dish: Dish, quantity = 1, specialRequests?: string, variant?: any, selectedSide?: Side) => {
    // Allow visitors to add items to cart without authentication
    // Auth will be required at checkout
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => 
        item.dish.id === dish.id && 
        (!variant || item.variant?.id === variant.id) &&
        (!selectedSide || item.selectedSide?.id === selectedSide.id)
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (specialRequests) {
          updated[existingIndex].specialRequests = specialRequests;
        }
        return updated;
      }
      
      return [...prev, { 
        dish, 
        quantity, 
        specialRequests, 
        variant,
        selectedSide
      }];
    });

    const variantText = variant ? ` (${variant.label})` : '';
    const sideText = selectedSide ? ` + ${selectedSide.name}` : '';
    const priceText = variant ? ` - $${parseFloat(variant.price).toFixed(2)} CAD` : (dish.price ? ` - $${parseFloat(dish.price).toFixed(2)} CAD` : '');
    
    toast({
      title: "Ajouté au panier",
      description: `${dish.name}${variantText}${sideText}${priceText} x${quantity} ajouté`,
    });
  };

  const removeItem = (dishId: number, variantId?: number) => {
    setItems((prev) => prev.filter((item) => 
      !(item.dish.id === dishId && 
        (!variantId || item.variant?.id === variantId))
    ));
  };

  const updateQuantity = (dishId: number, quantity: number, variantId?: number) => {
    // Clamp quantity to minimum 1
    const clampedQuantity = Math.max(1, Math.floor(quantity));
    
    if (clampedQuantity <= 0) {
      removeItem(dishId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.dish.id === dishId && (!variantId || item.variant?.id === variantId)
          ? { ...item, quantity: clampedQuantity } 
          : item
      )
    );
  };

  const updateItemSide = (dishId: number, variantId: number | undefined, selectedSide?: Side) => {
    setItems((prev) =>
      prev.map((item) =>
        item.dish.id === dishId && (!variantId || item.variant?.id === variantId)
          ? { ...item, selectedSide }
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
    // Maximum 50% du sous-total
    const subtotal = getTotalPrice();
    const maxTip = subtotal * 0.5;
    const clampedAmount = Math.min(Math.max(0, amount), maxTip);
    setTipState(clampedAmount);
    setTipPercentageState(null); // Reset percentage when custom amount is set
  };

  const setTipPercentage = (percent: number | null) => {
    setTipPercentageState(percent);
    if (percent !== null) {
      const subtotal = getTotalPrice();
      const calculatedTip = (subtotal * percent) / 100;
      setTipState(calculatedTip);
    } else {
      setTipState(0);
    }
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => {
      let price = 0;
      
      // Si une variante est sélectionnée, utiliser son prix
      if (item.variant) {
        price = parseFloat(item.variant.price as any || "0");
      } 
      // Sinon, utiliser le prix de base du plat
      else {
        price = parseFloat(item.dish.price || "0");
      }
      
      // Ajouter le prix de l'accompagnement si sélectionné
      if (item.selectedSide) {
        price += parseFloat(item.selectedSide.price as any || "0");
      }
      
      return sum + price * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateItemSide,
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
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
