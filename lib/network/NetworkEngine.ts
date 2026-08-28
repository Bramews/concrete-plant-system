export interface NetworkRequestOptions extends RequestInit {
  timeout?: number; // المهلة بالملي ثانية (الافتراضي 8000)
  maxRetries?: number; // عدد محاولات إعادة الطلب عند الفشل (الافتراضي 3)
  backoffDelay?: number; // التأخير الأولي بالملي ثانية لإعادة المحاولة (الافتراضي 1000)
}

export interface DiagnosticError {
  message: string;
  type:
    | "DNS_OR_NETWORK"
    | "TIMEOUT"
    | "CORS_OR_SECURITY"
    | "HTTP_ERROR"
    | "ABORTED";
  status?: number;
  statusText?: string;
  url: string;
  originalError?: any;
}

export class NetworkEngine {
  private static activeRequests = new Set<AbortController>();

  /**
   * دالة استدعاء شبكية موحدة وآمنة تحل محل fetch المباشر في النظام
   */
  public static async fetch(
    url: string,
    options: NetworkRequestOptions = {},
  ): Promise<Response> {
    const {
      timeout = 8000,
      maxRetries = 3,
      backoffDelay = 1000,
      ...restOptions
    } = options;

    let attempt = 0;

    const execute = async (): Promise<Response> => {
      attempt++;
      const controller = new AbortController();
      NetworkEngine.activeRequests.add(controller);

      const timeoutId = setTimeout(() => {
        controller.abort("TIMEOUT");
      }, timeout);

      try {
        const fetchOptions: RequestInit = {
          ...restOptions,
          signal: controller.signal,
          headers: {
            "User-Agent": "Concrete-Plant-System-GIS/1.0.0",
            ...restOptions.headers,
          },
        };

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        NetworkEngine.activeRequests.delete(controller);

        if (!response.ok) {
          throw {
            message: `HTTP error! status: ${response.status}`,
            type: "HTTP_ERROR",
            status: response.status,
            statusText: response.statusText,
            url,
          } as DiagnosticError;
        }

        return response;
      } catch (err: any) {
        clearTimeout(timeoutId);
        NetworkEngine.activeRequests.delete(controller);

        // تشخيص دقيق لنوع الخطأ
        let diagError: DiagnosticError;

        if (err.name === "AbortError" || controller.signal.aborted) {
          const reason = controller.signal.reason;
          if (reason === "TIMEOUT" || err.message?.includes("timeout")) {
            diagError = {
              message: `انتهت المهلة الزمنية المحددة للطلب (${timeout}ms). الخادم لا يستجيب.`,
              type: "TIMEOUT",
              url,
            };
          } else {
            diagError = {
              message: "تم إلغاء طلب الاتصال الشبكي بشكل مقصود.",
              type: "ABORTED",
              url,
            };
          }
        } else if (err.type === "HTTP_ERROR") {
          diagError = err;
        } else if (
          err.message?.includes("Failed to fetch") ||
          err.message?.includes("NetworkError") ||
          err.message?.includes("fetch failed")
        ) {
          // في المتصفح، الـ Failed to fetch تعني غالباً CORS أو انقطاع كامل للشبكة/DNS
          const isOnline =
            typeof window !== "undefined" ? window.navigator.onLine : true;
          if (!isOnline) {
            diagError = {
              message: "فشل الاتصال: جهازك غير متصل بشبكة الإنترنت حالياً.",
              type: "DNS_OR_NETWORK",
              url,
              originalError: err,
            };
          } else {
            diagError = {
              message:
                "تم حظر الطلب من قبل المتصفح (قد يكون بسبب قيود CORS أو سياسة أمان المحتوى CSP).",
              type: "CORS_OR_SECURITY",
              url,
              originalError: err,
            };
          }
        } else {
          diagError = {
            message: err.message || "حدث خطأ غير متوقع أثناء الاتصال بالشبكة.",
            type: "DNS_OR_NETWORK",
            url,
            originalError: err,
          };
        }

        // محاولة إعادة الطلب تلقائياً في حال وجود محاولات متبقية وللأخطاء القابلة للاسترداد
        if (
          attempt < maxRetries &&
          diagError.type !== "ABORTED" &&
          diagError.status !== 401 &&
          diagError.status !== 403
        ) {
          const delay = backoffDelay * Math.pow(2, attempt - 1);
          console.warn(
            `Retrying request to ${url} (Attempt ${attempt}/${maxRetries}) in ${delay}ms due to: ${diagError.message}`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          return execute();
        }

        throw diagError;
      }
    };

    return execute();
  }

  /**
   * إلغاء جميع الطلبات الشبكية النشطة فوراً
   */
  public static abortAll(): void {
    this.activeRequests.forEach((controller) => {
      try {
        controller.abort("USER_ABORT");
      } catch (e) {
        console.error("[محرك الشبكة] تعذر إلغاء الطلب الشبكي النشط:", e);
      }
    });
    this.activeRequests.clear();
  }

  /**
   * التحقق الفوري من حالة اتصال جهاز المستخدم بالإنترنت
   */
  public static isSystemOnline(): boolean {
    if (typeof window === "undefined") return true;
    return window.navigator.onLine;
  }
}
