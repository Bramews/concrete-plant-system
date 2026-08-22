import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

export interface FinancialAuditEntry {
  companyId: number;
  action: string;
  entityType: string;
  entityId: string | number;
  oldSnapshot?: unknown;
  newSnapshot?: unknown;
  reason: string;
  ipAddress?: string;
}

/**
 * توثيق رقابي سيادي غير قابل للتعديل لكافة الحركات والتعديلات المالية
 */
export async function recordFinancialAudit(entry: FinancialAuditEntry) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const username = user?.name || user?.email || "نظام آلي";

    const oldStr = entry.oldSnapshot
      ? typeof entry.oldSnapshot === "string"
        ? entry.oldSnapshot
        : JSON.stringify(entry.oldSnapshot)
      : null;

    const newStr = entry.newSnapshot
      ? typeof entry.newSnapshot === "string"
        ? entry.newSnapshot
        : JSON.stringify(entry.newSnapshot)
      : null;

    const timestamp = new Date();
    // توليد بصمة رقمية تسلسلية لمنع أي تلاعب
    const payloadToHash = `${entry.companyId}:${entry.entityType}:${entry.entityId}:${entry.action}:${timestamp.toISOString()}:${oldStr || ""}:${newStr || ""}`;
    const checksum = crypto.createHash("sha256").update(payloadToHash).digest("hex");

    const auditRecord = await prisma.financialAuditTrail.create({
      data: {
        companyId: entry.companyId,
        userId,
        username,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId.toString(),
        oldSnapshot: oldStr,
        newSnapshot: newStr,
        reason: entry.reason,
        ipAddress: entry.ipAddress || null,
        checksum,
        timestamp,
      },
    });

    return { success: true, id: auditRecord.id };
  } catch (error) {
    console.error("[FinancialAudit] Critical failure recording audit trail:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * جلب سجل الرقابة المالي السيادي للشركة
 */
export async function getCompanyFinancialAuditTrail(
  companyId: number,
  options?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  },
) {
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  const where: {
    companyId: number;
    entityType?: string;
    entityId?: string;
    action?: string;
  } = { companyId };
  if (options?.entityType) where.entityType = options.entityType;
  if (options?.entityId) where.entityId = options.entityId;
  if (options?.action) where.action = options.action;

  const [records, total] = await Promise.all([
    prisma.financialAuditTrail.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.financialAuditTrail.count({ where }),
  ]);

  return { records, total };
}
