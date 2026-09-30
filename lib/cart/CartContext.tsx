"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  serviceId: string;
  platformId: string;
  platformLabel: string;
  category: string;
  qty: string;
  qtyValue: number;
  priceCents: number;
  targetLink: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateLink: (id: string, targetLink: string) => void;
  clear: () => void;
  totalCents: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "surgeon_cart";

function readInitialItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // One-time hydration from localStorage after mount (SSR has no access to it).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readInitialItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage write failures (private mode, quota, etc.)
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => [
      ...prev,
      { ...item, id: `${item.serviceId}-${item.qtyValue}-${Date.now()}` },
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateLink = useCallback((id: string, targetLink: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, targetLink } : i)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalCents = useMemo(() => items.reduce((sum, i) => sum + i.priceCents, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateLink, clear, totalCents, count: items.length }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
