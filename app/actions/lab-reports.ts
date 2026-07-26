"use server";
import { getSession } from "@/lib/auth";
import { validateTenantIsolation } from "@/lib/db-guard";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getReportConfig(companyId: number) {
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

  try {
    const config = await prisma.labReportConfig.findUnique({
      where: { companyId },
    });
    return { success: true, data: config };
  } catch (error) {
    console.error("Error fetching report config:", error);
    return { success: false, error: "Failed to fetch configuration" };
  }
}

export async function updateReportConfig(companyId: number, data: any) {
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

  try {
    const config = await prisma.labReportConfig.upsert({
      where: { companyId },
      update: data,
      create: {
        companyId,
        ...data,
      },
    });
    revalidatePath("/system/lab/reports/settings");
    return { success: true, data: config };
  } catch (error) {
    console.error("Error updating report config:", error);
    return { success: false, error: "Failed to update configuration" };
  }
}

export async function getTestCertificateData(testId: string) {
  try {
    const test = await prisma.qualityTest.findUnique({
      where: { id: testId },
      include: {
        testMethod: {
          include: {
            labStandard: true,
          },
        },
        testedBy: true,
        approvedBy: true,
        order: {
          include: {
            customer: true,
            project: true,
            mixDesign: true,
          },
        },
        material: true,
      },
    });

    if (!test) {
      return { success: false, error: "Test not found" };
    }

    // Identify which company context this test belongs to.
    // For now, assuming single tenant or test linked to order->company
    // But Order doesn't strictly have companyId access path easily without more includes or assuming context.
    // However, we added LabReportConfig with companyId.
    // Let's assume the default company ID 1 for now or derive from order/material relation if available.

    // In a real multi-tenant app, we would check test.order.companyId or test.material.companyId
    // Based on schema: Order -> has no direct companyId? let's check.
    // Order model: companyId Int @relation... YES it does.

    // Strict Multi-tenancy: Do not assume ID 1.
    let companyId: number | null = null;
    if (test.order?.companyId) companyId = test.order.companyId;
    else if (test.material?.companyId) companyId = test.material.companyId;

    if (!companyId) {
      throw new Error(
        "Could not determine company context for test certificate",
      );
    }

    const config = await prisma.labReportConfig.findUnique({
      where: { companyId },
    });

    return { success: true, data: { test, config } };
  } catch (error) {
    console.error("Error fetching certificate data:", error);
    return { success: false, error: "Failed to generate certificate data" };
  }
}

export async function getCubeReportData(testId: number) {
  try {
    const test = await prisma.cubeTest.findUnique({
      where: { id: testId },
      include: {
        approvedBy: true,
        order: {
          include: {
            mixDesign: true,
            project: true,
            customer: true,
          },
        },
      },
    });

    if (!test) {
      return { success: false, error: "Test not found" };
    }

    let companyId = test.companyId;
    if (!companyId && test.order?.companyId) {
      companyId = test.order.companyId;
    }

    if (!companyId) {
      return { success: false, error: "Could not determine company context" };
    }

    const config = await prisma.labReportConfig.findUnique({
      where: { companyId },
    });

    return { success: true, data: { test, config } };
  } catch (error) {
    console.error("Error fetching cube report data:", error);
    return { success: false, error: "Failed to fetch report data" };
  }
}
