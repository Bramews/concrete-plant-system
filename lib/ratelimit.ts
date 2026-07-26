import { prisma } from "@/lib/prisma";

// Hybrid Rate Limiter
// In production, use Redis. locally/MVP use DB or In-Memory Map (for edge functions)
// Since we are running on standard Node, we can use a global Map for memory cache
// But for persistence across scaling, DB is safer if no Redis.

const MEMORY_CACHE = new Map<string, { count: number; expires: number }>();

export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowSeconds = 60,
) {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  // 1. Check Memory Cache first (Fastest)
  const cached = MEMORY_CACHE.get(key);
  if (cached && cached.expires > now) {
    if (cached.count >= limit) return { allowed: false, remaining: 0 };

    cached.count++;
    MEMORY_CACHE.set(key, cached);
    return { allowed: true, remaining: limit - cached.count };
  }

  // 2. Fallback to DB (If persistence needed) or just Reset Memory
  // For this implementation, we will use DB 'UsageEvent' to count accurately across instances if needed
  // But for SPEED, rate limiting usually avoids DB.
  // Let's stick to Memory + Periodic sync or just Memory for now as requested "Simulated via DB" in task.md

  // DB Logic:
  const windowStart = new Date(now - windowSeconds * 1000);
  const count = await prisma.usageEvent.count({
    where: {
      source: identifier, // abusing source field for IP/User key?
      metric: "API_CALL",
      createdAt: { gte: windowStart },
    },
  });

  if (count >= limit) {
    MEMORY_CACHE.set(key, { count, expires: now + 10000 }); // Cache block for 10s
    return { allowed: false, remaining: 0 };
  }

  // Log this call (Async)
  prisma.usageEvent
    .create({
      data: {
        companyId: 0, // System level or parse identifier
        metric: "API_CALL",
        delta: 1,
        source: identifier,
      },
    })
    .catch(console.error);

  return { allowed: true, remaining: limit - count - 1 };
}
