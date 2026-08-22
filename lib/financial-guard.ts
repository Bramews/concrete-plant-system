import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordFinancialAudit } from "@/lib/financial-audit";
import { format, startOfMonth, endOfMonth } from "date-fns";

/**
 * التحقق مما إذا كان تاريخ العملية يقع ضمن فترة مالية مقفلة
 */
export async function checkPeriodLock(
  companyId: number,
  targetDate: Date | string,
): Promise<{ isLocked: boolean; periodKey?: string; message?: string }> {
  try {
    const dateObj = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
    if (isNaN(dateObj.getTime())) {
      return { isLocked: false };
    }

    const periodKey = format(dateObj, "yyyy-MM");

    const closedPeriod = await prisma.financialPeriod.findFirst({
      where: {
        companyId,
        periodKey,
        status: "CLOSED",
      },
    });

    if (closedPeriod) {
      return {
        isLocked: true,
        periodKey,
        message: `لا يمكن إجراء أو تعديل المعاملات المالية لشهر (${periodKey}) لأن الفترة المالية مقفلة ومدققة. يرجى مراجعة الإدارة العامة لطلب فك القفل.`,
      };
    }

    return { isLocked: false, periodKey };
  } catch (error) {
    console.error("[PeriodLock] Error checking period lock status:", error);
    return { isLocked: false };
  }
}

/**
 * جلب قائمة الفترات المالية للشركة
 */
export async function getCompanyFinancialPeriods(companyId: number) {
  return prisma.financialPeriod.findMany({
    where: { companyId },
    orderBy: { periodKey: "desc" },
  });
}

/**
 * إقفال فترة مالية محددة
 */
export async function lockFinancialPeriod(
  companyId: number,
  periodKey: string,
  reason?: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("NOT_AUTHENTICATED");

  // التحقق من الصلاحيات: مدير عام أو محاسب مفوض
  if (user.role !== "MANAGER" && user.role !== "SYSTEM_OWNER" && user.role !== "ACCOUNTANT") {
    throw new Error("غير مصرح لك بإقفال الفترات المالية");
  }

  // حساب تاريخ البداية والنهاية للشهر
  const [yearStr, monthStr] = periodKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const baseDate = new Date(year, month, 1);
  const startDate = startOfMonth(baseDate);
  const endDate = endOfMonth(baseDate);

  const existing = await prisma.financialPeriod.findUnique({
    where: {
      companyId_periodKey: {
        companyId,
        periodKey,
      },
    },
  });

  const closedAt = new Date();
  const periodRecord = await prisma.financialPeriod.upsert({
    where: {
      companyId_periodKey: {
        companyId,
        periodKey,
      },
    },
    update: {
      status: "CLOSED",
      closedAt,
      closedById: user.id,
      closedByName: user.name || user.email,
      reason: reason || "إقفال وتدقيق شهري رسمي",
    },
    create: {
      companyId,
      periodKey,
      startDate,
      endDate,
      status: "CLOSED",
      closedAt,
      closedById: user.id,
      closedByName: user.name || user.email,
      reason: reason || "إقفال وتدقيق شهري رسمي",
    },
  });

  // تسجيل الرقابة السيادية
  await recordFinancialAudit({
    companyId,
    action: "PERIOD_LOCK",
    entityType: "FinancialPeriod",
    entityId: periodKey,
    oldSnapshot: existing ? { status: existing.status } : null,
    newSnapshot: { status: "CLOSED", periodKey, closedAt },
    reason: reason || "إقفال الفترة المالية وتجميد العمليات",
  });

  return { success: true, period: periodRecord };
}

/**
 * فك قفل فترة مالية (يتطلب مدير عام أو مالك النظام)
 */
export async function unlockFinancialPeriod(
  companyId: number,
  periodKey: string,
  reason: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("NOT_AUTHENTICATED");

  if (user.role !== "MANAGER" && user.role !== "SYSTEM_OWNER") {
    throw new Error("فك قفل الفترات المالية يتطلب موافقة المدير العام حصراً");
  }

  if (!reason || reason.trim().length < 5) {
    throw new Error("يجب كتابة سبب رسمي ومفصل لفك قفل الفترة المالية");
  }

  const existing = await prisma.financialPeriod.findUnique({
    where: {
      companyId_periodKey: {
        companyId,
        periodKey,
      },
    },
  });

  if (!existing || existing.status !== "CLOSED") {
    return { success: true, message: "الفترة المالية مفتوحة بالفعل" };
  }

  const updated = await prisma.financialPeriod.update({
    where: {
      companyId_periodKey: {
        companyId,
        periodKey,
      },
    },
    data: {
      status: "OPEN",
      reason: `تم فك القفل بواسطة (${user.name || user.email}) - السبب: ${reason}`,
    },
  });

  // تسجيل الرقابة السيادية لفك القفل
  await recordFinancialAudit({
    companyId,
    action: "PERIOD_UNLOCK",
    entityType: "FinancialPeriod",
    entityId: periodKey,
    oldSnapshot: { status: "CLOSED", closedAt: existing.closedAt, closedByName: existing.closedByName },
    newSnapshot: { status: "OPEN", unlockedBy: user.name, reason },
    reason: `فك قفل رسمي للفترة المالية: ${reason}`,
  });

  return { success: true, period: updated };
}
