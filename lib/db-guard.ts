/**
 * DATABASE GUARD — حارس قاعدة البيانات
 * يمنع الاستعلامات الضارة وتسريب البيانات بالجملة
 */

/**
 * الحد الأقصى للسجلات في استعلام واحد
 * أي طلب يتجاوز هذا الحد يُرفض أو يُقطع
 */
export const QUERY_LIMITS = {
  ORDERS: 100,
  USERS: 50,
  MIX_DESIGNS: 200,
  CUBE_TESTS: 200,
  SIEVE_ANALYSES: 100,
  AUDIT_LOGS: 50,
  DEFAULT: 50,
} as const;

/**
 * تطبيق الحد على أي استعلام Prisma
 */
export function safeLimit(
  requestedLimit: number | undefined,
  entity: keyof typeof QUERY_LIMITS = "DEFAULT",
): number {
  const max = QUERY_LIMITS[entity];
  if (!requestedLimit) return max;
  return Math.min(requestedLimit, max);
}

/**
 * تنظيف البيانات الحساسة قبل إرسالها للواجهة
 * يحذف الحقول الخطيرة من أي كائن مستخدم
 */
export function sanitizeUser<T extends Record<string, any>>(
  user: T,
): Omit<T, "password" | "plainPassword" | "tokenHash"> {
  const sanitized = { ...user };
  delete sanitized.password;
  delete sanitized.plainPassword;
  delete sanitized.tokenHash;
  return sanitized as Omit<T, "password" | "plainPassword" | "tokenHash">;
}

/**
 * تحقق من أن companyId في الطلب يطابق companyId الجلسة
 * يمنع تغيير الـ companyId في request body لسرقة بيانات شركة أخرى
 */
export function validateTenantIsolation(
  sessionCompanyId: number | undefined,
  requestCompanyId: number | undefined,
  userRole: string,
): { valid: boolean; reason?: string } {
  if (userRole === "SYSTEM_OWNER") return { valid: true };

  if (!sessionCompanyId) {
    return { valid: false, reason: "No company context in session" };
  }

  if (requestCompanyId && requestCompanyId !== sessionCompanyId) {
    return {
      valid: false,
      reason: `Tenant isolation violation: requested ${requestCompanyId}, session ${sessionCompanyId}`,
    };
  }

  return { valid: true };
}
