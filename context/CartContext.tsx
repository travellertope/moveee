"use client";

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  key: string;
  id: number;
  name: string;
  quantity: number;
  images: { src: string }[];
  prices: {
    price: string;
    currency_symbol: string;
    currency_minor_unit: number;
  };
}

interface CartTotals {
  total_price: string;
  currency_symbol: string;
  currency_minor_unit: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totals: CartTotals | null;
  isOpen: boolean;
  isLoading: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  updateItem: (key: string, quantity: number) => Promise<void>;
}

// ─── Price formatter ──────────────────────────────────────────────────────────

export function fmtWCPrice(amount: string | number, symbol: string, minorUnit: number): string {
  const num = Number(amount) / Math.pow(10, minorUnit);
  return `${symbol}${num.toFixed(minorUnit)}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]     = useState<CartItem[]>([]);
  const [totals, setTotals]   = useState<CartTotals | null>(null);
  const [isOpen, setIsOpen]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const nonceRef = useRef<string | null>(null);

  const applyCart = useCallback((data: any, nonce: string | null) => {
    if (nonce) nonceRef.current = nonce;
    setItems(data?.items ?? []);
    if (data?.totals) {
      setTotals({
        total_price:          data.totals.total_price     ?? "0",
        currency_symbol:      data.totals.currency_symbol ?? "£",
        currency_minor_unit:  data.totals.currency_minor_unit ?? 2,
      });
    }
  }, []);

  useEffect(() => {
    fetch("/api/cart")
      .then(async (res) => {
        const nonce = res.headers.get("x-wc-store-api-nonce");
        applyCart(await res.json(), nonce);
      })
      .catch(() => {});
  }, [applyCart]);

  const authHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (nonceRef.current) h["X-WC-Store-Api-Nonce"] = nonceRef.current;
    return h;
  }, []);

  const mutate = useCallback(async (action: string, body: object): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cart?action=${action}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const nonce = res.headers.get("x-wc-store-api-nonce");
      if (!res.ok) throw new Error();
      applyCart(await res.json(), nonce);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders, applyCart]);

  const addItem = useCallback(async (productId: number, quantity = 1) => {
    const ok = await mutate("add", { id: productId, quantity });
    if (ok) setIsOpen(true);
  }, [mutate]);

  const removeItem = useCallback(async (key: string) => {
    await mutate("remove", { key });
  }, [mutate]);

  const updateItem = useCallback(async (key: string, quantity: number) => {
    await mutate("update", { key, quantity });
  }, [mutate]);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, itemCount, totals, isOpen, isLoading,
      openDrawer:  () => setIsOpen(true),
      closeDrawer: () => setIsOpen(false),
      addItem, removeItem, updateItem,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
