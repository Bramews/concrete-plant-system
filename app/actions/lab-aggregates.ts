"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { enforceSubscription } from "@/lib/subscriptions";

export async function getMaterialsForTesting() {
  try {
    // Material is global for now (Per Audit Phase A plan)
    const materials = await prisma.material.findMany({
      where: { status: "ACTIVE" },
      include: {
        sieveAnalyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });
    return { success: true, data: materials };
  } catch (error) {
    console.error("Error fetching materials:", error);
    return { success: false, error: "Failed to fetch materials" };
  }
}

export async function submitAggregateTest(
  materialId: number,
  methodId: string,
  value: number,
  readings: any, // JSON object for raw data (wet weight, dry weight etc)
  notes?: string,
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    if (user.companyId) {
      await enforceSubscription(user.companyId);
    }

    // 1. Get Method Limits
    const method = await prisma.testMethod.findUnique({
      where: { id: methodId },
    });

    if (!method) throw new Error("Method not found");

    // 2. Evaluate Result
    let result = "PASS";
    if (method.rejectMin !== null && value < method.rejectMin) result = "FAIL";
    else if (method.rejectMax !== null && value > method.rejectMax)
      result = "FAIL";
    else if (method.warningMin !== null && value < method.warningMin)
      result = "WARNING";
    else if (method.warningMax !== null && value > method.warningMax)
      result = "WARNING";

    // 3. Save Test
    await prisma.qualityTest.create({
      data: {
        id: `qt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        materialId,
        methodId,
        testedById: user.id,
        value,
        result,
        readings: JSON.stringify(readings),
        notes,
      },
    });

    revalidatePath("/system/lab/aggregates");
    return { success: true, result };
  } catch (error) {
    console.error("Error submitting test:", error);
    return { success: false, error: "Failed to submit test" };
  }
}
