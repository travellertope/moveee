import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({ id: "moveee-store" });

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
