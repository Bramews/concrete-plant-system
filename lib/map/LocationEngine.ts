import { MAP_CONFIG } from "./config";
import { NetworkEngine } from "@/lib/network/NetworkEngine";

export interface LocationResult {
  lat: number;
  lng: number;
  accuracy?: number;
  source: "gps" | "ip" | "saved" | "default";
}

export class LocationEngine {
  /**
   * استعلام متوازٍ لخدمات الـ IP Geolocation البديلة
   */
  public static async getApproximateIPLocation(): Promise<LocationResult> {
    const apis = [
      {
        url: "https://ipapi.co/json/",
        parse: (data: any) => ({
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
        }),
      },
      {
        url: "https://ip-api.com/json/",
        parse: (data: any) => ({
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lon),
        }),
      },
      {
        url: "https://freeipapi.com/api/json",
        parse: (data: any) => ({
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
        }),
      },
    ];

    const fetchService = async (api: (typeof apis)[0]) => {
      try {
        const res = await NetworkEngine.fetch(api.url, {
          timeout: 4000,
          maxRetries: 2,
        });
        const data = await res.json();
        const coords = api.parse(data);
        if (isNaN(coords.lat) || isNaN(coords.lng))
          throw new Error("Invalid coords");
        return coords;
      } catch (e) {
        throw e;
      }
    };

    try {
      const coords = await Promise.any(apis.map((api) => fetchService(api)));
      return {
        lat: coords.lat,
        lng: coords.lng,
        source: "ip",
      };
    } catch (err) {
      throw new Error("All IP geolocation services failed");
    }
  }

  /**
   * جلب الموقع الجغرافي باتباع التسلسل الصارم:
   * GPS (المتصفح) -> الموقع المحفوظ سابقاً -> تحديد الموقع تقريبياً بالـ IP -> الموقع الافتراضي
   */
  public static async getCurrentLocation(
    savedLat?: number,
    savedLng?: number,
    onPermissionDenied?: () => void,
  ): Promise<LocationResult> {
    return new Promise<LocationResult>((resolve) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        if (savedLat && savedLng) {
          resolve({ lat: savedLat, lng: savedLng, source: "saved" });
        } else {
          resolve({
            lat: MAP_CONFIG.defaultCenter.lat,
            lng: MAP_CONFIG.defaultCenter.lng,
            source: "default",
          });
        }
        return;
      }

      // محاولة جلب الإحداثيات الدقيقة بالـ GPS
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            source: "gps",
          });
        },
        async (err) => {
          console.warn("GPS request failed or denied, trying fallbacks:", err);

          if (err.code === 1 && onPermissionDenied) {
            onPermissionDenied();
          }

          // التحقق من الإحداثيات المحفوظة
          if (
            savedLat &&
            savedLng &&
            savedLat !== MAP_CONFIG.defaultCenter.lat &&
            savedLng !== MAP_CONFIG.defaultCenter.lng
          ) {
            resolve({ lat: savedLat, lng: savedLng, source: "saved" });
            return;
          }

          // محاولة جلب الموقع عبر الـ IP
          try {
            const ipLoc = await LocationEngine.getApproximateIPLocation();
            resolve(ipLoc);
          } catch (ipErr) {
            console.error(
              "IP Geolocation failed, using default center:",
              ipErr,
            );
            // العودة للموقع الافتراضي كخيار أخير
            resolve({
              lat: MAP_CONFIG.defaultCenter.lat,
              lng: MAP_CONFIG.defaultCenter.lng,
              source: "default",
            });
          }
        },
        { enableHighAccuracy: true, timeout: 6000 },
      );
    });
  }
}
