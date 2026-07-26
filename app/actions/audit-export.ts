"use server";

import { PrismaClient } from "@prisma/client";
import { requireRole } from "@/lib/auth";

const prisma = new PrismaClient();

export async function exportAuditLogsCsv(filters: {
  fromDate?: string;
  toDate?: string;
  role?: string;
  action?: string;
}) {
  await requireRole(["MANAGER"]);

  const logs = await prisma.auditLog.findMany({
    where: {
      timestamp: {
        gte: filters.fromDate ? new Date(filters.fromDate) : undefined,
        lte: filters.toDate ? new Date(filters.toDate) : undefined,
      },
      role: filters.role,
      action: filters.action,
    },
    orderBy: { timestamp: "desc" },
  });

  const headers = ["Timestamp", "User", "Role", "Action", "Entity", "Details"];
  const rows = logs.map((log) => [
    log.timestamp.toISOString(),
    log.userId,
    log.role,
    log.action,
    log.entity,
    log.details || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}
