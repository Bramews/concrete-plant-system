"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, getSession } from "@/lib/auth";
import { logEvent } from "@/lib/logger";

export async function addOperationalExpense(formData: FormData) {
  await requireRole(["ACCOUNTANT", "MANAGER", "SYSTEM_OWNER"]);

  const session = await getSession();
  const companyId = session?.companyId || 1;

  const type = formData.get("type") as string; // FUEL, GAS, MAINTENANCE
  const amount = parseFloat(formData.get("amount") as string);
  const details = formData.get("details") as string;

  const expense = await prisma.operationalExpense.create({
    data: {
      companyId,
      category: type,
      amount,
      details,
    },
  });

  await logEvent({
    action: "EXPENSE_RECORD",
    entity: "OperationalExpense",
    entityId: String(expense.id),
    details: `Recorded ${type} expense: $${amount}`,
  });

  revalidatePath("/admin/accounting");
}
