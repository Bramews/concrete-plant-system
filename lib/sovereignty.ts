import { prisma } from "./prisma";
import { getSession } from "./auth";

// Role is now a model, not an enum
const SYSTEM_OWNER = "SYSTEM_OWNER";

export function isSystemOwner(session: { role: string } | null | undefined) {
  return session?.role === SYSTEM_OWNER;
}

/**
 * Change Management Engine
 * Handles Change Requests, Versioning, and Rollbacks.
 */

export async function createChangeRequest(data: {
  title: string;
  description?: string;
  type: string;
  newData: Record<string, unknown>;
  originalData?: Record<string, unknown>;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return await prisma.changeRequest.create({
    data: {
      id: `cr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: data.title,
      description: data.description,
      type: data.type,
      requesterId: session.userId,
      originalData: data.originalData
        ? JSON.stringify(data.originalData)
        : null,
      newData: JSON.stringify(data.newData),
      status: "PENDING",
    },
  });
}

export async function approveChangeRequest(requestId: string, reason?: string) {
  const session = await getSession();
  if (session?.role !== SYSTEM_OWNER) {
    throw new Error("Only System Owner can approve change requests.");
  }

  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("Change Request not found.");

  await prisma.changeRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      approverId: session.userId,
      appliedAt: new Date(),
    },
  });

  // Log the sovereign decision
  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      role: SYSTEM_OWNER,
      action: `APPROVE_CHANGE:${request.type}`,
      entity: "CHANGE_MANAGEMENT",
      entityId: "0",
      details: JSON.stringify({ requestId, reason }),
      reason: reason || "Sovereign approval",
    },
  });

  return { success: true };
}

export async function getRiskFlags() {
  const flags = await prisma.systemAlert.findMany({
    where: { isRiskFlag: true, resolved: false },
    orderBy: { timestamp: "desc" },
  });

  return flags;
}

export async function getComplianceViolations() {
  return await prisma.complianceViolation.findMany({
    where: { status: "OPEN" },
    orderBy: { timestamp: "desc" },
  });
}

export enum DecisionCategory {
  SEC = "SECURITY",
  FIN = "FINANCIAL",
  OPS = "OPERATIONAL",
  GOV = "GOVERNANCE",
  POLICY = "POLICY",
}

export interface DecisionItem {
  id: number;
  type: string;
  category: DecisionCategory;
  severity: "INFO" | "WARNING" | "CRITICAL";
  context: string;
  risk: string;
  impact: string;
  timeToRisk?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export async function getGlobalSystemMode() {
  try {
    const policy = prisma.systemPolicy;
    if (!policy) return { mode: "NORMAL", confidence: 100 };

    const mode = await policy.findFirst({
      where: { key: "EMERGENCY_MODE_ACTIVE", active: true },
    });

    return {
      mode: mode?.value === "TRUE" ? "EMERGENCY" : "NORMAL",
      confidence: 100,
    };
  } catch (error) {
    console.warn(
      "Sovereignty Layer: Failing back to NORMAL mode (DB error):",
      error,
    );
    return {
      mode: "NORMAL",
      confidence: 0, // Indicate low confidence due to DB failure
    };
  }
}

export async function getDecisionQueue(
  status: "PENDING" | "IGNORED" | "RESOLVED" = "PENDING",
): Promise<DecisionItem[]> {
  // BillingEvent table may not exist yet - return empty array
  try {
    const billingEvents =
      (await prisma.billingEvent.findMany({
        where: { status },
        include: { subscription: { include: { company: true, plan: true } } },
        orderBy: { timestamp: "desc" },
      })) || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return billingEvents.map((event: any) => {
      const ageInDays =
        (Date.now() - new Date(event.timestamp).getTime()) /
        (1000 * 60 * 60 * 24);

      return {
        id: event.id,
        type: "BILLING",
        category: DecisionCategory.FIN,
        severity: event.eventType === "PAYMENT_FAILED" ? "WARNING" : "INFO",
        context: `Billing for ${event.subscription?.company?.name || "Unknown"}`,
        risk:
          event.eventType === "PAYMENT_FAILED"
            ? "Revenue loss risk."
            : "Admin overhead.",
        impact: "Service lock pending.",
        timeToRisk:
          event.eventType === "PAYMENT_FAILED"
            ? `${Math.max(0, Math.floor(7 - ageInDays))} days until suspension`
            : undefined,
        timestamp: event.timestamp,
        metadata: event.details ? JSON.parse(event.details) : {},
      };
    });
  } catch {
    return [];
  }
}

export async function getGovernanceTimeline(companyId: number) {
  const auditLogs = await prisma.auditLog.findMany({
    where: { user: { companyId } },
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return auditLogs;
}

export async function getPowerMonitor() {
  try {
    // Mock power monitor data or fetch from system metrics if available

    const metrics = await prisma.systemMetric.findMany({
      where: { metricName: { in: ["CPU_USAGE", "MEMORY_USAGE"] } },
      orderBy: { timestamp: "desc" },
      take: 2,
    });

    const cpu = metrics.find((m) => m.metricName === "CPU_USAGE")?.value || 12;
    const memory =
      metrics.find((m) => m.metricName === "MEMORY_USAGE")?.value || 45;

    return {
      cpu,
      memory,
      uptime: "24d 12h 4m",
      status: "OPTIMAL",
    };
  } catch (error) {
    console.warn(
      "Sovereignty Layer: Failing back to default power metrics:",
      error,
    );
    return {
      cpu: 0,
      memory: 0,
      uptime: "Unknown",
      status: "DEGRADED",
    };
  }
}
