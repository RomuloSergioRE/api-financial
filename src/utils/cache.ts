import { LRUCache } from 'lru-cache';

const store = new LRUCache<string, object>({
  max: 500,
});

export function getCached<T extends object>(key: string): T | null {
  const entry = store.get(key);
  return entry !== undefined ? (entry as T) : null;
}

export function setCache<T extends object>(key: string, data: T, ttlMs: number): void {
  store.set(key, data, { ttl: ttlMs });
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(pattern)) {
      store.delete(key);
    }
  }
}
