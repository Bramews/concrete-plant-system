"use client";

import { useState } from "react";
import { updateSystemSettings } from "@/app/actions/settings";
import { toast } from "sonner";
import { Activity, Check, Loader2 } from "lucide-react";

export default function CongestionManager({
  initialMin,
  initialMax,
  lang,
}: {
  initialMin: number;
  initialMax: number;
  lang: string;
}) {
  const [minVal, setMinVal] = useState<number>(initialMin);
  const [maxVal, setMaxVal] = useState<number>(initialMax);
  const [isSaving, setIsSaving] = useState(false);

  const isAr = lang === "ar";

  const handleSave = async () => {
    if (minVal >= maxVal) {
      toast.error(
        isAr
          ? "يجب أن يكون الحد الأدنى أقل من الحد الأقصى"
          : "Minimum threshold must be less than maximum capacity",
      );
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateSystemSettings({
        congestion_min: String(minVal),
        congestion_max: String(maxVal),
      });
      if (res.success) {
        toast.success(
          isAr
            ? "تم حفظ حدود طاقة المحطة بنجاح"
            : "Capacity ranges saved successfully",
        );
      } else {
        toast.error("Failed to save settings");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="glass-panel w-full"
      style={{ padding: "1.5rem" }}
      dir={isAr ? "rtl" : "ltr"}
    >
      <h3 className="text-card-title text-white mb-2 flex items-center gap-2">
        <Activity className="w-5 h-5 text-indigo-400" />
        {isAr
          ? "نطاق زخم وطاقة العمل اليومية (m³)"
          : "Daily Pumping Load & Capacity Range (m³)"}
      </h3>
      <p className="text-caption text-slate-300 mb-6">
        {isAr
          ? "حدد نطاق كميات الصب اليومي (بالأمتار المكعبة) لتحديد مستوى زخم المحطة تلقائياً بناءً على مجموع طلبيات الصب الفعلية المجدولة لكل يوم."
          : "Set the daily production range in cubic meters to automatically calculate daily load based on scheduled order volumes."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
        {/* Min Congestion (From) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-300">
            {isAr
              ? "الحد الأدنى للزخم (من - م³):"
              : "Minimum Load Start (From - m³):"}
          </label>
          <input
            type="number"
            min="0"
            value={minVal}
            onChange={(e) =>
              setMinVal(Math.max(0, parseInt(e.target.value) || 0))
            }
            className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 font-mono font-bold"
          />
          <span className="text-[10px] text-slate-400">
            {isAr
              ? "أي كمية صب يومية أقل من هذا الحد تظهر باللون الأخضر (متاح)."
              : "Daily volumes below this show as Green (low load)."}
          </span>
        </div>

        {/* Max Congestion (To) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-300">
            {isAr
              ? "الحد الأقصى للزخم (إلى - م³):"
              : "Maximum Plant Capacity (To - m³):"}
          </label>
          <input
            type="number"
            min="1"
            value={maxVal}
            onChange={(e) =>
              setMaxVal(Math.max(1, parseInt(e.target.value) || 0))
            }
            className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 font-mono font-bold"
          />
          <span className="text-[10px] text-slate-400">
            {isAr
              ? "الكميات بين الحدين تظهر باللون الأصفر (متوسط)، وفوق الحد الأقصى باللون الأحمر (مزدحم)."
              : "Volumes between min and max show as Yellow (moderate), above max as Red (busy)."}
          </span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all mt-6 w-full sm:w-auto"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        <span>{isAr ? "حفظ نطاق الطاقة" : "Save Range Settings"}</span>
      </button>
    </div>
  );
}
