"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

/**
 * هذه الصفحة تُفتح على هاتف السائق.
 * لا تتطلب تسجيل دخول.
 * تقرأ موقع السائق وترسله للخادم كل 30 ثانية.
 * وتعرض له خريطة للوجهة.
 */

interface TicketInfo {
  truckNumber: string;
  destinationLat?: number;
  destinationLng?: number;
  destinationLabel?: string;
}

export default function DriverTrackingPage() {
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<"WAITING" | "TRACKING" | "ERROR">(
    "WAITING",
  );
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const watchIdRef = useRef<number | null>(null);

  // جلب معلومات التذكرة
  useEffect(() => {
    fetch(`/api/tracking/location?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTicketInfo(data.ticket);
      });
  }, [token]);

  // إرسال الموقع بشكل مستمر وآني
  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatus("ERROR");
      return;
    }

    setStatus("TRACKING");

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await fetch("/api/tracking/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              source: "DRIVER_GPS",
            }),
          });
          setLastUpdate(new Date().toLocaleTimeString("ar-IQ"));
        } catch (err) {
          console.error("Failed to send tracking update:", err);
        }
      },
      () => setStatus("ERROR"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );

    watchIdRef.current = watchId;
  };

  // فتح الخريطة للوجهة
  const openDestination = () => {
    if (ticketInfo?.destinationLat && ticketInfo?.destinationLng) {
      window.open(
        `https://www.google.com/maps/dir/current+location/${ticketInfo.destinationLat},${ticketInfo.destinationLng}`,
        "_blank",
      );
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-6 gap-6"
    >
      {/* شعار */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl">
        🚚
      </div>

      <h1 className="text-xl font-black text-center">نظام تتبع الشاحنة</h1>

      {ticketInfo && (
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-4 w-full max-w-sm text-center space-y-2">
          <p className="text-sm text-slate-400">رقم التذكرة</p>
          <p className="font-black text-white text-lg">
            {ticketInfo.truckNumber}
          </p>
          {ticketInfo.destinationLabel && (
            <>
              <p className="text-sm text-slate-400 mt-3">الوجهة</p>
              <p className="font-bold text-indigo-400">
                {ticketInfo.destinationLabel}
              </p>
            </>
          )}
        </div>
      )}

      {/* زر بدء التتبع */}
      {status === "WAITING" && (
        <button
          onClick={startTracking}
          className="w-full max-w-sm py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-lg transition-all active:scale-95"
        >
          ابدأ مشاركة الموقع 📍
        </button>
      )}

      {status === "TRACKING" && (
        <div className="space-y-3 w-full max-w-sm">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-emerald-400 font-bold">جاري مشاركة الموقع</p>
            </div>
            {lastUpdate && (
              <p className="text-xs text-slate-400 mt-2">
                آخر تحديث: {lastUpdate}
              </p>
            )}
          </div>

          {ticketInfo?.destinationLat && (
            <button
              onClick={openDestination}
              className="w-full py-4 rounded-2xl bg-slate-700 hover:bg-slate-600 font-bold transition-all active:scale-95"
            >
              🗺️ فتح الوجهة في الخريطة
            </button>
          )}
        </div>
      )}

      {status === "ERROR" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center text-red-400">
          تعذّر الوصول لموقعك. تأكد من السماح للمتصفح بالموقع.
        </div>
      )}

      <p className="text-xs text-slate-600 text-center max-w-xs">
        هذا الرابط خاص بك. لا تشاركه مع أحد. يُرسل موقعك كل 30 ثانية للنظام.
      </p>
    </div>
  );
}
