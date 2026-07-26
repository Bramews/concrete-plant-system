"use client";

import React, { useState, useEffect, useRef } from "react";

// كائن لتخزين الأدلة الجنائية لكل طلب شبكي
interface LogEntry {
  url: string;
  method: string;
  reqHeaders: string;
  resHeaders: string;
  statusCode: string;
  timing: string;
  responseBody: string;
  consoleErrors: string;
  statusType: "SUCCESS" | "FAILED" | "PENDING";
}

// السكربت الديناميكي لتحميل Leaflet بأمان في بيئة Next.js SSR
const loadScript = (url: string) => {
  if (typeof window === "undefined") return Promise.resolve(false);
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

export default function GisLaboratoryPage() {
  const [coords, setCoords] = useState({ lat: 30.50178, lng: 47.81814 });
  const [tileLog, setTileLog] = useState<any>(null);

  // سجلات الفحص لكل خدمة
  const [gpsLog, setGpsLog] = useState<LogEntry | null>(null);
  const [searchLog, setSearchLog] = useState<LogEntry | null>(null);
  const [reverseLog, setReverseLog] = useState<LogEntry | null>(null);
  const [ipLog, setIpLog] = useState<LogEntry | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // تهيئة الخريطة ديناميكياً بدون استيراد الحزمة مباشرة
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    const initMap = async () => {
      try {
        const jsLoaded = await loadScript("/leaflet/leaflet.js");
        if (!jsLoaded || !(window as any).L) {
          console.error("Failed to load Leaflet script dynamically.");
          return;
        }

        const L = (window as any).L;
        if (leafletMap.current) return;

        // تهيئة الخريطة
        leafletMap.current = L.map(mapRef.current!).setView(
          [coords.lat, coords.lng],
          13,
        );

        // إطلاق حدث تحميل البلاطات
        const tileLayer = L.tileLayer(
          "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          {
            attribution: "CartoDB",
          },
        );

        tileLayer.on("loading", () => {
          setTileLog({
            url: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            event: "loading",
            time: Date.now(),
          });
        });

        tileLayer.on("load", () => {
          setTileLog({
            url: "https://a.basemaps.cartocdn.com/light_all/... (Tile Loaded)",
            event: "load",
            time: Date.now(),
          });
        });

        tileLayer.addTo(leafletMap.current);
        markerRef.current = L.marker([coords.lat, coords.lng]).addTo(
          leafletMap.current,
        );
        setMapLoaded(true);
      } catch (err) {
        console.error("Error initializing map in lab:", err);
      }
    };

    initMap();

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // تحديث الماركر عند تغيير الإحداثيات
  useEffect(() => {
    if (leafletMap.current && mapLoaded) {
      leafletMap.current.setView([coords.lat, coords.lng]);
      if (markerRef.current) {
        markerRef.current.setLatLng([coords.lat, coords.lng]);
      }
    }
  }, [coords, mapLoaded]);

  // 1. اختبار الـ GPS المباشر (Geolocation API)
  const runGpsTest = () => {
    const startTime = Date.now();
    setGpsLog({
      url: "navigator.geolocation.getCurrentPosition",
      method: "NATIVE_CALL",
      reqHeaders: "N/A",
      resHeaders: "N/A",
      statusCode: "PENDING",
      timing: "0ms",
      responseBody: "جاري الطلب من المتصفح...",
      consoleErrors: "N/A",
      statusType: "PENDING",
    });

    if (!navigator.geolocation) {
      setGpsLog({
        url: "navigator.geolocation.getCurrentPosition",
        method: "NATIVE_CALL",
        reqHeaders: "N/A",
        resHeaders: "N/A",
        statusCode: "UNSUPPORTED",
        timing: `${Date.now() - startTime}ms`,
        responseBody: "الجيولكيشن غير مدعوم في هذا المتصفح.",
        consoleErrors: "navigator.geolocation undefined",
        statusType: "FAILED",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const elapsed = Date.now() - startTime;
        const result = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setCoords({ lat: result.lat, lng: result.lng });
        setGpsLog({
          url: "navigator.geolocation.getCurrentPosition",
          method: "NATIVE_CALL",
          reqHeaders: "N/A",
          resHeaders: "N/A",
          statusCode: "SUCCESS (Allowed)",
          timing: `${elapsed}ms`,
          responseBody: JSON.stringify(result, null, 2),
          consoleErrors: "None",
          statusType: "SUCCESS",
        });
      },
      (err) => {
        const elapsed = Date.now() - startTime;
        let errMsg = "خطأ غير معروف";
        if (err.code === 1)
          errMsg =
            "تم رفض إذن تحديد الموقع (Permission Denied) من قبل المستخدم أو السياسة.";
        if (err.code === 2) errMsg = "الموقع غير متاح (Position Unavailable).";
        if (err.code === 3) errMsg = "انتهت مهلة جلب الموقع (Timeout).";

        setGpsLog({
          url: "navigator.geolocation.getCurrentPosition",
          method: "NATIVE_CALL",
          reqHeaders: "N/A",
          resHeaders: "N/A",
          statusCode: `FAILED (Code ${err.code})`,
          timing: `${elapsed}ms`,
          responseBody: errMsg,
          consoleErrors: `GeolocationPositionError: ${err.message}`,
          statusType: "FAILED",
        });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
  };

  // 2. اختبار البحث الجغرافي المباشر (Nominatim Search API)
  const runSearchTest = async () => {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&q=Baghdad&limit=1";
    const startTime = Date.now();
    setSearchLog({
      url,
      method: "GET",
      reqHeaders: "جاري التحضير...",
      resHeaders: "N/A",
      statusCode: "PENDING",
      timing: "0ms",
      responseBody: "جاري الاتصال...",
      consoleErrors: "N/A",
      statusType: "PENDING",
    });

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });
      const elapsed = Date.now() - startTime;

      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });

      const data = await res.json();

      setSearchLog({
        url,
        method: "GET",
        reqHeaders: "Accept: application/json",
        resHeaders: JSON.stringify(headersObj, null, 2),
        statusCode: `${res.status} ${res.statusText}`,
        timing: `${elapsed}ms`,
        responseBody: JSON.stringify(data, null, 2),
        consoleErrors: "None",
        statusType: "SUCCESS",
      });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      setSearchLog({
        url,
        method: "GET",
        reqHeaders: "Accept: application/json",
        resHeaders: "None",
        statusCode: "FAILED / TypeError",
        timing: `${elapsed}ms`,
        responseBody: "فشل استلام الرد. الطلب حظر قبل خروجه من المتصفح.",
        consoleErrors: err.stack || err.message || String(err),
        statusType: "FAILED",
      });
    }
  };

  // 3. اختبار العنونة المعكوسة المباشرة (Nominatim Reverse Geocoding)
  const runReverseTest = async () => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`;
    const startTime = Date.now();
    setReverseLog({
      url,
      method: "GET",
      reqHeaders: "جاري التحضير...",
      resHeaders: "N/A",
      statusCode: "PENDING",
      timing: "0ms",
      responseBody: "جاري الاتصال...",
      consoleErrors: "N/A",
      statusType: "PENDING",
    });

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });
      const elapsed = Date.now() - startTime;

      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });

      const data = await res.json();

      setReverseLog({
        url,
        method: "GET",
        reqHeaders: "Accept: application/json",
        resHeaders: JSON.stringify(headersObj, null, 2),
        statusCode: `${res.status} ${res.statusText}`,
        timing: `${elapsed}ms`,
        responseBody: JSON.stringify(data, null, 2),
        consoleErrors: "None",
        statusType: "SUCCESS",
      });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      setReverseLog({
        url,
        method: "GET",
        reqHeaders: "Accept: application/json",
        resHeaders: "None",
        statusCode: "FAILED / TypeError",
        timing: `${elapsed}ms`,
        responseBody: "فشل استلام الرد. الطلب حظر قبل خروجه من المتصفح.",
        consoleErrors: err.stack || err.message || String(err),
        statusType: "FAILED",
      });
    }
  };

  // 4. اختبار تحديد الـ IP المباشر (IP Geolocation API)
  const runIpTest = async () => {
    const url = "https://ipapi.co/json/";
    const startTime = Date.now();
    setIpLog({
      url,
      method: "GET",
      reqHeaders: "جاري التحضير...",
      resHeaders: "N/A",
      statusCode: "PENDING",
      timing: "0ms",
      responseBody: "جاري الاتصال...",
      consoleErrors: "N/A",
      statusType: "PENDING",
    });

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });
      const elapsed = Date.now() - startTime;

      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });

      const data = await res.json();

      setIpLog({
        url,
        method: "GET",
        reqHeaders: "Accept: application/json",
        resHeaders: JSON.stringify(headersObj, null, 2),
        statusCode: `${res.status} ${res.statusText}`,
        timing: `${elapsed}ms`,
        responseBody: JSON.stringify(data, null, 2),
        consoleErrors: "None",
        statusType: "SUCCESS",
      });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      setIpLog({
        url,
        method: "GET",
        reqHeaders: "Accept: application/json",
        resHeaders: "None",
        statusCode: "FAILED / TypeError",
        timing: `${elapsed}ms`,
        responseBody: "فشل استلام الرد. الطلب حظر قبل خروجه من المتصفح.",
        consoleErrors: err.stack || err.message || String(err),
        statusType: "FAILED",
      });
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8"
      dir="rtl"
    >
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-sky-400">
          🔬 مختبر العزل الهندسي لمنظومة الخرائط والشبكة
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          بيئة اختبار معزولة بالكامل تعمل بنسبة 100% دون أي تبعيات أو كود وسيط
          من المشروع.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Controls & Map */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
              🕹️ أدوات الاختبار المباشرة
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={runGpsTest}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl transition"
              >
                1. فحص GPS المتصفح
              </button>
              <button
                onClick={runSearchTest}
                className="p-3 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl transition"
              >
                2. فحص البحث (Baghdad)
              </button>
              <button
                onClick={runReverseTest}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition"
              >
                3. فحص Reverse Geocode
              </button>
              <button
                onClick={runIpTest}
                className="p-3 bg-violet-600 hover:bg-violet-500 font-bold rounded-xl transition"
              >
                4. فحص IP Geolocation
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
              🗺️ خريطة الفحص الفعلي (Tile Loader)
            </h2>
            <div
              ref={mapRef}
              style={{
                width: "100%",
                height: "350px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            {tileLog && (
              <div className="text-xs bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 font-mono text-emerald-400">
                <div>[حدث البلاطات]: {tileLog.event}</div>
                <div>[الرابط]: {tileLog.url}</div>
                <div>
                  [التوقيت]: {new Date(tileLog.time).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Forensic Logging */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
              📋 السجل الجنائي الرقمي للاتصالات (Forensics Log)
            </h2>

            {/* Render Log details for each action */}
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {[
                { label: "1. إذن وتحديد موقع الـ GPS", log: gpsLog },
                { label: "2. البحث الجغرافي (Search)", log: searchLog },
                { label: "3. العنونة المعكوسة (Reverse)", log: reverseLog },
                { label: "4. تحديد الـ IP Geolocation", log: ipLog },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="border border-slate-800 rounded-xl p-4 bg-slate-950/50 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sky-400 text-sm">
                      {item.label}
                    </span>
                    {item.log && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          item.log.statusType === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.log.statusType === "FAILED"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {item.log.statusCode}
                      </span>
                    )}
                  </div>
                  {item.log ? (
                    <div className="text-[11px] font-mono space-y-1 text-slate-300">
                      <div>
                        <span className="text-slate-500">رابط الطلب:</span>{" "}
                        {item.log.url}
                      </div>
                      <div>
                        <span className="text-slate-500">نوع الطلب:</span>{" "}
                        {item.log.method}
                      </div>
                      <div>
                        <span className="text-slate-500">زمن الاستجابة:</span>{" "}
                        {item.log.timing}
                      </div>
                      <div className="bg-slate-950 p-2 rounded border border-slate-900 mt-1 max-h-32 overflow-y-auto">
                        <span className="text-slate-500 block">
                          الاستجابة المستلمة (Body):
                        </span>
                        <pre className="text-slate-200 mt-1 whitespace-pre-wrap">
                          {item.log.responseBody}
                        </pre>
                      </div>
                      {item.log.consoleErrors !== "None" &&
                        item.log.consoleErrors !== "N/A" && (
                          <div className="bg-red-950/20 border border-red-500/20 p-2 rounded text-red-400 mt-1">
                            <span className="font-bold">
                              أخطاء الكونسول والـ Stack Trace:
                            </span>
                            <pre className="mt-1 whitespace-pre-wrap text-[10px]">
                              {item.log.consoleErrors}
                            </pre>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      بانتظار تشغيل الاختبار...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
