import { NetworkEngine, DiagnosticError } from "./NetworkEngine";

export interface ValidationTestResult {
  name: string;
  url: string;
  success: boolean;
  message: string;
  responseTime?: number;
  errorType?: string;
}

export class NetworkValidationSuite {
  /**
   * تشغيل اختبار التحقق من جميع النقاط الخارجية اللازمة لعمل الخرائط
   */
  public static async runSuite(): Promise<ValidationTestResult[]> {
    const tests = [
      {
        name: "خادم البحث الجغرافي (OSM Nominatim API)",
        url: "https://nominatim.openstreetmap.org/search?format=json&q=Baghdad&limit=1",
      },
      {
        name: "مزود بلاطات خرائط كارتو (CartoDB Tiles)",
        url: "https://a.basemaps.cartocdn.com/light_all/0/0/0.png",
      },
      {
        name: "موقع تحديد إحداثيات الـ IP الأول (ipapi.co)",
        url: "https://ipapi.co/json/",
      },
      {
        name: "موقع تحديد إحداثيات الـ IP الثاني (freeipapi.com)",
        url: "https://freeipapi.com/api/json",
      },
    ];

    const results: ValidationTestResult[] = [];

    for (const test of tests) {
      const startTime = Date.now();
      try {
        await NetworkEngine.fetch(test.url, {
          timeout: 5000,
          maxRetries: 1,
        });
        const elapsed = Date.now() - startTime;
        results.push({
          name: test.name,
          url: test.url,
          success: true,
          message: `متصل ومستقر. زمن الاستجابة: ${elapsed}ms`,
          responseTime: elapsed,
        });
      } catch (err: any) {
        const elapsed = Date.now() - startTime;
        const diagErr = err as DiagnosticError;
        results.push({
          name: test.name,
          url: test.url,
          success: false,
          message: diagErr.message || "فشل الاتصال بالخادم الخارجي.",
          responseTime: elapsed,
          errorType: diagErr.type,
        });
      }
    }

    return results;
  }
}
