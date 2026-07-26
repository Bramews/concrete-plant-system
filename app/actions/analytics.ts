"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getPerformanceAnalytics() {
  const user = await getCurrentUser();
  if (!user?.companyId) return null;

  const [cubeResults, batches] = await Promise.all([
    prisma.cubeTest.findMany({
      where: { companyId: user.companyId, status: "APPROVED" },
      orderBy: { sampleDate: "asc" },
      take: 50,
    }),
    prisma.batch.findMany({
      where: { order: { companyId: user.companyId } },
      include: {
        order: {
          include: {
            mixDesign: {
              include: {
                MixComponent: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // Calculate Quality Stability (Standard Deviation)
  const strengths = cubeResults.map((c) => c.mpa || 0).filter((s) => s > 0);
  const mean = strengths.reduce((a, b) => a + b, 0) / strengths.length || 0;
  const stdDev =
    Math.sqrt(
      strengths.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) /
        strengths.length,
    ) || 0;

  // Wastage Analysis (Target vs Actual)
  const wastageData = batches.map((b) => {
    let actual = 0;
    let target = 0;
    try {
      const actualData = JSON.parse(b.actualMixData || "{}");
      // Sum total weights
      actual = Object.values(actualData).reduce(
        (a: any, b: any) => a + Number(b),
        0,
      ) as number;
      const targetComponents = b.order?.mixDesign?.MixComponent || [];
      target = targetComponents.reduce(
        (sum, comp) => sum + comp.quantity * b.quantity,
        0,
      );
    } catch (e) {}
    return {
      id: b.id,
      date: b.createdAt,
      actual,
      target,
      diff: target > 0 ? ((actual - target) / target) * 100 : 0,
    };
  });
  return {
    cubeResults,
    stdDev: Number(stdDev.toFixed(2)),
    mean: Number(mean.toFixed(2)),
    wastageData: wastageData.filter((d) => d.target > 0),
    totalCubes: cubeResults.length,
    totalBatches: batches.length,
  };
}
