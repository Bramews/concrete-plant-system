"use client";

import { Icons } from "@/components/ui/Icons";
import { NumInput } from "@/components/ui/NumInput";

interface MixTrialResultsProps {
  labResults: any;
  setLabResults: (r: any) => void;
  results: any;
  dict: any;
  readOnly?: boolean;
}

export function MixTrialResults({
  labResults,
  setLabResults,
  results,
  dict,
  readOnly,
}: MixTrialResultsProps) {
  const update = (field: string, val: any) => {
    setLabResults((prev: any) => ({ ...prev, [field]: val }));
  };

  const updateInterval = (index: number, field: string, val: any) => {
    const newIntervals = [...labResults.intervals];
    newIntervals[index] = { ...newIntervals[index], [field]: val };
    update("intervals", newIntervals);
  };

  return (
    <div
      className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500"
      dir="rtl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Direct Lab Entries */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest border-r-2 border-indigo-500 pr-3">
            نتائج الفحص المباشرة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5">
            {[
              {
                label: "قيمة الهبوط (Slump Initial)",
                value: labResults.slumpInitial,
                field: "slumpInitial",
                icon: Icons.Droplet,
                unit: "mm",
              },
              {
                label: "درجة الحرارة (Ambient Temp)",
                value: labResults.ambientTemp,
                field: "ambientTemp",
                icon: Icons.Sun,
                unit: "°C",
              },
              {
                label: "الكثافة الطازجة (Fresh Density)",
                value: labResults.freshDensity,
                field: "freshDensity",
                icon: Icons.Activity,
                unit: "kg/m³",
              },
              {
                label: "نسبة الهواء المقاسة (Air %)",
                value: labResults.airMeasured,
                field: "airMeasured",
                icon: Icons.Globe,
                unit: "%",
              },
            ].map((f, i) => (
              <div key={i} className="group">
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest px-1 uppercase">
                  {f.label}
                </label>
                <div className="relative">
                  <f.icon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 transition-colors group-focus-within:text-indigo-500" />
                  <NumInput
                    value={f.value}
                    onChange={(v) => update(f.field, v)}
                    disabled={readOnly}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pr-12 pl-6 text-xl font-black text-white western-nums tabular-nums outline-none focus:bg-white/10 transition-all focus:border-indigo-500/50"
                  />
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase tracking-widest pointer-events-none">
                    {f.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interval Slump Loss */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest border-r-2 border-indigo-500 pr-3">
            فقدان الهبوط عبر الزمن (Slump Loss)
          </h3>
          <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2">
              <span>الوقت (Min)</span>
              <span className="text-center">الهبوط (mm)</span>
              <span className="text-left">الحرارة (°C)</span>
            </div>
            {labResults.intervals.map((interval: any, index: number) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-4 items-center bg-white/[0.02] border border-white/5 p-3 rounded-2xl hover:bg-white/5 transition-all"
              >
                <div className="text-xs font-black western-nums bg-white/5 px-2 py-1 rounded text-slate-400">
                  {interval.time}
                </div>
                <NumInput
                  value={interval.slump}
                  onChange={(v) => updateInterval(index, "slump", v)}
                  disabled={readOnly}
                  className="bg-transparent border-0 border-b border-white/5 focus:border-white/20 text-center font-black western-nums text-white text-sm"
                />
                <NumInput
                  value={interval.temp}
                  onChange={(v) => updateInterval(index, "temp", v)}
                  disabled={readOnly}
                  className="bg-transparent border-0 border-b border-white/5 focus:border-white/20 text-left font-black western-nums text-indigo-400 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
