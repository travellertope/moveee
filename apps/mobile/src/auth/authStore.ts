import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api, CULTURE_API, setUnauthorizedHandler } from "../api/client";
import { storage } from "../store/storage";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  profileSetupRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hydrate: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
  setProfileSetupRequired: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // When any API call returns 401, force a logout so the user lands on login.
  setUnauthorizedHandler(() => {
    const { isAuthenticated, logout } = get();
    if (isAuthenticated) logout();
  });
  return {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  profileSetupRequired: false,

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
    // Clear auth state immediately so the 401 handler doesn't re-trigger logout.
    set({ user: null, token: null, isAuthenticated: false, profileSetupRequired: false });
    storage.delete("auth_token");
    await SecureStore.deleteItemAsync("auth_token").catch(() => null);
    api.post(`${CULTURE_API}/mobile/logout`, {}).catch(() => null);
  },

  refreshProfile: async () => {
    const user = await api.get<User>(`${CULTURE_API}/mobile/me`);
    set({ user });
  },

  updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),
  setProfileSetupRequired: (val) => set({ profileSetupRequired: val }),
  }; // end return
}); // end create
