"use server";
import { getSession } from "@/lib/auth";
import { validateTenantIsolation } from "@/lib/db-guard";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

export async function getLabStandards() {
  return await prisma.labStandard.findMany({
    orderBy: { code: "asc" },
    include: { testMethods: true },
  });
}

export async function getTestMethods() {
  const methods = await prisma.testMethod.findMany({
    include: { labStandard: true },
  });
  return methods.map((m) => ({
    ...m,
    standard: m.labStandard,
  }));
}

export async function getLabPreferences(companyId: number) {
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

  const setting = await prisma.companySetting.findUnique({
    where: {
      companyId_key: {
        companyId,
        key: "LAB_PREFERRED_STANDARDS",
      },
    },
  });

  if (!setting) return {};

  try {
    return JSON.parse(setting.value);
  } catch (e) {
    return {};
  }
}

export async function saveLabPreference(
  testCode: string,
  standardCode: string,
) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  // 1. Get existing preferences
  const existing = await getLabPreferences(user.companyId);

  // 2. Update preference
  const updated = { ...existing, [testCode]: standardCode };

  // 3. Save to CompanySettings
  await prisma.companySetting.upsert({
    where: {
      companyId_key: {
        companyId: user.companyId,
        key: "LAB_PREFERRED_STANDARDS",
      },
    },
    update: {
      value: JSON.stringify(updated),
    },
    create: {
      companyId: user.companyId,
      key: "LAB_PREFERRED_STANDARDS",
      value: JSON.stringify(updated),
    },
  });

  revalidatePath("/system/lab/standards");
  return { success: true };
}

/**
 * Assigns a standard to a specific Order or Context (for history tracking)
 */
export async function assignStandardToOrder(
  orderId: number,
  standardCode: string,
) {
  const standard = await prisma.labStandard.findUnique({
    where: { code: standardCode },
  });

  if (!standard) throw new Error("Standard not found");

  await prisma.order.update({
    where: { id: orderId },
    data: {
      labStandardId: standard.id,
    },
  });

  revalidatePath("/system/lab/orders");
}
