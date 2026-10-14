"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LinkTarget, ServiceKind } from "@/lib/catalog";
import { useServices } from "@/lib/cart/useServices";
import { linePriceCents, unitSuffix } from "@/lib/serviceDocs";

export type CartItem = {
  id: string;
  serviceId: string;
  slug: string;
  kind: ServiceKind;
  target: LinkTarget;
  platformId: string;
  platformLabel: string;
  category: string;
  qty: string;
  qtyValue: number;
  /** Display only; the server re-derives the charge. */
  priceCents: number;
  targetLink: string;
  postsCovered?: number;
  comments?: string[];
  pollOption?: number;
  unavailable?: boolean;
};

export type CartItemPatch = Partial<Pick<CartItem, "targetLink" | "comments" | "pollOption">>;

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: CartItemPatch) => void;
  clear: () => void;
  totalCents: number;
  count: number;
  pricingLoaded: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "surgeon_cart";

function readInitialItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: CartItem[] = raw ? JSON.parse(raw) : [];
    // Carts saved before services had kinds were all plain profile orders.
    return items.map((i) => ({ ...i, kind: i.kind ?? "standard", target: i.target ?? "profile" }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { services, loaded: pricingLoaded } = useServices();
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

  const updateItem = useCallback((id: string, patch: CartItemPatch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const pricedItems = useMemo(() => items.map(item => {
    if (!pricingLoaded) return item;
    const service = services.find(s => s._id === item.serviceId);
    const tier = service?.tiers.find(t => t.qtyValue === item.qtyValue);
    if (!service || !tier) return { ...item, unavailable: true };
    const invalidPosts = service.kind === "auto" && item.postsCovered && item.postsCovered !== 30 && !tier.postsOptions?.some(option => option.posts === item.postsCovered);
    return { ...item, slug: service.slug, kind: service.kind, target: service.target, category: service.category, platformId: service.platformId, platformLabel: service.platformLabel, qty: `${tier.qty}${unitSuffix(service.kind)}`, priceCents: linePriceCents(tier, service.kind === "auto" ? item.postsCovered : null), unavailable: Boolean(invalidPosts) };
  }), [items, services, pricingLoaded]);
  const totalCents = useMemo(() => pricedItems.reduce((sum, i) => sum + i.priceCents, 0), [pricedItems]);

  return (
    <CartContext.Provider
      value={{ items: pricedItems, addItem, removeItem, updateItem, clear, totalCents, count: items.length, pricingLoaded }}
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
