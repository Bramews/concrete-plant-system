"use server";

import { requireRole } from "@/lib/auth";
import {
  getGlobalSystemMode,
  getDecisionQueue,
  getGovernanceTimeline,
  getPowerMonitor,
} from "@/lib/sovereignty";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isSystemOwner } from "@/lib/sovereignty";
import { revalidatePath } from "next/cache";
import { sseEmitter } from "@/lib/network/emitter";

export async function getDashboardKPIs() {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Calculate MRR (Simulated/Calculated from active subscriptions)
    let mrr = 0;
    try {
      const subscriptions = await prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: true },
      });

      const PLAN_PRICES: Record<string, number> = {
        PRO: 199,
        ENTERPRISE: 499,
        BASIC: 49,
      };

      mrr = subscriptions.reduce(
        (acc: number, sub) => acc + (PLAN_PRICES[sub.plan?.key || ""] || 0),
        0,
      );
    } catch {
      /* subscription table may not exist */
    }

    // 2. Active Tenants
    const activeTenants = await prisma.company.count({
      where: { status: "ACTIVE" },
    });

    // 3. System Alerts (Billing/Core Issues)
    let systemAlerts = 0;
    try {
      systemAlerts = await prisma.systemAlert.count({
        where: { resolved: false },
      });
    } catch {
      /* fallback */
    }

    // 4. Low Stock Alerts (Global)
    let lowStock = 0;
    try {
      const res = await prisma.material.count({
        where: { stock: { lte: 500 } },
      } as any);
      lowStock = typeof res === "number" ? res : 0;
    } catch {
      /* material.stock field may not exist */
    }

    // 5. Storage (Placeholder for now)
    const storage = 0;

    return {
      mrr,
      activeTenants,
      systemAlerts,
      lowStock,
      storage,
    };
  } catch (error) {
    console.error("getDashboardKPIs error:", error);
    return {
      mrr: 0,
      activeTenants: 0,
      systemAlerts: 0,
      lowStock: 0,
      storage: 0,
    };
  }
}

export async function getCommandCenterData() {
  await requireRole(["SYSTEM_OWNER"]);

  const { mode, confidence } = await getGlobalSystemMode();
  const pendingQueue = await getDecisionQueue("PENDING");
  const powerMonitor = await getPowerMonitor();
  const kpis = await getDashboardKPIs(); // Integrate new KPIs

  return {
    mode,
    confidence,
    pendingQueue,
    powerMonitor,
    kpis,
    timestamp: new Date(),
  };
}

export async function getLiveSovereignStats() {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    // 1. Calculate MRR (Simulated/Calculated from active subscriptions)
    let mrr = 0;
    try {
      const subscriptions = await prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: true },
      } as any);

      const PLAN_PRICES: Record<string, number> = {
        PRO: 199,
        ENTERPRISE: 499,
        BASIC: 49,
      };

      mrr = subscriptions.reduce(
        (acc: number, sub: any) =>
          acc + (PLAN_PRICES[sub.plan?.key || ""] || 0),
        0,
      );
    } catch {
      /* subscription may not exist */
    }

    // 2. Risk Exposure (Pending alerts marked as risk)
    let riskExposure = 0;
    try {
      const riskAlerts = await prisma.systemAlert.count({
        where: { isRiskFlag: true, resolved: false },
      });
      // Synthetic value for now if no price data available without BillingEvent
      riskExposure = riskAlerts * 100;
    } catch (err) {
      console.error("Risk Exposure Calculation Fallback:", err);
    }

    // 3. Plan Distribution - SaaSPlan doesn't exist, use Subscription aggregation
    let planDistribution: { plan: string; count: number; revenue: number }[] =
      [];
    try {
      const planStats = await prisma.subscription.groupBy({
        by: ["planId"],
        _count: {
          planId: true,
        },
      } as any);

      // Fetch plans to map ID to Key
      const plans = await prisma.plan.findMany();
      const planMap = plans.reduce(
        (acc: Record<number, any>, p) => ({ ...acc, [p.id]: p }),
        {} as Record<number, any>,
      );

      const PLAN_PRICES: Record<string, number> = {
        PRO: 199,
        ENTERPRISE: 499,
        BASIC: 49,
      };

      planDistribution = planStats.map((ps: any) => {
        const planKey = planMap[ps.planId]?.key || "UNKNOWN";
        return {
          plan: planKey,
          count: ps._count.planId,
          revenue: (PLAN_PRICES[planKey] || 0) * ps._count.planId,
        };
      });
    } catch {
      /* ignore */
    }

    return {
      mrr,
      trend: "UP" as const,
      riskExposure,
      planDistribution,
    };
  } catch (error) {
    console.error("CRITICAL_STATS_FAILURE:", error);
    return {
      mrr: 0,
      trend: "STABLE" as const,
      riskExposure: 0,
      planDistribution: [],
    };
  }
}

import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";

export async function handleDecision(
  eventId: number,
  status: "RESOLVED" | "IGNORED",
  reason: string,
) {
  await requireRole(["SYSTEM_OWNER"]);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar"; // Default to Arabic
  const dict = getDictionary(lang);

  if (!reason || reason.length < 5) {
    throw new Error(dict.admin.sovereignty.errors.reason_required);
  }

  try {
    await prisma.billingEvent.update({
      where: { id: eventId },
      data: {
        status: status,
        reason: reason,
        decidedAt: new Date(),
        decidedBy: 1,
      },
    });

    // Audit the decision itself
    await prisma.auditLog.create({
      data: {
        action: `DECISION_${status}`,
        details: `${dict.admin.sovereignty.audit.decision} #${eventId}: ${status}. ${dict.admin.sovereignty.audit.reason}: ${reason}`,
        entity: "BillingEvent",
        entityId: String(eventId),
        // Assuming System Owner ID 1 for sovereign decisions
        systemOwnerId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: dict.admin.sovereignty.success.decision_executed,
    };
  } catch (error) {
    console.error("Sovereign decision error:", error);
    return {
      success: false,
      error: dict.admin.sovereignty.errors.decision_failed,
    };
  }
}

export async function fetchCompanyTimeline(companyId: number) {
  await requireRole(["SYSTEM_OWNER"]);
  return await getGovernanceTimeline(companyId);
}

export async function getAllTenants() {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    const companies = await prisma.company.findMany({
      where: {
        status: { not: "DELETED" },
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            // Role is via memberships now
            memberships: {
              include: { role: true },
            },
          },
        },
        subscription: {
          include: { plan: true },
        },

        _count: {
          select: {
            orders: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return companies;
  } catch (error) {
    console.error("getAllTenants error:", error);
    return [];
  }
}

export async function getSystemLogs(filters?: {
  search?: string;
  entity?: string;
  userId?: number;
  companyId?: number;
}) {
  await requireRole(["SYSTEM_OWNER"]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (filters?.companyId) {
    where.companyId = filters.companyId;
  }

  if (filters?.search) {
    where.OR = [
      { details: { contains: filters.search } },
      { action: { contains: filters.search } },
      { entity: { contains: filters.search } },
    ];
  }

  if (filters?.entity) {
    where.entity = filters.entity;
  }

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    take: 100,
    orderBy: { timestamp: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          // Removed role direct access
          company: { select: { name: true } },
        },
      },
    },
  });

  return logs;
}

export async function getSystemDomains() {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    const domains = await prisma.domain.findMany({
      where: {
        company: {
          status: { not: "DELETED" },
        },
      },
      include: {
        company: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return domains;
  } catch {
    return [];
  }
}

export async function searchGlobalUsers(query: string) {
  await requireRole(["SYSTEM_OWNER"]);

  if (!query || query.length < 2) return [];

  return await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
        { company: { name: { contains: query } } },
      ],
    },
    include: {
      company: { select: { name: true, slug: true } },
      memberships: {
        include: {
          role: true,
        },
      },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecentAlerts() {
  await requireRole(["SYSTEM_OWNER"]);
  const alerts = await prisma.systemAlert.findMany({
    take: 20,
    orderBy: { timestamp: "desc" },
    include: { company: true },
  });
  return alerts;
}

export async function getTopUsage() {
  await requireRole(["SYSTEM_OWNER"]);
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  const usage = await prisma.usageCounter.findMany({
    where: { period },
    orderBy: { value: "desc" },
    take: 10,
    include: { company: true },
  });
  return usage;
}

export async function getOutstandingPayments() {
  await requireRole(["SYSTEM_OWNER"]);
  return await prisma.payment.findMany({
    where: { status: { in: ["PENDING", "FAILED"] } },
    include: { company: true },
    take: 10,
    orderBy: { createdAt: "desc" },
  });
}

export async function getCompaniesInGrace() {
  await requireRole(["SYSTEM_OWNER"]);
  return await prisma.company.findMany({
    where: { gracePeriodEndsAt: { not: null } },
    select: {
      id: true,
      name: true,
      slug: true,
      gracePeriodEndsAt: true,
      status: true,
    },
    orderBy: { gracePeriodEndsAt: "asc" },
  });
}

export async function getPlanSuggestions() {
  const session = await getSession();
  if (!session || !isSystemOwner(session)) return [];

  // Mock suggestions for now since we don't have a PlanSuggestion model yet
  // In a real app, you'd fetch this from a table or calculate it on the fly
  return [
    {
      id: 1,
      company: { slug: "acme-corp" },
      details: "Upgrade to Enterprise (Usage > 90%)",
      type: "UPGRADE",
    },
    {
      id: 2,
      company: { slug: "beta-ind" },
      details: "Downgrade to Starter (Low Usage)",
      type: "DOWNGRADE",
    },
  ];
}

export async function broadcastSystemMessage(message: string) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    const key = "GLOBAL_SYSTEM_MESSAGE";
    const existing = await prisma.systemPolicy.findFirst({
      where: { key, active: true },
    });

    if (existing) {
      await prisma.systemPolicy.update({
        where: { id: existing.id },
        data: { value: message },
      });
    } else {
      await prisma.systemPolicy.create({
        data: { key, value: message, active: true },
      });
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "SYSTEM_BROADCAST",
        details: `Broadcasted system message: ${message}`,
        entity: "SystemPolicy",
        entityId: "0",
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    // 📢 Emit real-time live event to all connected SSE clients across the system
    sseEmitter.emit("broadcast", {
      type: "EVENT",
      event: "SYSTEM_BROADCAST",
      isGlobal: true,
      companyId: null,
      data: { message },
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("broadcastSystemMessage error:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to broadcast message",
    };
  }
}

export async function toggleSystemLock() {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    const key = "SYSTEM_LOCKDOWN";
    const existing = await prisma.systemPolicy.findFirst({
      where: { key },
    });

    const isCurrentlyActive = existing ? existing.active : false;
    const newActiveState = !isCurrentlyActive;

    if (existing) {
      await prisma.systemPolicy.update({
        where: { id: existing.id },
        data: { active: newActiveState },
      });
    } else {
      await prisma.systemPolicy.create({
        data: { key, value: "true", active: true },
      });
    }

    return { success: true, active: newActiveState, isLocked: newActiveState };
  } catch (error: unknown) {
    console.error("toggleSystemLock error:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to toggle system lock",
    };
  }
}
