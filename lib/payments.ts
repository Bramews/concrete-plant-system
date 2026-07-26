import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";

export type PaymentStatus = "PAID" | "FAILED" | "PENDING";

export async function recordPayment(params: {
  companyId: number;
  amount: number;
  currency: string;
  period: string; // YYYY-MM
  status: PaymentStatus;
  provider?: string;
  transactionId?: string;
}) {
  // 1. Create Payment Record
  const payment = await prisma.payment.create({
    data: {
      companyId: params.companyId,
      amount: params.amount,
      currency: params.currency,
      status: params.status,
      period: params.period,
      provider: params.provider || "MANUAL",
      transactionId: params.transactionId || `TXN_${Date.now()}`,
    },
  });

  // 2. If PAID, Add to LedgerEntry (Official Ledger)
  if (params.status === "PAID") {
    await prisma.ledgerEntry.create({
      data: {
        companyId: params.companyId,
        type: "CREDIT",
        amount: params.amount,
        description: `Payment ${payment.id} (${params.period})`,
        date: new Date(),
      },
    });

    // 3. Log Audit
    await logEvent({
      action: "PAYMENT_RECEIVED",
      entity: "Payment",
      entityId: payment.id,
      details: `Received ${params.amount} ${params.currency} for ${params.period}.`,
    });
  } else if (params.status === "FAILED") {
    await logEvent({
      action: "PAYMENT_FAILED",
      entity: "Payment",
      entityId: payment.id,
      details: `Payment failed for ${params.period}.`,
    });
  }

  return payment;
}
