"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/logger";
import { requireUnsealedModule, SystemModule } from "@/lib/governance";
import { enforceSubscription } from "@/lib/subscriptions";
import { getCompanyFinancialSettings } from "@/app/actions/finance";
import { z } from "zod";
import { checkIdempotency, saveIdempotency } from "@/lib/locks";

const MarkPaidSchema = z.object({
  invoiceId: z.string().min(1),
  requestId: z.string().min(1).optional(),
});

export async function generateInvoiceFromTicket(formData: FormData) {
  const startTime = Date.now();
  await requireRole(["ACCOUNTANT", "MANAGER"]);
  await requireUnsealedModule(SystemModule.FINANCIALS);

  const ticketIdStr = formData.get("ticketId");
  if (!ticketIdStr || typeof ticketIdStr !== "string")
    throw new Error("Invalid Ticket ID");
  const ticketId = parseInt(ticketIdStr);
  const requestId = formData.get("requestId") as string | null;

  if (requestId) {
    const existing = await checkIdempotency(requestId);
    if (existing) return existing;
  }

  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  await enforceSubscription(user.companyId);

  // 1. Fetch Ticket with Order and MixDesign context
  const ticket = await prisma.deliveryTicket.findUnique({
    where: { id: ticketId },
    include: {
      order: {
        include: {
          mixDesign: true,
          customer: true,
        },
      },
    },
  });

  if (!ticket) throw new Error("Ticket not found");

  // 2. Strict Isolation Check
  if (ticket.order.companyId !== user.companyId) {
    throw new Error("Access Denied: Ticket belongs to another company");
  }

  // 3. Dynamic Price Calculation
  const unitPrice =
    ticket.order.mixDesign?.concretePrice && ticket.order.mixDesign.concretePrice > 0
      ? ticket.order.mixDesign.concretePrice
      : 250;

  const quantity =
    ticket.cumulativeQuantity && ticket.cumulativeQuantity > 0
      ? ticket.cumulativeQuantity
      : 1;
  const rawSubtotal = quantity * unitPrice;

  // 4. Read Company Financial Settings
  const settings = await getCompanyFinancialSettings(user.companyId);
  const taxAmount = (rawSubtotal * settings.taxRate) / 100;
  const totalAmount = rawSubtotal + taxAmount;

  const invoice = await prisma.invoice.create({
    data: {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      companyId: user.companyId,
      ticketId: ticket.id,
      orderId: ticket.orderId,
      type: "SALE",
      amount: Math.round(totalAmount),
      status: "DRAFT",
      currency: settings.currency,
    },
  });

  await logEvent({
    action: "INVOICE_GENERATED",
    entity: "Invoice",
    entityId: 0,
    details: `Generated invoice for Ticket ${ticket.ticketNumber} (${settings.currency} ${totalAmount})`,
    requestId: requestId || undefined,
    startTime,
  });

  if (requestId) {
    await saveIdempotency(requestId, invoice);
  }

  revalidatePath("/system/accountant/invoices");
  revalidatePath("/accounts/invoices");
  return invoice;
}

export async function markPaid(formData: FormData) {
  const startTime = Date.now();
  await requireRole(["ACCOUNTANT", "MANAGER"]);
  await requireUnsealedModule(SystemModule.FINANCIALS);

  const rawData = {
    invoiceId: formData.get("invoiceId") as string,
    requestId: formData.get("requestId") as string,
  };

  const validation = MarkPaidSchema.safeParse(rawData);
  if (!validation.success) throw new Error("VALIDATION_ERROR");
  const { invoiceId, requestId } = validation.data;

  try {
    const user = await getCurrentUser();
    if (!user?.companyId) throw new Error("Unauthorized");

    await enforceSubscription(user.companyId);

    const result = await prisma.invoice.updateMany({
      where: {
        id: invoiceId,
        companyId: user.companyId,
      },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    if (result.count === 0)
      throw new Error("Invoice not found or access denied");

    await logEvent({
      action: "PAYMENT_REC",
      entity: "Invoice",
      entityId: 0,
      newStatus: "PAID",
      requestId: requestId || undefined,
      startTime,
      details: `Invoice ${invoiceId} marked as PAID`,
    });

    revalidatePath("/system/accountant/invoices");
    revalidatePath(`/system/accountant/invoices/${invoiceId}`);
    revalidatePath("/system/accountant/reports");
    revalidatePath("/accounts/invoices");
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await logEvent({
      action: "PAYMENT_FAILED",
      entity: "Invoice",
      entityId: 0,
      requestId: requestId || undefined,
      startTime,
      details: `Payment failure for ${invoiceId}: ${errorMessage}`,
    });
    throw error;
  }
}

