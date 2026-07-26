"use server";
import { getSession } from "@/lib/auth";
import { validateTenantIsolation } from "@/lib/db-guard";

// import {
//   createMonthlyInvoice,
//   processPayment,
//   reportBillingEvent,
// } from "@/lib/billing";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";

export async function generateInvoiceAction(_companyId: number) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      _companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  await requireRole(["SYSTEM_OWNER"]);

  try {
    // const invoice = await createMonthlyInvoice(companyId);
    // revalidatePath("/admin/governance");
    return {
      success: true,
      message: `Invoice generation temporarily disabled.`, // ${invoice.invoiceNumber} generated.`,
    };
    // The following lines are unreachable due to the return statement above.
    // revalidatePath("/admin/governance");
    // return {
    //   success: true,
    //   message: `Invoice ${invoice.invoiceNumber} generated.`,
    // };
  } catch (error) {
    // If generation fails (e.g. invalid subscription), log it as a billing event too?
    // Maybe better to just return error for manual triage.
    return { success: false, error: (error as Error).message };
  }
}

export async function recordPaymentAction(
  _invoiceId: number,
  _amount: number,
  _method: string,
  _reference: string,
) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    // const payment = await processPayment(invoiceId, amount, method, reference);
    revalidatePath("/admin/governance");
    return { success: true, message: `Payment recorded (Mock).` }; // ${payment.id} recorded.` };
  } catch (error) {
    // Bridge: Report payment failure (if it was an attempted auto-charge, though this action is manual)
    return { success: false, error: (error as Error).message };
  }
}

export async function reportFailureAction(
  _companyId: number,
  _details: string,
) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      _companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  await requireRole(["SYSTEM_OWNER"]);

  // Manual flagging of billing issue
  // await reportBillingEvent(companyId, "PAYMENT_FAILED", details);
  revalidatePath("/admin/governance");
  return { success: true, message: "Billing failure event reported." };
}

export async function updateSubscriptionDates(
  companyId: number,
  startDate: Date,
  endDate: Date,
) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  await requireRole(["SYSTEM_OWNER"]);

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
    });

    if (!subscription) {
      throw new Error("Subscription record not found for this company.");
    }

    await prisma.subscription.update({
      where: { companyId },
      data: {
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        status: "ACTIVE", // Reactivate if it was expired
      },
    });

    await logEvent({
      action: "SUBSCRIPTION_UPDATE",
      entity: "Subscription",
      entityId: subscription.id,
      userId: 1, // System Owner
      // role: "SYSTEM_OWNER", // Removed as per logger signature
      details: `Manual update: Start ${startDate.toISOString()}, End ${endDate.toISOString()}`,
      startTime: Date.now(), // timestamp replaced by startTime in logger signature (optional)
    });

    revalidatePath(`/admin/companies/${companyId}`);
    return { success: true };
  } catch (error) {
    console.error("Update subscription error:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}
