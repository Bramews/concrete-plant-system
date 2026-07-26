import { NetworkEngine } from "@/lib/network/NetworkEngine";

export interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface ReverseGeocodeResult {
  displayName: string;
  region: string;
}

export class SearchEngine {
  private static cache = new Map<string, any>();
  private static lastRequestTime = 0;

  /**
   * مساعد لضبط التباطؤ (Debounce) لمنع إرهاق السيرفر بالطلب المتكرر
   */
  public static debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number,
  ): (...args: Parameters<T>) => void {
    let timeoutId: any;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }

  /**
   * البحث عن المواقع بناءً على نص الاستعلام
   */
  public static async searchAddress(
    query: string,
    isAr: boolean = true,
  ): Promise<SearchResult[]> {
    if (!query || query.trim() === "") return [];

    const cacheKey = `search_${isAr ? "ar" : "en"}_${query.trim().toLowerCase()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // تطبيق الـ Rate Limiting
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
    }
    this.lastRequestTime = Date.now();

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=${isAr ? "ar" : "en"}&limit=5`;
      const res = await NetworkEngine.fetch(url, {
        timeout: 5000,
        maxRetries: 2,
      });
      const data = await res.json();

      const results = data.map((item: any) => ({
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
      }));

      this.cache.set(cacheKey, results);
      return results;
    } catch (e) {
      console.error("Nominatim search error:", e);
      throw e; // إعادة رمي الخطأ الحقيقي بدلاً من إرجاع مصفوفة فارغة صامتة
    }
  }

  /**
   * استرجاع اسم ومعلومات العنوان بناءً على الإحداثيات (Reverse Geocoding)
   */
  public static async reverseGeocode(
    lat: number,
    lng: number,
    isAr: boolean = true,
  ): Promise<ReverseGeocodeResult> {
    const cacheKey = `reverse_${isAr ? "ar" : "en"}_${lat.toFixed(5)}_${lng.toFixed(5)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // تطبيق الـ Rate Limiting
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
    }
    this.lastRequestTime = Date.now();

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${isAr ? "ar" : "en"}`;
      const res = await NetworkEngine.fetch(url, {
        timeout: 5000,
        maxRetries: 2,
      });
      const data = await res.json();
      const displayName = data.display_name || "";
      const addr = data.address || {};
      const region =
        addr.suburb ||
        addr.neighbourhood ||
        addr.city_district ||
        addr.village ||
        addr.city ||
        addr.town ||
        "";

      const result: ReverseGeocodeResult = { displayName, region };
      this.cache.set(cacheKey, result);
      return result;
    } catch (e) {
      console.error("Nominatim reverse error:", e);
      throw e; // إعادة رمي الخطأ الحقيقي بدلاً من إرجاع كائن فارغ صامت
    }
  }
}
