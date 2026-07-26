"use client";

import { useState } from "react";
import { updateSubscriptionDates } from "@/app/actions/admin-billing";
import { Icons } from "@/components/ui/Icons";

interface SubscriptionManagerProps {
  companyId: number;
  currentStart: Date;
  currentEnd: Date | null;
}

// Helper: format ISO date string → "DD MMM YYYY" in English always
function formatDateDisplay(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Helper: how many days remain
function daysRemaining(isoEnd: string): number {
  if (!isoEnd) return 0;
  const end = new Date(isoEnd).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / 86_400_000));
}

export function SubscriptionManager({
  companyId,
  currentStart,
  currentEnd,
}: SubscriptionManagerProps) {
  const [startDate, setStartDate] = useState(
    currentStart ? new Date(currentStart).toISOString().split("T")[0] : "",
  );
  const [endDate, setEndDate] = useState(
    currentEnd ? new Date(currentEnd).toISOString().split("T")[0] : "",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleUpdate = async () => {
    if (!startDate || !endDate) {
      setMessage({
        type: "error",
        text: "يرجى تحديد تاريخَي البدء والانتهاء.",
      });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await updateSubscriptionDates(
        companyId,
        new Date(startDate),
        new Date(endDate),
      );
      if (res.success) {
        setMessage({ type: "success", text: "تم تحديث الاشتراك بنجاح." });
      } else {
        setMessage({ type: "error", text: res.error || "فشل التحديث." });
      }
    } catch {
      setMessage({ type: "error", text: "حدث خطأ غير متوقع." });
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (months: number) => {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + months);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    setMessage(null);
  };

  const remaining = endDate ? daysRemaining(endDate) : 0;
  const isExpired = endDate ? new Date(endDate) < new Date() : false;

  const presets = [
    { label: "شهر", months: 1 },
    { label: "3 أشهر", months: 3 },
    { label: "6 أشهر", months: 6 },
    { label: "سنة", months: 12 },
  ];

  return (
    <div className="space-y-4">
      {/* Current dates summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 rounded-xl p-3 border border-white/5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            بداية الاشتراك
          </div>
          <div className="text-sm font-bold text-white font-mono" dir="ltr">
            {startDate ? formatDateDisplay(startDate) : "—"}
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 border border-white/5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            نهاية الاشتراك
          </div>
          <div
            className={`text-sm font-bold font-mono ${isExpired ? "text-red-400" : "text-white"}`}
            dir="ltr"
          >
            {endDate ? formatDateDisplay(endDate) : "—"}
          </div>
          {endDate && !isExpired && (
            <div
              className="text-[10px] text-emerald-400 mt-0.5 font-mono"
              dir="ltr"
            >
              {remaining} يوم متبقٍ
            </div>
          )}
          {isExpired && (
            <div className="text-[10px] text-red-400 mt-0.5">
              منتهي الصلاحية
            </div>
          )}
        </div>
      </div>

      {/* Quick presets */}
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          تمديد سريع من اليوم
        </div>
        <div className="grid grid-cols-4 gap-2">
          {presets.map((p) => (
            <button
              key={p.months}
              type="button"
              onClick={() => setPreset(p.months)}
              className="text-[11px] font-bold py-2 rounded-lg bg-white/5 hover:bg-blue-500/15 hover:text-blue-300 text-slate-400 border border-white/5 hover:border-blue-500/20 transition-all"
            >
              +{p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date inputs — forced LTR + lang en to prevent Hindi numerals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            htmlFor="sub-start"
            className="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
          >
            تاريخ البدء
          </label>
          <input
            id="sub-start"
            type="date"
            lang="en"
            dir="ltr"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setMessage(null);
            }}
            className="w-full bg-slate-800 border border-white/8 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all [color-scheme:dark]"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="sub-end"
            className="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
          >
            تاريخ الانتهاء
          </label>
          <input
            id="sub-end"
            type="date"
            lang="en"
            dir="ltr"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setMessage(null);
            }}
            className="w-full bg-slate-800 border border-white/8 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Feedback message */}
      {message && (
        <div
          className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border ${
            message.type === "success"
              ? "bg-emerald-500/8 text-emerald-400 border-emerald-500/15"
              : "bg-red-500/8 text-red-400 border-red-500/15"
          }`}
        >
          {message.type === "success" ? (
            <Icons.CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          ) : (
            <Icons.XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleUpdate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-40 text-white text-sm font-bold py-2.5 rounded-xl transition-all"
      >
        {loading ? (
          <Icons.Loader className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Icons.Calendar className="w-4 h-4" />
            تطبيق التواريخ
          </>
        )}
      </button>
    </div>
  );
}
