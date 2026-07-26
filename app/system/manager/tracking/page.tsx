"use client";

import { useState, useEffect } from "react";
import {
  getActiveTracking,
  getDriverTrackingLink,
} from "@/app/actions/tracking";

type TicketData = {
  id: number;
  ticketNumber: string;
  truckNumber: string;
  driverName: string;
  currentLat: number | null;
  currentLng: number | null;
  lastLocationAt: Date | null;
  destinationLabel: string | null;
  trackingToken: string | null;
  isStale?: boolean;
};

export default function TrackingMapPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadData = async () => {
    const result = await getActiveTracking();
    if (result.success && result.data) {
      const now = Date.now();
      const mapped = (result.data as unknown as TicketData[]).map((ticket) => ({
        ...ticket,
        isStale: ticket.lastLocationAt
          ? now - new Date(ticket.lastLocationAt).getTime() > 5 * 60 * 1000
          : false,
      }));
      setTickets(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    // تحديث كل 10 ثوانٍ لمواكبة التتبع اللحظي الشاحنات
    const interval = setInterval(loadData, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const copyDriverLink = async (ticketId: number) => {
    const result = await getDriverTrackingLink(ticketId);
    if (result.success && result.link) {
      await navigator.clipboard.writeText(result.link);
      setCopiedId(ticketId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const openOnMap = (lat: number | null, lng: number | null) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    }
  };

  return (
    <div dir="rtl" className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">🗺️ تتبع الشاحنات</h1>
          <p className="text-sm text-slate-400 mt-1">
            الشاحنات النشطة حالياً — يُحدَّث كل دقيقة
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold transition-all"
        >
          🔄 تحديث
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          لا توجد شاحنات نشطة حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((ticket) => {
            const hasLocation = ticket.currentLat && ticket.currentLng;
            const isStale = ticket.isStale;

            return (
              <div
                key={ticket.id}
                className={`rounded-2xl border p-4 space-y-3 ${
                  hasLocation
                    ? isStale
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-emerald-500/30 bg-emerald-500/5"
                    : "border-slate-700 bg-slate-800/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white">{ticket.truckNumber}</p>
                    <p className="text-sm text-slate-400">
                      {ticket.driverName}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-lg font-bold ${
                      hasLocation
                        ? isStale
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {hasLocation ? (isStale ? "بطيء" : "نشط") : "بدون موقع"}
                  </span>
                </div>

                {ticket.destinationLabel && (
                  <p className="text-xs text-slate-400">
                    📍 {ticket.destinationLabel}
                  </p>
                )}

                {ticket.lastLocationAt && (
                  <p className="text-xs text-slate-500">
                    آخر تحديث:{" "}
                    {new Date(ticket.lastLocationAt).toLocaleTimeString(
                      "ar-IQ",
                    )}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() =>
                      openOnMap(ticket.currentLat, ticket.currentLng)
                    }
                    disabled={!hasLocation}
                    className="flex-1 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    🗺️ الموقع الحالي
                  </button>
                  <button
                    onClick={() => copyDriverLink(ticket.id)}
                    className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold transition-all"
                  >
                    {copiedId === ticket.id ? "✅ نُسخ" : "📋 رابط السائق"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
