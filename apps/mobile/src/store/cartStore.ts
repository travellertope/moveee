import { create } from "zustand";

interface CartState {
  itemCount: number;
  setItemCount: (n: number) => void;
  increment: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  itemCount: 0,
  setItemCount: (n) => set({ itemCount: n }),
  increment: () => set((s) => ({ itemCount: s.itemCount + 1 })),
}));
