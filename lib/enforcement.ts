import { prisma } from "@/lib/prisma";
import { getCompanyPlan } from "@/lib/getCompanyPlan";
import { logEvent } from "@/lib/logger";
import { USAGE_METRICS } from "@/lib/usage";
import { emitAlert } from "@/lib/alerts";
import { evaluateAutoSuspend } from "@/lib/policies";
import { evaluateGrace, checkGraceExpiration } from "@/lib/grace";
import { getSystemSetting } from "@/lib/system-settings";

// Decision Result
export type EnforcementResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: string;
      action: "BLOCK" | "READ_ONLY" | "SUSPEND";
    };

/**
 * Get current usage correctly based on metric type.
 * - USERS, PROJECTS: Absolute count from DB (Active items).
 * - ORDERS, STORAGE: Monthly/UsageCounter based.
 */
async function getUsage(companyId: number, metric: string): Promise<number> {
  if (metric === USAGE_METRICS.USERS) {
    // Count active non-deleted users
    // Assuming status != 'DISABLED' or count all?
    // Usually plans limit "Active" seats.
    // For safety, let's count all non-deleted (if soft delete exists) or just count all.
    // The previous implementation of Delete User only deletes if safe.
    return await prisma.user.count({
      where: { companyId },
    });
  }

  if (metric === USAGE_METRICS.PROJECTS) {
    return await prisma.project.count({
      where: { companyId },
    });
  }

  // Monthly Metrics logic
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  const counter = await prisma.usageCounter.findUnique({
    where: {
      companyId_metric_period: {
        companyId,
        metric,
        period,
      },
    },
  });

  return counter?.value || 0;
}

/**
 * Central Enforcement Logic
 * 1. Get Plan
 * 2. Get Usage
 * 3. Compare -> Decision
 */
export async function enforceLimit(
  companyId: number,
  metric: "USERS" | "ORDERS" | "STORAGE_MB" | "PROJECTS",
  delta: number = 1,
): Promise<EnforcementResult> {
  const planDetails = await getCompanyPlan(companyId);

  // 0. Check Grace Expiration (Lazy Policy Enforcement)
  await checkGraceExpiration(companyId);

  // If no plan, assume blocked or default restricted?
  // Current logic: If check fails, allow? Or strict block?
  // We'll strict block if no plan found (shouldn't happen for active companies).
  if (!planDetails) {
    return {
      allowed: false,
      reason: "No active plan found for this company.",
      action: "BLOCK",
    };
  }

  const currentUsage = await getUsage(companyId, metric);
  const nextUsage = currentUsage + delta;

  let limit = 0;
  if (metric === "USERS") limit = planDetails.limits.maxUsers;
  else if (metric === "ORDERS") limit = planDetails.limits.maxOrders;
  else if (metric === "PROJECTS") limit = planDetails.limits.maxProjects;
  else if (metric === "STORAGE_MB") limit = planDetails.limits.maxStorage;

  if (nextUsage > limit) {
    // Determine Action based on Matrix
    let action: "BLOCK" | "READ_ONLY" | "SUSPEND" = "BLOCK";
    if (metric === "ORDERS" || metric === "STORAGE_MB") {
      action = "READ_ONLY";
    }

    // 1. Alert CRITICAL
    await emitAlert({
      companyId,
      metric,
      severity: "CRITICAL",
      message: `Limit exceeded for ${metric}. Limit: ${limit}, Current: ${currentUsage}, Attempted: ${delta}.`,
      metadata: { limit, currentUsage, delta, action },
    });

    // 2. Evaluate Grace Period (7 Days)
    await evaluateGrace(companyId);

    // 3. Evaluate Auto-Suspend Policy
    await evaluateAutoSuspend(companyId, metric);

    // 3. Log Audit
    await logEvent({
      action: "LIMIT_EXCEEDED",
      entity: "UsageEnforcement",
      entityId: companyId,
      details: `Metric: ${metric}, Limit: ${limit}, Current: ${currentUsage}, Attempted: ${delta}. Result: ${action}`,
    });

    return {
      allowed: false,
      reason: `Plan limit reached for ${metric}. Limit: ${limit}.`,
      action,
    };
  }

  // 80% Warning Threshold (Dynamic)
  const warnPercent = await getSystemSetting("ALERT_WARN_PERCENT", 80);
  const threshold = limit * (warnPercent / 100);

  if (nextUsage >= threshold) {
    await emitAlert({
      companyId,
      metric,
      severity: "WARN",
      message: `Approaching limit for ${metric} (${Math.round((nextUsage / limit) * 100)}%).`,
      metadata: { limit, nextUsage, threshold },
    });
  }

  return { allowed: true };
}
