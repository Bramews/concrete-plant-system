"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

export async function getLabStandards() {
  try {
    const standards = await prisma.labStandard.findMany({
      include: {
        testMethods: true,
      },
      orderBy: {
        code: "asc",
      },
    });
    return { success: true, data: standards };
  } catch (error) {
    console.error("Error fetching standards:", error);
    return { success: false, error: "Failed to fetch standards" };
  }
}

async function ensureSystemOwner() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const isSystemOwner =
    (user as any).role === "SYSTEM_OWNER" ||
    ((user as any).role as any)?.name === "SYSTEM_OWNER";

  if (!isSystemOwner) {
    throw new Error("Only System Owner can modify standards");
  }
}

export async function toggleStandardStatus(id: string, isActive: boolean) {
  try {
    await ensureSystemOwner();
    await prisma.labStandard.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/system/lab/standards");
    return { success: true };
  } catch (error) {
    console.error("Error toggling standard:", error);
    return { success: false, error: "Failed to update standard status" };
  }
}

export async function updateTestMethodLimits(
  methodId: string,
  limits: {
    warningMin?: number;
    warningMax?: number;
    rejectMin?: number;
    rejectMax?: number;
  },
) {
  try {
    await ensureSystemOwner();
    await prisma.testMethod.update({
      where: { id: methodId },
      data: limits,
    });
    revalidatePath("/system/lab/standards");
    return { success: true };
  } catch (error) {
    console.error("Error updating test method:", error);
    return { success: false, error: "Failed to update test limits" };
  }
}
