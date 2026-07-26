"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getPerformanceData() {
  const user = await getCurrentUser();
  if (!user?.companyId) return { cubeResults: [], trend: [] };

  const cubeResults = await prisma.cubeTest.findMany({
    where: { companyId: user.companyId },
    include: {
      order: {
        include: { mixDesign: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return { cubeResults };
}

export async function getFleetStatus() {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  const tickets = await prisma.deliveryTicket.findMany({
    where: {
      order: { companyId: user.companyId },
      status: { not: "DELIVERED" },
    },
    include: {
      order: {
        include: { project: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return tickets.map((t: any) => ({
    id: String(t.id),
    truckNumber: t.truckNumber || "TRK-01",
    status: t.status === "DISPATCHED" ? "EN_ROUTE" : "LOADING",
    driverName: "سائق المناوبة",
    projectName: t.order?.project?.name || "موقع عام",
    batchTime: t.createdAt,
    lat: 25.276987 + (Math.random() - 0.5) * 0.05,
    lng: 55.296249 + (Math.random() - 0.5) * 0.05,
    volume: t.cumulativeQuantity || 6,
  }));
}
