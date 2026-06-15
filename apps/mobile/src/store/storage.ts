import AsyncStorage from "@react-native-async-storage/async-storage";

// In-memory map provides synchronous reads; AsyncStorage provides persistence.
const mem = new Map<string, string>();

/**
 * Load all persisted keys into memory. Call once before the app renders
 * (see App.tsx) so that synchronous reads on startup return correct values.
 */
export async function hydrateStorage(): Promise<void> {
  try {
    const keys = (await AsyncStorage.getAllKeys()) as string[];
    if (keys.length) {
      const pairs = await AsyncStorage.multiGet(keys);
      for (const [k, v] of pairs) {
        if (k !== null && v !== null) mem.set(k, v);
      }
    }
  } catch {}
}

// Drop-in replacement for the MMKV `storage` instance used across the app.
export const storage = {
  getString(key: string): string | undefined {
    return mem.get(key);
  },

  getNumber(key: string): number | undefined {
    const v = mem.get(key);
    if (v === undefined) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  },

  set(key: string, value: string | number | boolean): void {
    const s = String(value);
    mem.set(key, s);
    AsyncStorage.setItem(key, s).catch(() => {});
  },

  delete(key: string): void {
    mem.delete(key);
    AsyncStorage.removeItem(key).catch(() => {});
  },
};

const CACHE_META_KEY = "__cache_meta__";

function getMeta(): Record<string, number> {
  const raw = storage.getString(CACHE_META_KEY);
  return raw ? JSON.parse(raw) : {};
}

function setMeta(meta: Record<string, number>) {
  storage.set(CACHE_META_KEY, JSON.stringify(meta));
}

export const cache = {
  set(key: string, value: unknown, ttlMs: number) {
    storage.set(key, JSON.stringify(value));
    const meta = getMeta();
    meta[key] = Date.now() + ttlMs;
    setMeta(meta);
  },

  get<T>(key: string): T | null {
    const meta = getMeta();
    const expiry = meta[key];
    if (!expiry || Date.now() > expiry) return null;
    const raw = storage.getString(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  invalidate(key: string) {
    storage.delete(key);
    const meta = getMeta();
    delete meta[key];
    setMeta(meta);
  },
};

export const TTL = {
  SHORT: 5 * 60 * 1000,
  MEDIUM: 30 * 60 * 1000,
  LONG: 24 * 60 * 60 * 1000,
};
