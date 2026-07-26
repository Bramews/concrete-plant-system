import { prisma } from "@/lib/prisma";
import { killCompanySessions } from "@/lib/session";
import { logEvent } from "@/lib/logger";

import { getSystemSetting } from "@/lib/system-settings";

/**
 * Evaluate if a company should be auto-suspended based on CRITICAL alerts.
 * Policy: 3 CRITICAL alerts for the same metric within 24 hours -> SUSPEND.
 */
export async function evaluateAutoSuspend(companyId: number, metric: string) {
  // 0. Check Feature Flag
  const enabled = await getSystemSetting("AUTO_SUSPEND_ENABLED", true);
  if (!enabled) return;
  // 1. Count CRITICAL alerts for this metric in last 24h
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const criticalCount = await prisma.systemAlert.count({
    where: {
      companyId,
      metric,
      severity: "CRITICAL",
      timestamp: { gte: yesterday },
    },
  });

  // If we just hit the 3rd alert (or more), trigger suspension
  // Note: This logic triggers on every critical alert after 3rd as well, ensuring suspension holds.
  if (criticalCount >= 3) {
    // Check if already suspended to avoid redundant logging/killing?
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { status: true },
    });

    if (company?.status === "SUSPENDED") {
      return; // Already suspended
    }

    console.warn(
      `[AUTO-SUSPEND] Company ${companyId} suspended due to excessive violations.`,
    );

    // 2. Suspend Company
    await prisma.company.update({
      where: { id: companyId },
      data: {
        status: "SUSPENDED",
        suspensionLevel: "FULL_SUSPENSION",
      },
    });

    // 3. Kill Sessions
    await killCompanySessions(companyId);

    // 4. Log
    await logEvent({
      action: "AUTO_SUSPEND",
      entity: "Company",
      entityId: companyId,
      details: `Auto-suspended due to ${criticalCount} CRITICAL alerts for ${metric} in 24h.`,
      newStatus: "SUSPENDED",
    });
  }
}
