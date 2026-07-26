import { prisma } from "@/lib/prisma";

export const USAGE_METRICS = {
  USERS: "USERS",
  STORAGE: "STORAGE_MB",
  ORDERS: "ORDERS",
  PROJECTS: "PROJECTS",
} as const;

export async function trackUsage(
  companyId: number,
  metric: string,
  delta: number = 1,
  source: string = "API",
) {
  const date = new Date();
  const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  await prisma.usageEvent.create({
    data: {
      companyId,
      metric,
      delta,
      source,
    },
  });

  // 2. Update Counter
  const counter = await prisma.usageCounter.upsert({
    where: {
      companyId_metric_period: {
        companyId,
        metric,
        period,
      },
    },
    update: {
      value: { increment: delta },
    },
    create: {
      companyId,
      metric,
      period,
      value: delta,
    },
  });

  // 3. Check Limits (Optional: could trigger alert)
  await checkLimit(companyId, metric, counter.value);
}

export async function checkLimit(
  companyId: number,
  metric: string,
  currentValue: number,
) {
  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
  });

  if (!subscription) return; // or default limits?

  let limit = Infinity;

  // Assuming plan holds string, we fetch actual plan limit from db or config
  // For now, let's just use hardcoded plan defaults or fetch from DB
  const planData = await prisma.plan.findUnique({
    where: { id: subscription.planId },
  });
  if (metric === USAGE_METRICS.USERS) limit = planData?.maxUsers || Infinity;
  // ... map other limits

  if (currentValue > limit) {
    // Trigger Alert / Block
    console.warn(
      `Limit exceeded for company ${companyId}: ${metric} (${currentValue}/${limit})`,
    );

    // Log system alert
    await prisma.systemAlert.create({
      data: {
        category: "USAGE_ALERT",
        severity: "WARNING",
        message: `Limit exceeded: ${metric}`,
        companyId,
        metric,
        isRiskFlag: true,
      },
    });
  }
}
export async function incrementUsage(
  companyId: number,
  metric: string,
  delta: number = 1,
  source: string = "API",
) {
  return trackUsage(companyId, metric, delta, source);
}
