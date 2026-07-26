"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  predict28DayStrength,
  parseTargetMpa,
  analyzeTestBatch,
  suggestMixAdjustment,
  CubeTestRecord,
} from "@/lib/lab-intelligence";

export async function getLabIntelligenceReport() {
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false, error: "NOT_AUTHENTICATED" };

  // جلب آخر 100 نموذج مكتمل لهذه الشركة
  const tests = await prisma.cubeTest.findMany({
    where: { companyId: user.companyId, mpa: { not: null } },
    include: { order: { include: { mixDesign: true } } },
    orderBy: { sampleDate: "desc" },
    take: 100,
  });

  // تجميع النتائج حسب الخلطة
  const byMixDesign: Record<
    number,
    {
      mixName: string;
      grade: string | null;
      tests: typeof tests;
      cementKg: number;
    }
  > = {};

  for (const test of tests) {
    const mixId = test.order.mixDesignId;
    if (!mixId) continue;

    if (!byMixDesign[mixId]) {
      // استخراج كمية الاسمنت من مكونات الخلطة
      const cementComponent = await prisma.mixComponent.findFirst({
        where: {
          mixDesignId: mixId,
          materialName: { contains: "اسمنت" },
        },
      });

      byMixDesign[mixId] = {
        mixName: test.order.mixDesign?.name || `خلطة #${mixId}`,
        grade: test.order.mixDesign?.grade || null,
        tests: [],
        cementKg: cementComponent?.quantity || 350, // افتراضي 350
      };
    }

    byMixDesign[mixId].tests.push(test);
  }

  // توليد التقرير
  const report = Object.entries(byMixDesign).map(([mixId, data]) => {
    const targetMpa = parseTargetMpa(data.grade);
    const analysis = analyzeTestBatch(
      data.tests as unknown as CubeTestRecord[],
      targetMpa,
    );
    const adjustment = suggestMixAdjustment(
      analysis.avgMpa,
      targetMpa,
      data.cementKg,
    );

    // البحث عن نماذج 7 أيام لتوقع 28 يوم
    const sevenDayTests = (data.tests as unknown as CubeTestRecord[]).filter(
      (t) => t.age === 7 && t.mpa,
    );
    const predictions = sevenDayTests.map((t) => ({
      orderId: t.orderId,
      sevenDay: t.mpa as number,
      ...predict28DayStrength(t.mpa as number),
    }));

    return {
      mixId: parseInt(mixId),
      mixName: data.mixName,
      grade: data.grade,
      targetMpa,
      analysis,
      adjustment,
      predictions,
      testCount: data.tests.length,
    };
  });

  // ترتيب: الخطر أولاً
  report.sort((a, b) => {
    const order = { DANGER: 0, WARNING: 1, OK: 2, UNKNOWN: 3 };
    return (order[a.analysis.status] ?? 3) - (order[b.analysis.status] ?? 3);
  });

  return { success: true, report };
}
