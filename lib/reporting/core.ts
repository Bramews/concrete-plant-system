import { prisma } from "@/lib/prisma";

export interface DashboardMetrics {
  totalOrders: number;
  activeOrders: number;
  totalProductionVol: number;
  totalRevenue: number;
  labPending: number;
  trends: {
    production: { date: string; value: number }[];
    revenue: { date: string; value: number }[];
    growth: {
      revenue: number; // Percentage growth vs previous 7 days
      production: number; // Percentage growth vs previous 7 days
    };
  };
}

export async function getCompanyMetrics(
  companyId: number,
): Promise<DashboardMetrics> {
  // 1. Orders Stats
  const totalOrders = await prisma.order.count({
    where: { companyId },
  });

  const activeOrders = await prisma.order.count({
    where: {
      companyId,
      status: { in: ["CONFIRMED", "IN_PROGRESS", "PARTIALLY_DISPATCHED"] },
    },
  });

  const productionAggregation = (await prisma.batch.aggregate({
    where: {
      order: {
        companyId,
      },
    },
    _sum: {
      volume: true,
    },
  } as any)) as any;

  // 3. Revenue (Sum of Invoices linked to Company Orders)
  const revenueAggregation = await prisma.invoice.aggregate({
    where: {
      order: {
        companyId,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // 4. Lab Pending
  const labPending = await prisma.labApproval.count({
    where: {
      order: {
        companyId,
      },
      status: "PENDING",
    },
  });

  // 5. Trends (Current Period: Last 7 Days, Previous Period: 7-14 Days ago)
  const currentTrends = await getTrends(companyId, 7, 0);
  const previousTrends = await getTrends(companyId, 7, 1);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const currentRevenueSum = currentTrends.revenue.reduce(
    (acc, curr) => acc + curr.value,
    0,
  );
  const previousRevenueSum = previousTrends.revenue.reduce(
    (acc, curr) => acc + curr.value,
    0,
  );
  const currentProdSum = currentTrends.production.reduce(
    (acc, curr) => acc + curr.value,
    0,
  );
  const previousProdSum = previousTrends.production.reduce(
    (acc, curr) => acc + curr.value,
    0,
  );

  const growth = {
    revenue: calculateGrowth(currentRevenueSum, previousRevenueSum),
    production: calculateGrowth(currentProdSum, previousProdSum),
  };

  return {
    totalOrders,
    activeOrders,
    totalProductionVol: (productionAggregation._sum as any)?.volume || 0,
    totalRevenue: revenueAggregation._sum.amount || 0,
    labPending,
    trends: {
      ...currentTrends,
      growth,
    },
  };
}

async function getTrends(companyId: number, days: number, offsetWeeks = 0) {
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i) - offsetWeeks * 7);
    return d.toISOString().split("T")[0];
  });

  const production = await Promise.all(
    dates.map(async (date) => {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);

      const sum = (await prisma.batch.aggregate({
        where: {
          order: { companyId },
          createdAt: { gte: start, lt: end },
        },
        _sum: { volume: true },
      } as any)) as any;
      return { date, value: (sum._sum as any)?.volume || 0 };
    }),
  );

  const revenue = await Promise.all(
    dates.map(async (date) => {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);

      const sum = await prisma.invoice.aggregate({
        where: {
          order: { companyId },
          createdAt: { gte: start, lt: end },
        },
        _sum: { amount: true },
      });
      return { date, value: sum._sum.amount || 0 };
    }),
  );

  return { production, revenue };
}
