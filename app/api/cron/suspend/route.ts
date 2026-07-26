import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function checkAndSuspendAccounts() {
  const now = new Date();

  // 1. Find expired subscriptions that are still active
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      currentPeriodEnd: { lt: now }, // Past due
    },
    include: { company: true },
  });

  for (const sub of expiredSubs) {
    // Log activity
    await prisma.companyActivityLog.create({
      data: {
        id: randomUUID(),
        companyId: sub.companyId,
        type: "SUBSCRIPTION_EXPIRED",
        severity: "WARNING",
        message:
          "Subscription period ended. Entering grace period or suspending.",
      },
    });

    // Update status to PAST_DUE
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "PAST_DUE" },
    });

    // Trigger email notification (Mock)
    console.log(`Sending invoice failed/expired email to ${sub.company.name}`);
  }

  // 2. Find Past Due subscriptions that exceeded grace period (e.g. 7 days)
  const gracePeriodLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const suspendableSubs = await prisma.subscription.findMany({
    where: {
      status: "PAST_DUE",
      currentPeriodEnd: { lt: gracePeriodLimit },
    },
    include: { company: true },
  });

  for (const sub of suspendableSubs) {
    // Suspend Company
    await prisma.company.update({
      where: { id: sub.companyId },
      data: {
        status: "SUSPENDED",
        suspensionLevel: "FULL_SUSPENSION",
      },
    });

    await prisma.companyActivityLog.create({
      data: {
        id: randomUUID(),
        companyId: sub.companyId,
        type: "COMPANY_SUSPENDED",
        severity: "CRITICAL",
        message: "Payment grace period exceeded. Service suspended.",
      },
    });
  }

  return {
    expired: expiredSubs.length,
    suspended: suspendableSubs.length,
  };
}

// Ensure this is a valid Next.js route handler
export async function GET() {
  // Secure this endpoint with a secret key in real usage
  const result = await checkAndSuspendAccounts();
  return NextResponse.json(result);
}
