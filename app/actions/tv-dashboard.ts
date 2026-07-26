"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getTvDashboardData() {
  const user = await getCurrentUser();
  if (!user?.companyId) return { error: "UNAUTHENTICATED" } as const;
  const role =
    typeof user.role === "string" ? user.role : (user.role as any)?.name;
  const allowed = [
    "MANAGER",
    "COMPANY_ADMIN",
    "OPERATOR",
    "SYSTEM_OWNER",
    "LAB_ENGINEER",
    "LAB_MANAGER",
  ];
  if (!allowed.includes(role)) return { error: "FORBIDDEN" } as const;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    todayBatches,
    activeOrders,
    activeTickets,
    lowStockMaterials,
    recentLabTests,
  ] = await Promise.all([
    // إنتاج اليوم
    prisma.batch.findMany({
      where: {
        companyId: user.companyId,
        createdAt: { gte: today },
      },
      select: { quantity: true },
    }),

    // الطلبات النشطة (في مرحلة الإنتاج)
    prisma.order.findMany({
      where: {
        companyId: user.companyId,
        status: { in: ["LAB_APPROVED", "PRODUCTION", "DELIVERED"] },
      },
      include: {
        customer: { select: { name: true } },
        mixDesign: { select: { name: true, grade: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // الشاحنات في الطريق
    prisma.deliveryTicket.findMany({
      where: {
        companyId: user.companyId,
        status: "DISPATCHED",
        createdAt: { gte: today },
      },
      select: {
        ticketNumber: true,
        truckNumber: true,
        driverName: true,
        cumulativeQuantity: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // المواد منخفضة المخزون
    prisma.material.findMany({
      where: {
        companyId: user.companyId,
        stock: { lt: 10 },
        status: "ACTIVE",
      },
      select: { name: true, stock: true, unit: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),

    // آخر نتائج المختبر اليوم
    prisma.cubeTest.findMany({
      where: {
        companyId: user.companyId,
        createdAt: { gte: today },
      },
      include: {
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const todayVolume = todayBatches.reduce((sum, b) => sum + b.quantity, 0);
  const truckCount = activeTickets.length;

  return {
    todayVolume: Math.round(todayVolume * 10) / 10,
    truckCount,
    activeOrderCount: activeOrders.length,
    activeOrders,
    activeTickets,
    lowStockMaterials,
    recentLabTests,
    updatedAt: new Date().toISOString(),
  };
}
