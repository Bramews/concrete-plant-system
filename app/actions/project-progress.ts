"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getProjectsProgress() {
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false, projects: [] };

  const projects = await prisma.project.findMany({
    where: { companyId: user.companyId, status: "ACTIVE", deletedAt: null },
    include: {
      orders: {
        where: { deletedAt: null },
        select: {
          id: true,
          volume: true,
          actualQuantity: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = projects.map((project) => {
    const totalVolume = project.orders.reduce((s, o) => s + o.volume, 0);
    const deliveredVolume = project.orders.reduce(
      (s, o) => s + o.actualQuantity,
      0,
    );
    const orderCount = project.orders.length;
    const completedOrders = project.orders.filter((o) =>
      ["CLOSED", "ACCOUNTING_CLOSED"].includes(o.status),
    ).length;
    const progressPercent =
      totalVolume > 0 ? Math.round((deliveredVolume / totalVolume) * 100) : 0;

    return {
      id: project.id,
      name: project.name,
      location: project.location,
      totalVolume: Math.round(totalVolume * 10) / 10,
      deliveredVolume: Math.round(deliveredVolume * 10) / 10,
      remainingVolume: Math.round((totalVolume - deliveredVolume) * 10) / 10,
      progressPercent: Math.min(progressPercent, 100),
      orderCount,
      completedOrders,
    };
  });

  return { success: true, projects: result };
}
