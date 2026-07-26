/**
 * safeAction — Universal Server Action Wrapper
 *
 * Wraps any async server action with bulletproof error handling.
 * - Catches ALL errors (Prisma, Auth, Network, Runtime)
 * - Returns a typed discriminated union: { success: true, data } | { success: false, error }
 * - NEVER crashes the page or leaves it in "Rendering..." state
 * - Logs errors server-side without leaking sensitive info to the client
 *
 * Usage:
 *   const result = await safeAction(() => prisma.order.create({ data }));
 *   if (!result.success) return toast.error(result.error);
 *   return result.data;
 */

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function safeAction<T>(
  fn: () => Promise<T>,
  errorContext = "Action",
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error: unknown) {
    const message = extractErrorMessage(error);
    console.error(`[${errorContext}] Error:`, error);
    return { success: false, error: message };
  }
}

/**
 * Extracts a user-friendly Arabic error message from any error type.
 * Maps common Prisma error codes to meaningful Arabic messages.
 */
function extractErrorMessage(error: any): string {
  if (!error) return "حدث خطأ غير معروف";

  // Prisma-specific error codes
  if (error.code) {
    switch (error.code) {
      case "P2002":
        return "هذا السجل موجود مسبقاً (تكرار بيانات)";
      case "P2025":
        return "السجل المطلوب غير موجود";
      case "P2003":
        return "خطأ في العلاقات — تحقق من البيانات المرتبطة";
      case "P2016":
        return "حقل مطلوب فارغ — تحقق من اكتمال البيانات";
      case "P1001":
        return "لا يمكن الاتصال بقاعدة البيانات — يرجى المحاولة لاحقاً";
      case "P1008":
        return "انتهت مهلة العملية — يرجى المحاولة مجدداً";
      default:
        // Log the code for developers but show generic message
        console.error("[DB Error Code]:", error.code);
        return "حدث خطأ في قاعدة البيانات";
    }
  }

  // Auth/Permission errors
  if (
    (error as Error).message?.includes("Unauthorized") ||
    (error as Error).message?.includes("UNAUTHORIZED")
  ) {
    return "غير مصرح لك بالقيام بهذه العملية";
  }
  if ((error as Error).message?.includes("FORBIDDEN")) {
    return "هذه العملية محظورة لدورك الوظيفي";
  }
  if ((error as Error).message?.includes("NOT_AUTHENTICATED")) {
    return "يرجى تسجيل الدخول أولاً";
  }

  // Return the message as-is if it's in Arabic (user-facing)
  if (
    (error as Error).message &&
    /[\u0600-\u06FF]/.test((error as Error).message)
  ) {
    return (error as Error).message;
  }

  // Fallback
  return "حدث خطأ غير متوقع، يرجى المحاولة مجدداً";
}
