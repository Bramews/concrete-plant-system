"use server";

/**
 * EXPORT GUARD — حارس تصدير البيانات
 * يمنع استخراج كميات كبيرة من البيانات دفعة واحدة
 */

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// الحد الأقصى لعمليات التصدير في اليوم لكل مستخدم
const MAX_EXPORTS_PER_DAY = 20;
// الحد الأقصى لعدد سجلات في تصدير واحد
const MAX_RECORDS_PER_EXPORT = 500;

/**
 * تحقق إذا كان المستخدم تجاوز حد التصدير اليومي
 */
export async function checkExportQuota(
  userId: number,
  exportType: string,
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const exportCount = await prisma.auditLog.count({
      where: {
        userId,
        action: { startsWith: "EXPORT_" },
        timestamp: { gte: todayStart },
      },
    });

    if (exportCount >= MAX_EXPORTS_PER_DAY) {
      return {
        allowed: false,
        reason: `تجاوزت الحد اليومي للتصدير (${MAX_EXPORTS_PER_DAY} مرة/يوم).`,
      };
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

/**
 * سجّل عملية التصدير في AuditLog
 */
export async function logExport(
  userId: number,
  companyId: number | undefined,
  exportType: string,
  recordCount: number,
  ipAddress?: string,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        companyId,
        action: `EXPORT_${exportType.toUpperCase()}`,
        entity: exportType,
        entityId: "bulk",
        role: "EXPORT",
        details: JSON.stringify({
          recordCount,
          timestamp: new Date().toISOString(),
        }),
        ipAddress,
      },
    });
  } catch {}
}

/**
 * تحقق من حجم الطلب (عدد السجلات)
 */
export async function validateExportSize(
  requestedCount: number,
): Promise<{ valid: boolean; maxAllowed: number }> {
  return {
    valid: requestedCount <= MAX_RECORDS_PER_EXPORT,
    maxAllowed: MAX_RECORDS_PER_EXPORT,
  };
}

/**
 * أضف watermark مخفي في البيانات المُصدَّرة
 */
export async function watermarkData(
  data: any[],
  userId: number,
  companyId: number,
): Promise<any[]> {
  const timestamp = Date.now();
  const watermark = Buffer.from(
    `wm:${userId}:${companyId}:${timestamp}`,
  ).toString("base64");

  if (data.length === 0) return data;

  const marked = [...data];
  marked[0] = { ...marked[0], _wm: watermark };
  return marked;
}

/**
 * عملية تفويض التصدير المتكاملة للاستدعاء من المكونات
 */
export async function authorizeExport(exportType: string, recordCount: number) {
  const session = await getSession();
  if (!session) return { error: "غير مصرح بالوصول" };

  const sizeCheck = await validateExportSize(recordCount);
  if (!sizeCheck.valid)
    return { error: `الحد الأقصى للتصدير هو ${sizeCheck.maxAllowed} سجل.` };

  const quota = await checkExportQuota(session.userId, exportType);
  if (!quota.allowed) return { error: quota.reason };

  await logExport(session.userId, session.companyId, exportType, recordCount);

  return {
    success: true,
    userId: session.userId,
    companyId: session.companyId,
  };
}
