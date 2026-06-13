import { create } from "zustand";

export interface CartItem {
  id: string;
  productId: number;
  title: string;
  brand: string;
  variant?: string;
  price: number;
  image?: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  // legacy compat
  setItemCount: (n: number) => void;
  increment: () => void;
}

function countItems(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  itemCount: 0,

  addItem: (item) =>
    set((s) => {
      const existing = s.items.find((i) => i.id === item.id);
      const items = existing
        ? s.items.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
        : [...s.items, { ...item, qty: 1 }];
      return { items, itemCount: countItems(items) };
    }),

  removeItem: (id) =>
    set((s) => {
      const items = s.items.filter((i) => i.id !== id);
      return { items, itemCount: countItems(items) };
    }),

  updateQty: (id, qty) =>
    set((s) => {
      const items =
        qty <= 0
          ? s.items.filter((i) => i.id !== id)
          : s.items.map((i) => (i.id === id ? { ...i, qty } : i));
      return { items, itemCount: countItems(items) };
    }),

  clearCart: () => set({ items: [], itemCount: 0 }),

  // legacy compat used by older screens
  setItemCount: (n) => set({ itemCount: n }),
  increment: () => set((s) => ({ itemCount: s.itemCount + 1 })),
}));
