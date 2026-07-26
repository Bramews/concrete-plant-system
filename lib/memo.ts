const cache = new Map<string, { data: unknown; timestamp: number }>();
const TTL = 60 * 1000; // 1 minute

/**
 * Simple in-memory memoization for server-side read actions.
 * In production, this should be replaced by Redis or similar.
 */
export async function memoize<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < TTL) {
    return cached.data as T;
  }

  const data = await fn();
  cache.set(key, { data, timestamp: now });
  return data;
}
