import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";
import { getSystemSetting } from "@/lib/system-settings";

/**
 * Evaluate Grace Period Policy
 * Rule: Limits Exceeded (CRITICAL Alert) -> Start 7 Day Grace (if not active).
 */
export async function evaluateGrace(companyId: number) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { gracePeriodEndsAt: true, status: true },
  });

  if (!company || company.status === "SUSPENDED") return;

  // Check if grace active
  const now = new Date();
  if (company.gracePeriodEndsAt && company.gracePeriodEndsAt > now) {
    // Grace already active, do nothing
    return;
  }

  // Determine if we should start grace
  // (Logic: If we are here, it means we hit a CRITICAL verification somewhere, typically called by Alerts)

  // Start Grace (Dynamic)
  const graceDays = await getSystemSetting("GRACE_PERIOD_DAYS", 7);
  const graceEnd = new Date();
  graceEnd.setDate(graceEnd.getDate() + graceDays);

  await prisma.company.update({
    where: { id: companyId },
    data: { gracePeriodEndsAt: graceEnd },
  });

  await logEvent({
    action: "GRACE_STARTED",
    entity: "Company",
    entityId: companyId,
    details: `Grace period started until ${graceEnd.toISOString()} due to usage limits.`,
  });
}

/**
 * Check if Grace Period Expired -> Suspend
 */
export async function checkGraceExpiration(companyId: number) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { gracePeriodEndsAt: true, status: true },
  });

  if (company?.status === "SUSPENDED") return;

  if (company?.gracePeriodEndsAt && company.gracePeriodEndsAt < new Date()) {
    // Grace Expired! Suspend!
    await prisma.company.update({
      where: { id: companyId },
      data: {
        status: "SUSPENDED",
        suspensionLevel: "FULL_SUSPENSION",
        gracePeriodEndsAt: null, // Reset
      },
    });

    await logEvent({
      action: "GRACE_EXPIRED",
      entity: "Company",
      entityId: companyId,
      details: `Grace period expired. Company suspended automatically.`,
    });
  }
}
