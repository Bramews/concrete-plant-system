import { NextResponse } from "next/server";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const trackers = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(
  ip: string,
  config: RateLimitConfig = { limit: 100, windowMs: 60000 },
) {
  if (process.env.NODE_ENV !== "production") return { success: true };

  const now = Date.now();
  const record = trackers.get(ip);

  if (!record || now > record.expiresAt) {
    trackers.set(ip, { count: 1, expiresAt: now + config.windowMs });
    return { success: true };
  }

  if (record.count >= config.limit) {
    return { success: false };
  }

  record.count++;
  return { success: true };
}

// Global Clean interval (every 5 mins) to prevent memory leak
if (!globalThis.rateLimitCleaner) {
  globalThis.rateLimitCleaner = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of trackers.entries()) {
      if (now > value.expiresAt) trackers.delete(key);
    }
  }, 300000); // 5 mins
}

declare global {
  var rateLimitCleaner: NodeJS.Timeout | undefined;
}
