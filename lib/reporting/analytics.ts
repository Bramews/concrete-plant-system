import { prisma } from "@/lib/prisma";

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export async function getProductionTrend(
  companyId: number,
  days = 7,
): Promise<TrendPoint[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Group by date logic is tricky in Prisma + SQLite without raw queries.
  // For safety/ORM purity, we fetch data in range and aggregate in JS specific to this company.
  // Isolation is guaranteed by `where: { companyId }`.

  const batches = (await prisma.batch.findMany({
    where: {
      order: { companyId },
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      volume: true,
    },
  } as any)) as any[];

  // Map to bucket
  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().split("T")[0], 0);
  }

  batches.forEach((b) => {
    const k = b.createdAt.toISOString().split("T")[0];
    if (map.has(k)) {
      map.set(k, (map.get(k) || 0) + (b.volume || 0));
    }
  });

  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getRevenueTrend(
  companyId: number,
  days = 7,
): Promise<TrendPoint[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const invoices = (await prisma.invoice.findMany({
    where: {
      order: { companyId },
      issuedAt: { gte: startDate },
    } as any,
    select: {
      issuedAt: true,
      amount: true,
    } as any,
  })) as any[];

  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().split("T")[0], 0);
  }

  invoices.forEach((inv) => {
    const k = (inv.issuedAt || new Date()).toISOString().split("T")[0];
    if (map.has(k)) {
      map.set(k, (map.get(k) || 0) + (inv.amount || 0));
    }
  });

  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
