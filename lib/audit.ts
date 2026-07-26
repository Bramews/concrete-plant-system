import { PrismaClient } from "@prisma/client";
import { getCurrentRole } from "@/lib/auth";

const prisma = new PrismaClient();

/**
 * Append-only Audit Log Service
 * Strictly prevents updates or deletes via code architecture.
 */
export async function createAuditEntry(data: {
  userId: number;
  action: string;
  entity: string;
  entityId: string | number;
  prevStatus?: string;
  newStatus?: string;
  details?: string;
}) {
  const role = await getCurrentRole();

  return await prisma.auditLog.create({
    data: {
      ...data,
      entityId: data.entityId.toString(),
      role: role || "UNKNOWN",
      timestamp: new Date(),
    },
  });
}

// Note: No 'update' or 'delete' methods are exported for AuditLog.
