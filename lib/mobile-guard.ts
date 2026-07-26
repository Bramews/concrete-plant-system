/**
 * MOBILE GUARD — حماية تطبيق الهاتف
 * يفرض الاتصال الدائم بالخادم. لا offline. لا cache.
 */

/**
 * تحقق من الاتصال بالإنترنت (يُستخدم في Client Components)
 * عند فشل الاتصال: اعرض رسالة واضحة وامنع العمل
 */
export function requireOnlineMode(): boolean {
  if (typeof window === "undefined") return true; // Server = always online
  return window.navigator.onLine;
}

/**
 * رسالة الخطأ عند انقطاع الاتصال
 */
export const OFFLINE_MESSAGE = {
  ar: "⚠️ لا يوجد اتصال بالإنترنت. هذا النظام يتطلب اتصالاً دائماً بالخادم.",
  en: "⚠️ No internet connection. This system requires a permanent server connection.",
};

/**
 * منع حفظ البيانات الحساسة في localStorage
 */
export function secureStorage() {
  if (typeof window === "undefined") return;

  // مراقبة أي محاولة لحفظ بيانات حساسة
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key: string, value: string) => {
    const sensitiveKeys = ["password", "token", "secret", "api_key", "session"];
    const isSensitive = sensitiveKeys.some((s) =>
      key.toLowerCase().includes(s),
    );

    if (isSensitive && !key.startsWith("_safe_")) {
      console.error(
        `[SECURITY] Blocked storing sensitive key in localStorage: ${key}`,
      );
      return;
    }
    originalSetItem(key, value);
  };
}
