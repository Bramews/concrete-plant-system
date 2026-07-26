import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function logActivity(
  companyId: number,
  userId: number | null,
  type: string,
  message: string,
  severity: "INFO" | "WARNING" | "CRITICAL" = "INFO",
  metadata?: any,
) {
  try {
    await prisma.companyActivityLog.create({
      data: {
        id: uuidv4(),
        companyId,
        userId,
        type,
        message,
        severity,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't crash main flow if logging fails
  }
}

export async function getCompanyActivity(companyId: number, limit = 50) {
  return await prisma.companyActivityLog.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });
}
