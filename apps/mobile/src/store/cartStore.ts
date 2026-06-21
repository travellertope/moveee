import { create } from "zustand";
import { storage } from "./storage";

export interface CartItem {
  id: string;
  productId: number;
  title: string;
  brand: string;
  variant?: string;
  variationId?: number;
  price: number;
  currencySymbol?: string;
  image?: string;
  qty: number;
}

export interface WishlistItem {
  id: number;
  title: string;
  brand: string;
  price: string;
  image?: string | null;
  slug: string;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  wishlist: WishlistItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (item: WishlistItem) => void;
  isWishlisted: (id: number) => boolean;
  // legacy compat
  setItemCount: (n: number) => void;
  increment: () => void;
}

const WISHLIST_KEY = "wishlist_items";

function loadWishlist(): WishlistItem[] {
  try {
    const raw = storage.getString(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWishlist(items: WishlistItem[]) {
  try {
    storage.set(WISHLIST_KEY, JSON.stringify(items));
  } catch {}
}

function countItems(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  itemCount: 0,
  wishlist: loadWishlist(),

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

  toggleWishlist: (item) =>
    set((s) => {
      const id = Number(item.id);
      const exists = s.wishlist.some((w) => Number(w.id) === id);
      const wishlist = exists
        ? s.wishlist.filter((w) => Number(w.id) !== id)
        : [...s.wishlist, { ...item, id }];
      saveWishlist(wishlist);
      return { wishlist };
    }),

  isWishlisted: (id) => get().wishlist.some((w) => Number(w.id) === Number(id)),

  // legacy compat used by older screens
  setItemCount: (n) => set({ itemCount: n }),
  increment: () => set((s) => ({ itemCount: s.itemCount + 1 })),
}));
