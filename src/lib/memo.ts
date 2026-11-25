/** Cache în memorie cu TTL, pentru interogări agregate (statistici, sitemap). */
const store = new Map<string, { expires: number; value: Promise<unknown> }>();

export function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) return hit.value as Promise<T>;
  const value = fn();
  store.set(key, { expires: now + ttlMs, value });
  value.catch(() => store.delete(key));
  return value;
}
