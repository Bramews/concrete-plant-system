"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";

interface TransitTimerBadgeProps {
  dispatchedAt: Date | string | null;
  status?: string;
  ticketNumber?: string;
  truckNumber?: string;
  showDetails?: boolean;
}

export function TransitTimerBadge({
  dispatchedAt,
  status,
  ticketNumber,
  truckNumber,
  showDetails = false,
}: TransitTimerBadgeProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  useEffect(() => {
    if (!dispatchedAt) return;

    const calculateElapsed = () => {
      const start = new Date(dispatchedAt).getTime();
      const now = Date.now();
      const diffMinutes = Math.max(0, Math.floor((now - start) / (1000 * 60)));
      setElapsedMinutes(diffMinutes);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 10_000); // تحديث كل 10 ثوانٍ
    return () => clearInterval(interval);
  }, [dispatchedAt]);

  if (!dispatchedAt) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400">
        <Clock className="w-3 h-3" />
        لم تنطلق بعد
      </span>
    );
  }

  // إذا كانت الشحنة تم تسليمها بالفعل
  if (status === "DELIVERED" || status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" />
        تم التسليم ({elapsedMinutes} دقيقة)
      </span>
    );
  }

  // الحالة 1: خطر تصلب حرج (> 90 دقيقة)
  if (elapsedMinutes >= 90) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-red-600/20 text-red-400 border border-red-500/50 shadow-lg shadow-red-600/20 animate-pulse ${
          showDetails ? "p-3 rounded-2xl w-full justify-between" : ""
        }`}
      >
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 animate-bounce" />
          <span>خطر تصلب الخرسانة! ({elapsedMinutes} دقيقة)</span>
        </div>
        {showDetails && (
          <span className="text-[10px] bg-red-950/80 px-2 py-0.5 rounded text-red-300 font-mono">
            تجاوز حد 90 دقيقة
          </span>
        )}
      </div>
    );
  }

  // الحالة 2: تحذير اقتراب انتهاء زمن الخلط (60 - 89 دقيقة)
  if (elapsedMinutes >= 60) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10 ${
          showDetails ? "p-3 rounded-2xl w-full justify-between" : ""
        }`}
      >
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>تحذير نقل: {elapsedMinutes} دقيقة (متبقي {90 - elapsedMinutes} د)</span>
        </div>
        {showDetails && (
          <span className="text-[10px] bg-amber-950/80 px-2 py-0.5 rounded text-amber-200">
            اقتراب حد التصلب
          </span>
        )}
      </div>
    );
  }

  // الحالة 3: زمن طبيعي ممتاز (< 60 دقيقة)
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 ${
        showDetails ? "p-3 rounded-2xl w-full justify-between" : ""
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>في الطريق: {elapsedMinutes} دقيقة</span>
      </div>
      {showDetails && (
        <span className="text-[10px] text-slate-400">
          صلاحية ممتازة ({90 - elapsedMinutes} د متبقية)
        </span>
      )}
    </div>
  );
}
