export interface StoredLocation {
  lat: number;
  lng: number;
  address?: string;
  zoom?: number;
}

export class StorageEngine {
  private static STORAGE_KEY = "cps_last_location";

  /**
   * حفظ بيانات الموقع الأخير في ذاكرة المتصفح المحلية (LocalStorage)
   */
  public static saveLocation(loc: StoredLocation): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(loc));
    } catch (e) {
      console.error("Failed to write to localStorage:", e);
    }
  }

  /**
   * استرجاع بيانات الموقع المحفوظ الأخير
   */
  public static getSavedLocation(): StoredLocation | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as StoredLocation;
      }
    } catch (e) {
      console.error("Failed to read from localStorage:", e);
    }
    return null;
  }

  /**
   * مسح ذاكرة الموقع المحفوظة
   */
  public static clearLocation(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
    }
  }
}
