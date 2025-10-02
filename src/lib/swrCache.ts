export function shouldRevalidate(fetchedAt: number | null, ttlMs: number): boolean {
  if (!fetchedAt) return true;
  if (ttlMs <= 0) return true; // always revalidate in background
  return Date.now() - fetchedAt > ttlMs;
}

const inflight = new Map<string, Promise<unknown>>();

export async function dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fetcher()
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
