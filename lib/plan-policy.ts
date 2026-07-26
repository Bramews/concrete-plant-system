import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";
import { getCompanyPlan } from "@/lib/getCompanyPlan";

export async function evaluatePlanChange(companyId: number) {
  const plan = await getCompanyPlan(companyId);
  if (!plan) return; // Free or custom

  const period = new Date().toISOString().slice(0, 7); // YYYY-MM

  // 1. Check Usage vs Limits (Current Month)
  const usages = await prisma.usageCounter.findMany({
    where: { companyId, period },
  });

  const suggestions: string[] = [];

  // UPGRADE LOGIC
  for (const u of usages) {
    let limit = 0;
    if (u.metric === "USERS") limit = plan.limits.maxUsers;
    else if (u.metric === "ORDERS") limit = plan.limits.maxOrders;
    else if (u.metric === "STORAGE_MB") limit = plan.limits.maxStorage;

    if (limit > 0 && u.value >= limit * 0.9) {
      suggestions.push(
        `Upgrade recommended: ${u.metric} usage (${u.value}) is near limit (${limit}).`,
      );
    }
  }

  // DOWNGRADE LOGIC (Low usage for 2 months?)
  // This is expensive to check every time, simplified for Phase 4.5
  // Just check current month: if < 20% of limit
  for (const u of usages) {
    let limit = 0;
    if (u.metric === "USERS") limit = plan.limits.maxUsers;
    else if (u.metric === "ORDERS") limit = plan.limits.maxOrders;

    if (limit > 0 && u.value < limit * 0.1) {
      suggestions.push(
        `Downgrade possible: ${u.metric} usage (${u.value}) is very low (<10%).`,
      );
    }
  }

  if (suggestions.length > 0) {
    await logEvent({
      action: "PLAN_SUGGESTION",
      entity: "Company",
      entityId: companyId,
      details: suggestions.join(" | "),
    });
  }
}
