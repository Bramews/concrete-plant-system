import { prisma } from "@/lib/prisma";

export async function checkSubscriptionStatus(companyId: number) {
  const subscription = await prisma.subscription.findFirst({
    where: { companyId, status: "ACTIVE" },
  });

  if (!subscription) {
    return { isActive: false, isExpired: true };
  }

  // Check if expired
  if (
    subscription.currentPeriodEnd &&
    new Date() > subscription.currentPeriodEnd
  ) {
    return { isActive: false, isExpired: true };
  }

  return { isActive: true, isExpired: false };
}

export async function enforceSubscription(companyId: number) {
  const status = await checkSubscriptionStatus(companyId);
  if (status.isExpired) {
    throw new Error(
      "SUBSCRIPTION_EXPIRED: Your subscription has ended. Read-only mode active.",
    );
  }
}
