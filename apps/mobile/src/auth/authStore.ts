import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api, CULTURE_API } from "../api/client";
import { storage } from "../store/storage";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hydrate: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      if (!token) return;
      storage.set("auth_token", token);
      const user = await api.get<User>(`${CULTURE_API}/mobile/me`);
      set({ user, token, isAuthenticated: true });
    } catch {
      await SecureStore.deleteItemAsync("auth_token");
      storage.delete("auth_token");
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await api.post<{ token: string; user: User }>(
      `${CULTURE_API}/mobile/login`,
      { email, password },
      false
    );
    await SecureStore.setItemAsync("auth_token", res.token);
    storage.set("auth_token", res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },

  loginWithToken: async (token, user) => {
    await SecureStore.setItemAsync("auth_token", token);
    storage.set("auth_token", token);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await api.post(`${CULTURE_API}/mobile/logout`, {}).catch(() => null);
    await SecureStore.deleteItemAsync("auth_token");
    storage.delete("auth_token");
    set({ user: null, token: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    const user = await api.get<User>(`${CULTURE_API}/mobile/me`);
    set({ user });
  },

  updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),
}));
