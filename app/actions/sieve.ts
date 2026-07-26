"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  calculateSieveResults,
  judgeSieveAnalysis,
} from "@/lib/sieve-calculations";

export async function getSieveAnalyses(filters?: {
  materialId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    const where: any = { companyId: user.companyId };
    if (filters?.materialId) where.materialId = filters.materialId;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    const analyses = await prisma.sieveAnalysis.findMany({
      where,
      include: {
        material: true,
        approvedBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: analyses };
  } catch (error) {
    console.error("Error fetching sieve analyses:", error);
    return { success: false, error: "Failed to fetch sieve analyses" };
  }
}
export async function createSieveAnalysis(data: {
  materialId: number;
  testType?: string;
  readings: { size: number; weightRetained: number }[];
  totalWeight: number;
  moistureContent?: number;
  clayContent?: number;
  dryWeight?: number;
  washWeight?: number;
  source?: string;
  projectName?: string;
  inspectorName?: string;
  sampleDate?: Date;
  testDate?: Date;
  appliedStandardIds?: string[];
}) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");
  try {
    // 1. Fetch standards for calculation
    const standards = await prisma.sieveCategory.findMany({
      where: {
        id: { in: data.appliedStandardIds || [] },
        companyId: user.companyId,
      },
      include: {
        sieves: true,
      },
    });
    // Helper to parse sieve size to mm
    const parseSieveSizeToMm = (sizeStr: string): number => {
      const clean = sizeStr.replace(/[^0-9.]/g, "");
      const val = parseFloat(clean);
      if (isNaN(val)) return 0;
      if (
        sizeStr.toLowerCase().includes("µm") ||
        sizeStr.toLowerCase().includes("μm") ||
        sizeStr.toLowerCase().includes("um")
      ) {
        return val / 1000;
      }
      return val;
    };
    // 2. Prepare limits (merging if multiple, user logic should handle prioritization)
    const limits: Record<number, { min: number; max: number }> = {};
    standards.forEach((std) => {
      std.sieves.forEach((s) => {
        const numericSize = parseSieveSizeToMm(s.size);
        limits[numericSize] = { min: s.minLimit ?? 0, max: s.maxLimit ?? 100 };
      });
    });
    // 3. Perform Calculations
    const { results, finenessModulus } = calculateSieveResults(
      data.readings,
      data.totalWeight,
      limits,
    );
    const judgment = judgeSieveAnalysis(results);
    // 4. Save to Database
    const analysis = await prisma.sieveAnalysis.create({
      data: {
        materialId: data.materialId,
        testType: data.testType,
        readings: JSON.stringify(data.readings),
        totalWeight: data.totalWeight,
        moistureContent: data.moistureContent,
        clayContent: data.clayContent,
        dryWeight: data.dryWeight,
        washWeight: data.washWeight,
        source: data.source,
        projectName: data.projectName,
        inspectorName: data.inspectorName,
        sampleDate: data.sampleDate || new Date(),
        testDate: data.testDate || new Date(),
        results: JSON.stringify(results),
        finenessModulus,
        appliedStandards: JSON.stringify(data.appliedStandardIds),
        status: "PENDING",
        companyId: user.companyId,
        creatorName: user.name,
      },
    });
    revalidatePath("/system/lab/sieve-analysis");
    return { success: true, data: analysis, judgment };
  } catch (error) {
    console.error("Error creating sieve analysis:", error);
    return { success: false, error: "Failed to create sieve analysis" };
  }
}
export async function deleteSieveAnalysis(id: number) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");
  try {
    await prisma.sieveAnalysis.delete({
      where: { id, companyId: user.companyId },
    });
    revalidatePath("/system/lab/sieve-analysis");
    return { success: true };
  } catch (error) {
    console.error("Error deleting sieve analysis:", error);
    return { success: false, error: "Failed to delete sieve analysis" };
  }
}
export async function approveSieveAnalysis(
  id: number,
  status: "APPROVED" | "REJECTED",
) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");
  try {
    const analysis = await prisma.sieveAnalysis.update({
      where: { id, companyId: user.companyId },
      data: {
        status,
        approvedById: user.id,
        approverName: user.name,
      },
    });
    revalidatePath("/system/lab/sieve-analysis");
    return { success: true, data: analysis };
  } catch (error) {
    console.error("Error approving sieve analysis:", error);
    return { success: false, error: "Failed to update status" };
  }
}
