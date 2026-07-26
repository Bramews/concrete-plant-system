"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icons } from "./Icons";
import { toast } from "sonner";
import { MAP_CONFIG, getActiveTileProvider } from "@/lib/map/config";
import { IMapProvider } from "@/lib/gis/interfaces";
import {
  OSMMapProvider,
  OSMGeocodingProvider,
  OSMLocationProvider,
} from "@/lib/gis/OSMMapProvider";
import { SearchResult } from "@/lib/map/SearchEngine";
import { StorageEngine } from "@/lib/map/StorageEngine";
import { NavigationEngine } from "@/lib/map/NavigationEngine";

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
  isAr?: boolean;
}

// السكربت الديناميكي لتحميل Leaflet بأمان في بيئة Next.js SSR
const loadScript = (url: string) => {
  const existing = document.querySelector(`script[src="${url}"]`);
  if (existing) {
    if ((window as any).L) return Promise.resolve(true);
    existing.remove();
  }
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function MapPickerModal({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat,
  initialLng,
  isAr = true,
}: MapPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapEngineRef = useRef<IMapProvider | null>(null);

  // حالات البيانات والإحداثيات
  const [coords, setCoords] = useState({
    lat: initialLat ?? MAP_CONFIG.defaultCenter.lat,
    lng: initialLng ?? MAP_CONFIG.defaultCenter.lng,
  });
  const [address, setAddress] = useState("");
  const [regionName, setRegionName] = useState("");
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [locationSource, setLocationSource] = useState<
    "gps" | "ip" | "saved" | "default"
  >("default");

  // حالات تحميل الخريطة والأخطاء
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? window.navigator.onLine : true,
  );

  // حالات البحث
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // حالات تحديد الموقع
  const [locating, setLocating] = useState(false);
  const [locateSuccess, setLocateSuccess] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  // مراقبة حالة الاتصال بالإنترنت
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      setIsOnline(true);
      toast.success(
        isAr
          ? "تم استعادة الاتصال بالإنترنت."
          : "Internet connection restored.",
      );
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error(
        isAr
          ? "انقطع الاتصال بالإنترنت. الخريطة تعمل بالوضع المحلي."
          : "Internet connection lost. Running in offline mode.",
      );
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isAr]);

  // تهيئة محرك الخرائط والبدء في جلب الموقع التلقائي عند الفتح
  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    const initializeMapSystem = async () => {
      try {
        setLoading(true);
        setMapError("");

        // تحميل ملفات السكربت لـ Leaflet
        const jsLoaded = await loadScript("/leaflet/leaflet.js");
        if (!jsLoaded || !(window as any).L) {
          throw new Error("Map script loading failed");
        }

        if (!active || !mapContainerRef.current) return;

        // تحديد الإحداثيات المبدئية باتباع تسلسل الموقع المحفوظ
        let startLat = initialLat;
        let startLng = initialLng;
        let startSource: "saved" | "default" = "saved";

        const cachedLoc = StorageEngine.getSavedLocation();
        if (cachedLoc && !initialLat && !initialLng) {
          startLat = cachedLoc.lat;
          startLng = cachedLoc.lng;
          startSource = "saved";
        }

        if (!startLat || !startLng) {
          startLat = MAP_CONFIG.defaultCenter.lat;
          startLng = MAP_CONFIG.defaultCenter.lng;
          startSource = "default";
        }

        setCoords({ lat: startLat, lng: startLng });
        setLocationSource(startSource);

        const tileConfig = getActiveTileProvider();
        const L = (window as any).L;

        // بناء وتشغيل المحرك المستقل
        const engine = new OSMMapProvider(
          mapContainerRef.current,
          startLat,
          startLng,
          MAP_CONFIG.defaultZoom,
          tileConfig,
        );
        mapEngineRef.current = engine;
        engine.init(L);
        setLoading(false);

        // ربط أحداث تغيير مكان العلامة على الخريطة
        engine.onCoordsChange((lat, lng) => {
          setCoords({ lat, lng });
          triggerReverseGeocode(lat, lng);
        });

        // طلب العنوان الأولي للإحداثيات الحالية
        triggerReverseGeocode(startLat, startLng);

        // إطلاق تسلسل تحديد الموقع التلقائي (GPS -> IP) فور الفتح بدون تجمد الواجهة
        executeLocationChain(startLat, startLng);
      } catch (err) {
        console.error("Map system initialization failed:", err);
        if (active) {
          setMapError(
            isAr
              ? "فشل تهيئة محرك الخرائط. يرجى التحقق من اتصالك بالإنترنت."
              : "Failed to initialize map engine. Please check internet connection.",
          );
          setLoading(false);
        }
      }
    };

    initializeMapSystem();

    return () => {
      active = false;
      if (mapEngineRef.current) {
        mapEngineRef.current.destroy();
        mapEngineRef.current = null;
      }
    };
  }, [isOpen, retryTrigger]);

  // تنفيذ Reverse Geocoding لجلب تفاصيل العنوان والمنطقة
  const triggerReverseGeocode = async (lat: number, lng: number) => {
    try {
      const geocodingProvider = new OSMGeocodingProvider();
      const res = await geocodingProvider.reverseGeocode(lat, lng, isAr);
      if (res.displayName) {
        setAddress(res.displayName);
        setRegionName(res.region || (isAr ? "غير محددة" : "Undefined"));
      }
    } catch (e: any) {
      console.error("Geocoding resolution failed:", e);
      setAddress(
        isAr
          ? `خطأ في جلب العنوان: ${e.message}`
          : `Geocoding failed: ${e.message}`,
      );
      setRegionName(isAr ? "خطأ في الشبكة" : "Network Error");
    }
  };

  // تسلسل تحديد الموقع (GPS -> Saved -> IP -> Default)
  const executeLocationChain = async (
    fallbackLat: number,
    fallbackLng: number,
  ) => {
    setLocating(true);
    setShowPermissionGuide(false);

    try {
      const locationProvider = new OSMLocationProvider();
      const location = await locationProvider.getCurrentLocation(
        fallbackLat,
        fallbackLng,
        () => {
          // دالة الاستدعاء العكسي عند رفض صلاحية الـ GPS
          setShowPermissionGuide(true);
        },
      );

      setCoords({ lat: location.lat, lng: location.lng });
      setLocationSource(location.source);
      setAccuracy(location.accuracy);

      // تحديث وضع الخريطة والماركر
      if (mapEngineRef.current) {
        mapEngineRef.current.updateMarkerPosition(location.lat, location.lng);
        mapEngineRef.current.setView(location.lat, location.lng, 15);
      }

      await triggerReverseGeocode(location.lat, location.lng);

      // تشغيل حالة نجاح الجلب لتغيير أيقونة الزر العائم
      setLocateSuccess(true);
      setTimeout(() => setLocateSuccess(false), 2000);

      if (location.source === "gps") {
        toast.success(
          isAr
            ? "تم تحديد موقعك بدقة عبر الـ GPS."
            : "Location detected accurately via GPS.",
        );
      } else if (location.source === "ip") {
        toast.info(
          isAr
            ? "تم تحديد موقعك التقريبي عبر الإنترنت (IP)."
            : "Approximate location detected via IP.",
        );
      }
    } catch (err) {
      console.error("Location engine chain failed:", err);
    } finally {
      setLocating(false);
    }
  };

  // معالجة البحث عن العناوين يدوياً
  const handleSearch = async () => {
    if (!searchQuery || searchQuery.trim() === "") return;
    setSearching(true);
    try {
      const geocodingProvider = new OSMGeocodingProvider();
      const results = await geocodingProvider.searchAddress(searchQuery, isAr);
      setSearchResults(results);
      if (results.length === 0) {
        toast.error(
          isAr ? "لم يتم العثور على نتائج للبحث." : "No search results found.",
        );
      }
    } catch (err: any) {
      console.error("Search failed:", err);
      toast.error(
        err.message ||
          (isAr
            ? "فشل البحث بسبب خطأ في الشبكة."
            : "Search failed due to network error."),
      );
    } finally {
      setSearching(false);
    }
  };

  // استيعاب خيار النقر على نتيجة البحث من القائمة المنسدلة
  const handleSelectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setCoords({ lat, lng });
    setSearchResults([]);
    setSearchQuery(result.display_name);

    if (mapEngineRef.current) {
      mapEngineRef.current.updateMarkerPosition(lat, lng);
      mapEngineRef.current.setView(lat, lng, 15);
    }

    triggerReverseGeocode(lat, lng);
  };

  // مسح نص البحث وإغلاق القائمة المنسدلة
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  // إلغاء واعتماد الإحداثيات المحفوظة السابقة دون تصفيرها
  const handleCancel = () => {
    const saved = StorageEngine.getSavedLocation();
    if (saved) {
      onSelectLocation(saved.lat, saved.lng, saved.address);
    }
    onClose();
  };

  // تأكيد واعتماد الموقع وحفظه للاسترداد المستقبلي
  const handleConfirm = () => {
    // حفظ الموقع بداخل الـ StorageEngine لتوافقه أوفلاين ولحالات التراجع
    StorageEngine.saveLocation({
      lat: coords.lat,
      lng: coords.lng,
      address,
      zoom: 15,
    });

    onSelectLocation(coords.lat, coords.lng, address);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-[96vw] h-[94vh] max-w-none flex flex-col overflow-hidden shadow-2xl relative">
        {/* الخريطة الخلفية تشغل 100% من مساحة المودال */}
        <div className="absolute inset-0 z-0 bg-slate-950 w-full h-full">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-30">
              <div className="flex flex-col items-center gap-3">
                <Icons.Loader className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm font-bold text-slate-400">
                  {isAr ? "جاري تحميل الخريطة..." : "Loading Map..."}
                </p>
              </div>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-30 p-6 text-center gap-4">
              <Icons.Alert className="w-12 h-12 text-rose-500 animate-bounce" />
              <p className="text-sm font-bold text-rose-400">{mapError}</p>
              <button
                type="button"
                onClick={() => {
                  setMapError("");
                  setLoading(true);
                  setRetryTrigger((prev) => prev + 1);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          <div ref={mapContainerRef} className="w-full h-full z-10" />
        </div>

        {/* شريط البحث العلوي العائم بالمنتصف بتصميم زجاجي */}
        <div className="absolute top-4 left-4 right-4 z-20 bg-slate-900/80 backdrop-blur-lg border border-slate-800 p-4 rounded-2xl shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Icons.Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {isAr ? "محرك تحديد المواقع والخرائط" : "GIS Map Engine"}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                {isAr
                  ? "نظام المحطة الخرسانية الموحد"
                  : "Concrete Plant System"}
              </p>
            </div>
          </div>

          {/* شريط البحث وAutocomplete مع مسح الطلب */}
          <div className="flex-1 w-full flex gap-2 relative">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={
                  isAr
                    ? "ابحث عن موقع (مثال: المنصور، بغداد)..."
                    : "Search location..."
                }
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-colors flex items-center gap-2"
            >
              {searching ? (
                <Icons.Loader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icons.Search className="w-3.5 h-3.5" />
              )}
              {isAr ? "بحث" : "Search"}
            </button>

            {/* نتائج البحث المنسدلة */}
            {searchResults.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-white/5 z-50 text-right">
                {searchResults.map((res, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectSearchResult(res)}
                    className="px-4 py-2.5 text-xs text-slate-200 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors font-bold"
                  >
                    {res.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition-all border border-white/5 w-full md:w-auto flex justify-center items-center"
            title={isAr ? "إغلاق" : "Close"}
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* إشعار انقطاع الاتصال بالإنترنت */}
        {!isOnline && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-slate-950 px-4 py-1.5 rounded-full text-[10px] font-bold shadow-2xl flex items-center gap-2 animate-pulse">
            <Icons.AlertCircle className="w-3.5 h-3.5" />
            <span>
              {isAr
                ? "أنت تعمل حالياً بالوضع المحلي (بدون إنترنت)"
                : "Working in Offline Mode"}
            </span>
          </div>
        )}

        {/* لوحة إرشادية عربية تفاعلية بداخل الخريطة عند رفض الجيولكيشن */}
        {showPermissionGuide && (
          <div className="absolute top-24 left-6 z-30 max-w-sm bg-slate-950/95 backdrop-blur-md border border-rose-500/30 p-5 rounded-2xl shadow-2xl text-right animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center gap-2 mb-3 text-rose-400">
              <Icons.Alert className="w-5 h-5" />
              <h4 className="font-bold text-xs">
                {isAr ? "تفعيل صلاحية الموقع مطلوب" : "Permission Required"}
              </h4>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-semibold mb-3">
              {isAr
                ? "لم نتمكن من تحديد موقعك بدقة. يرجى مراجعة إعدادات جهازك، وتم تحويلك للموقع التقريبي بالـ IP تلقائياً."
                : "Unable to detect location. Showing approximate IP location."}
            </p>
            <ol className="text-[10px] text-slate-400 space-y-2 list-decimal list-inside pr-1 font-medium">
              <li>
                {isAr
                  ? "تأكد من تشغيل خدمات الموقع في ويندوز (Windows Location Services)."
                  : "Enable Location in Windows settings."}
              </li>
              <li>
                {isAr
                  ? "اضغط على أيقونة القفل أو المعلومات بجانب رابط الموقع بالأعلى."
                  : "Click the lock icon in the URL bar."}
              </li>
              <li>
                {isAr
                  ? "قم بتغيير إذن الموقع الجغرافي (Location) إلى السماح (Allow)."
                  : "Set Location permission to Allow."}
              </li>
            </ol>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPermissionGuide(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-bold rounded-lg transition-colors border border-white/5"
              >
                {isAr ? "فهمت ذلك" : "Dismiss"}
              </button>
            </div>
          </div>
        )}

        {/* زر تحديد الموقع الحالي الدائري العائم أسفل اليمين */}
        {!loading && !mapError && (
          <button
            type="button"
            onClick={() => executeLocationChain(coords.lat, coords.lng)}
            disabled={locating}
            className={`absolute bottom-52 right-6 z-20 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border flex items-center justify-center ${
              locateSuccess
                ? "bg-emerald-600 text-white border-emerald-500 animate-pulse"
                : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/20"
            }`}
            title={isAr ? "تحديد الموقع الحالي" : "Locate Current Position"}
          >
            {locating ? (
              <Icons.Loader className="w-5 h-5 animate-spin" />
            ) : locateSuccess ? (
              <Icons.Check className="w-5 h-5" />
            ) : (
              <Icons.Target className="w-5 h-5" />
            )}
          </button>
        )}

        {/* زر فتح الموقع الحالي في خرائط جوجل دائم الظهور */}
        {!loading && !mapError && (
          <a
            href={NavigationEngine.getGoogleMapsUrl(coords.lat, coords.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-36 right-6 z-20 p-4 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-700 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
            title={isAr ? "الفتح في خرائط جوجل" : "Open in Google Maps"}
          >
            <Icons.ExternalLink className="w-5 h-5" />
          </a>
        )}

        {/* بطاقة معلومات تفصيلية عائمة أسفل الشاشة */}
        <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-2xl max-w-3xl mx-auto flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">
                {isAr ? "الإحداثيات النشطة:" : "Active Coordinates:"}
              </span>
              <span className="font-mono text-xs text-emerald-400 font-bold leading-normal">
                {coords.lat.toFixed(6)} , {coords.lng.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">
                {isAr ? "اسم المنطقة الحالية:" : "Current Region:"}
              </span>
              <span className="text-xs text-slate-200 font-bold truncate block">
                {regionName || (isAr ? "جاري الاسترجاع..." : "Resolving...")}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] text-slate-500 block font-bold">
                {isAr ? "العنوان بالكامل:" : "Full Address:"}
              </span>
              <span className="text-xs text-slate-300 font-bold leading-relaxed block line-clamp-1">
                {address ||
                  (isAr
                    ? "جاري استرجاع العنوان..."
                    : "Resolving full address...")}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between border-t border-white/5 pt-3 gap-3">
            <div className="flex gap-4 text-[10px] text-slate-400 font-semibold">
              <div>
                <span>{isAr ? "مصدر الموقع: " : "Source: "}</span>
                <span
                  className={`px-2 py-0.5 rounded text-white ${
                    locationSource === "gps"
                      ? "bg-emerald-600/30 text-emerald-400"
                      : locationSource === "ip"
                        ? "bg-amber-600/30 text-amber-400"
                        : locationSource === "saved"
                          ? "bg-indigo-600/30 text-indigo-400"
                          : "bg-slate-600/30 text-slate-400"
                  }`}
                >
                  {locationSource === "gps"
                    ? isAr
                      ? "GPS متصل"
                      : "GPS Live"
                    : locationSource === "ip"
                      ? isAr
                        ? "IP تقريبي"
                        : "IP Approx"
                      : locationSource === "saved"
                        ? isAr
                          ? "موقع محفوظ"
                          : "Stored Loc"
                        : isAr
                          ? "افتراضي"
                          : "Default"}
                </span>
              </div>
              {accuracy && (
                <div>
                  <span>{isAr ? "نسبة الدقة: " : "Accuracy: "}</span>
                  <span className="text-slate-200">
                    {accuracy.toFixed(0)} {isAr ? "متر" : "meters"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleCancel}
                className="px-5 py-2 bg-slate-800 text-slate-400 hover:text-white border border-white/5 rounded-xl text-xs font-bold transition-all"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
              >
                {isAr ? "تأكيد واعتماد الموقع" : "Confirm Location"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
