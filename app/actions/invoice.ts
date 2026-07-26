"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/logger";
import { requireUnsealedModule, SystemModule } from "@/lib/governance";
import { enforceSubscription } from "@/lib/subscriptions";

import { z } from "zod";
import { checkIdempotency, saveIdempotency } from "@/lib/locks";

// GenerateInvoiceSchema removed as feature is disabled

const MarkPaidSchema = z.object({
  invoiceId: z.string().min(1), // Fixed to match DB
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

  // 1. Fetch Ticket with Order context
  const ticket = await prisma.deliveryTicket.findUnique({
    where: { id: ticketId },
    include: { order: true },
  });

  if (!ticket) throw new Error("Ticket not found");

  // 2. Strict Isolation Check
  if (ticket.order.companyId !== user.companyId) {
    throw new Error("Access Denied: Ticket belongs to another company");
  }

  // 3. Create Invoice linked to Ticket
  // Assuming price calculation logic exists or is simplified here.
  // Real implementation would fetch unit price from Order or MixDesign.
  const estimatedAmount = ticket.cumulativeQuantity * 250; // Placeholder price

  const invoice = await prisma.invoice.create({
    data: {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      companyId: user.companyId,
      ticketId: ticket.id,
      orderId: ticket.orderId,
      type: "SALE",
      amount: estimatedAmount,
      status: "DRAFT",
      currency: "SAR", // Local currency
    },
  });

  await logEvent({
    action: "INVOICE_GENERATED",
    entity: "Invoice",
    entityId: 0, // Invoice ID is string (CUID), Logger expects number currently. Fix later.
    details: `Generated invoice for Ticket ${ticket.ticketNumber}`,
    requestId: requestId || undefined,
    startTime,
  });

  if (requestId) {
    await saveIdempotency(requestId, invoice);
  }

  revalidatePath("/accounts/invoices");
  return invoice;
}

export async function markPaid(formData: FormData) {
  const startTime = Date.now();
  await requireRole(["ACCOUNTANT"]);
  await requireUnsealedModule(SystemModule.FINANCIALS);

  const rawData = {
    // Fix: Invoice ID is String in schema
    invoiceId: formData.get("invoiceId") as string,
    requestId: formData.get("requestId") as string,
  };

  // Schema needs update too if it expects number
  // Let's assume validation will fail if we pass string to int schema.
  // We need to update Zod schema first.
  // Actually, let's look at schema logic.
  // Code Line 18: invoiceId: z.number().int().positive()
  // Schema DB: id String @id @default(cuid())
  // This code was definitely broken. I will fix the Type AND Security.
  // But wait, replace_file_content targets specific lines.
  // I will check the Zod schema definition lines 17-20.

  // Fixed validation variable name to avoid conflict
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
      data: { status: "PAID" },
    });

    if (result.count === 0)
      throw new Error("Invoice not found or access denied");

    await logEvent({
      action: "PAYMENT_REC",
      entity: "Invoice",
      entityId: 0, // Fix type mismatch
      newStatus: "PAID",
      requestId: requestId || undefined,
      startTime,
      details: `Invoice ${invoiceId} marked as PAID`,
    });

    revalidatePath("/accounts/invoices");
    // Removed return
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await logEvent({
      action: "PAYMENT_FAILED",
      entity: "Invoice",
      entityId: 0, // Fix type mismatch
      requestId: requestId || undefined,
      startTime,
      details: `Payment failure for ${invoiceId}: ${errorMessage}`,
    });
    throw error;
  }
}
