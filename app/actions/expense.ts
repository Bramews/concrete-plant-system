"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/logger";
import { requireUnsealedModule, SystemModule } from "@/lib/governance";

export async function addOperationalExpense(formData: FormData) {
  const startTime = Date.now();
  await requireRole(["ACCOUNTANT", "MANAGER", "SYSTEM_OWNER"]);
  await requireUnsealedModule(SystemModule.FINANCIALS);

  const user = await getCurrentUser();
  if (!user?.companyId) {
    throw new Error("Unauthorized: Active company session required");
  }

  const category = (formData.get("type") || formData.get("category") || "MISC") as string;
  const amountStr = formData.get("amount") as string;
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid expense amount");
  }

  const details = (formData.get("details") as string) || "";
  const reference = (formData.get("reference") as string) || "";

  const expense = await prisma.operationalExpense.create({
    data: {
      companyId: user.companyId,
      category,
      amount,
      details,
      reference,
      timestamp: new Date(),
    },
  });

  await logEvent({
    action: "EXPENSE_RECORD",
    entity: "OperationalExpense",
    entityId: expense.id,
    details: `تسجيل مصروف (${category}): ${amount}`,
    startTime,
  });

  revalidatePath("/system/accountant/expenses");
  revalidatePath("/system/accountant/reports");

  return expense;
}

