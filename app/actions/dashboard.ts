"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Data Strategy: Hybrid (Mock + API)
// 1. Production -> API (Prisma)
// 2. Lab -> API (Prisma)
// 3. Financial -> Mock (until Schema update)
// 4. Alerts -> Hybrid (Safe Mock for now)
export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    return {
      production: { ordersToday: 0, volumeToday: 0 },
      lab: { pendingCubes: 0, avgStrength: 0 },
      financial: { openInvoices: 0, todayPayments: 0 },
      system: { activeUsers: 0, totalCompanies: 0, suspendedCompanies: 0 },
      status: "ACTIVE",
      alerts: [],
    };
  }

  const companyId = user.companyId;
  const role = user.role as string; // Assert as string based on ExtendedUser type
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const data = {
    production: { ordersToday: 0, volumeToday: 0 },
    lab: { pendingCubes: 0, avgStrength: 0 },
    financial: { openInvoices: 0, todayPayments: 0 },
    system: { activeUsers: 0, totalCompanies: 0, suspendedCompanies: 0 },
    status: "ACTIVE",
    alerts: [] as Array<{
      id: number;
      title: string;
      message: string;
      severity: "INFO" | "WARNING" | "CRITICAL"; // Ensure simplified string union matching UI
      timestamp: Date;
    }>,
  };

  // 1. Production Metrics
  const ordersToday = await prisma.order.findMany({
    where: {
      companyId,
      createdAt: { gte: today },
    },
    select: { volume: true },
  });

  data.production.ordersToday = ordersToday.length;
  // Volume might be float, ensure mocked if null (though schema says Float, usually not nullable? schema says Float (not Float?))
  // Schema: volume Float. So it's safe.
  data.production.volumeToday = ordersToday.reduce(
    (sum, order) => sum + order.volume,
    0,
  );

  // 2. Lab Metrics
  // Count orders pending lab action
  data.lab.pendingCubes = await prisma.order.count({
    where: {
      companyId,
      status: { in: ["PENDING_LAB", "CURING"] },
    },
  });

  // 3. System Health
  data.system.activeUsers = await prisma.user.count({
    where: { companyId, status: "ACTIVE" },
  });

  // 4. Financial (If authorized)
  if (["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"].includes(role)) {
    data.financial.openInvoices = 0; // Mock until Invoice model exists

    const paymentsToday = await prisma.payment.findMany({
      where: { companyId, createdAt: { gte: today }, status: "PAID" },
    });
    data.financial.todayPayments = paymentsToday.reduce(
      (sum, p) => sum + p.amount,
      0,
    );
  }

  // Company Status
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { status: true },
  });
  data.status = company?.status || "ACTIVE";

  // Pure Alert Generation
  // In a real system, these would likely be localized via a key or have content in the user's language.
  // For this demonstration, providing Arabic/English context.
  data.alerts = [
    {
      id: 1,
      title: "صيانة النظام (System Maint)",
      message:
        "صيانة مجدولة الليلة الساعة 02:00 صباحاً. (Scheduled maintenance at 02:00 AM)",
      severity: "INFO" as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      id: 2,
      title: "انخفاض مخزون الأسمنت (Low Stock)",
      message: "سايلو رقم 3 أقل من 15% من السعة الاستيعابية.",
      severity: "WARNING" as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 300),
    },
  ];

  // 5. System Owner Extras
  if (role === "SYSTEM_OWNER") {
    data.system.totalCompanies = await prisma.company.count();
    data.system.suspendedCompanies = await prisma.company.count({
      where: { status: "SUSPENDED" },
    });
  }

  return data;
}
