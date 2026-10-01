import { prisma } from "../lib/prisma";
import { getSystemSettings } from "../app/actions/settings";
import { getDashboardConfig } from "../lib/dashboard/engine";
import {
  getCommandCenterData,
  getAllTenants,
  getSystemLogs,
  getSystemDomains,
  getRecentAlerts,
  getTopUsage,
  getOutstandingPayments,
  getCompaniesInGrace,
  getPlanSuggestions,
} from "../app/actions/admin-sovereignty";

async function runStep(name: string, fn: () => Promise<any>) {
  const t0 = Date.now();
  console.log(`[START] ${name}...`);
  try {
    const res = await fn();
    console.log(`[DONE] ${name} in ${Date.now() - t0}ms`);
    return res;
  } catch (err: any) {
    console.error(`[ERROR] ${name} in ${Date.now() - t0}ms:`, err.message);
  }
}

async function testAllAdminOperations() {
  console.log("=== Testing all admin backend queries ===");

  await runStep("1. prisma.systemOwner.findFirst", () =>
    prisma.systemOwner.findFirst({ where: { email: "owner@system.local" } }),
  );

  await runStep("2. getSystemSettings", () => getSystemSettings());

  await runStep("3. getDashboardConfig", async () =>
    getDashboardConfig("SYSTEM_OWNER", "ar", undefined, "/admin"),
  );

  await runStep("4. getSystemDomains", () => getSystemDomains());

  await runStep("5. prisma.subscription.findMany", () =>
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    }),
  );

  await runStep("6. prisma.company.count", () =>
    prisma.company.count({ where: { status: "ACTIVE" } }),
  );

  await runStep("7. prisma.systemAlert.count", () =>
    prisma.systemAlert.count({ where: { resolved: false } }),
  );

  await runStep("8. prisma.systemMetric.findMany", () =>
    prisma.systemMetric.findMany({
      where: { metricName: { in: ["CPU_USAGE", "MEMORY_USAGE"] } },
      orderBy: { timestamp: "desc" },
      take: 2,
    }),
  );

  await runStep("9. prisma.decisionQueue.findMany", () =>
    prisma.decisionQueue.findMany({
      where: { status: "PENDING" },
      orderBy: { timestamp: "desc" },
    }),
  );

  await runStep("10. prisma.auditLog.findMany", () =>
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 50,
    }),
  );

  await runStep("11. prisma.material.count", () =>
    (prisma.material as any).count({ where: { stock: { lte: 500 } } }),
  );

  console.log("=== All steps completed ===");
  process.exit(0);
}

testAllAdminOperations().catch(console.error);
