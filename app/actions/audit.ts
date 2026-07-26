"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getAuditLogs(page: number = 1, pageSize: number = 50) {
  const user = await getCurrentUser();
  if (!user?.companyId) return { logs: [], total: 0 };

  // Only Managers and System Owners can see logs
  if (
    !["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"].includes(user.role as string)
  ) {
    throw new Error("غير مصرح لك بالوصول لسجلات التدقيق");
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { companyId: user.companyId },
      include: { user: { select: { name: true, username: true } } },
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({
      where: { companyId: user.companyId },
    }),
  ]);

  return { logs, total };
}
