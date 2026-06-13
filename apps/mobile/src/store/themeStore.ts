import { create } from "zustand";
import { storage } from "./storage";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "theme_mode";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: (storage.getString(STORAGE_KEY) as ThemeMode) ?? "system",
  setMode: (mode) => {
    storage.set(STORAGE_KEY, mode);
    set({ mode });
  },
}));
