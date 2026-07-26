"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function searchLabArchive(query: string) {
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false, results: [] };
  if (!query || query.trim().length < 2) return { success: true, results: [] };

  const q = query.trim();

  const [cubeTests, sieveAnalyses] = await Promise.all([
    prisma.cubeTest.findMany({
      where: {
        companyId: user.companyId,
        OR: [
          { order: { orderNumber: { contains: q } } },
          { order: { customer: { name: { contains: q } } } },
          { order: { mixDesign: { name: { contains: q } } } },
          { order: { mixDesign: { grade: { contains: q } } } },
          { result: { contains: q } },
        ],
      },
      include: {
        order: {
          include: {
            customer: { select: { name: true } },
            mixDesign: { select: { name: true, grade: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    prisma.sieveAnalysis.findMany({
      where: {
        companyId: user.companyId,
        OR: [
          { material: { name: { contains: q } } },
          { source: { contains: q } },
          { supplier: { contains: q } },
          { location: { contains: q } },
          { projectName: { contains: q } },
          { inspectorName: { contains: q } },
          { zone: { contains: q } },
        ],
      },
      include: {
        material: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const results = [
    ...cubeTests.map((t) => ({
      type: "CUBE_TEST" as const,
      id: t.id,
      title: `نموذج كسر — طلب ${t.order.orderNumber}`,
      subtitle: `${t.order.customer?.name || "—"} • ${t.order.mixDesign?.grade || "—"} • ${t.age} يوم`,
      value: `${t.mpa ?? "—"} MPa`,
      result: t.result,
      date: t.sampleDate,
    })),
    ...sieveAnalyses.map((s) => ({
      type: "SIEVE" as const,
      id: s.id,
      title: `تحليل منخل — ${s.material.name}`,
      subtitle: `${s.source || "—"} • ${s.supplier || "—"} • ${s.location || "—"}`,
      value: s.zone || "—",
      result: s.status,
      date: s.createdAt,
    })),
  ];

  results.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return { success: true, results: results.slice(0, 30) };
}
