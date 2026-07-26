"use client";

import { Icons } from "@/components/ui/Icons";
import { NumInput } from "@/components/ui/NumInput";

interface MixStrengthHistoryProps {
  strengthMetadata: any;
  setStrengthMetadata: (m: any) => void;
  strengthResults: any[];
  setStrengthResults: (r: any[]) => void;
  results: any;
  dict: any;
  readOnly?: boolean;
}

export function MixStrengthHistory({
  strengthMetadata,
  setStrengthMetadata,
  strengthResults,
  setStrengthResults,
  results,
  dict,
  readOnly,
}: MixStrengthHistoryProps) {
  const updateMeta = (field: string, val: any) => {
    setStrengthMetadata((prev: any) => ({ ...prev, [field]: val }));
  };

  const updateStrength = (index: number, field: string, val: any) => {
    const newResults = [...strengthResults];
    newResults[index] = { ...newResults[index], [field]: val };
    setStrengthResults(newResults);
  };

  return (
    <div
      className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500"
      dir="rtl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Design Strength & Conditions */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest border-r-2 border-indigo-500 pr-3">
            مستهدفات المقاومة والظروف
          </h3>
          <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 space-y-8">
            <div className="group">
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest px-1">
                المقاومة المطلوبة (Target Strength)
              </label>
              <div className="relative">
                <Icons.Target className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 transition-colors group-focus-within:text-indigo-500" />
                <NumInput
                  value={strengthMetadata.requiredStrength}
                  onChange={(v) => updateMeta("requiredStrength", v)}
                  disabled={readOnly}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pr-12 pl-6 text-xl font-black text-white western-nums tabular-nums outline-none focus:bg-white/10 transition-all focus:border-indigo-500/50"
                />
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase tracking-widest pointer-events-none">
                  MPa
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                ظروف الإنضاج (Curing Conditions)
              </label>
              <textarea
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/10 transition-all min-h-[100px] placeholder:text-slate-700"
                value={strengthMetadata.curingConditions}
                onChange={(e) => updateMeta("curingConditions", e.target.value)}
                disabled={readOnly}
                placeholder="Standard Lab Curing, etc..."
              />
            </div>
          </div>
        </div>

        {/* Strength Progression Table */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest border-r-2 border-indigo-500 pr-3">
            تطور المقاومة عبر الزمن (Compressive Strength)
          </h3>
          <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 space-y-4">
            <div className="grid grid-cols-4 gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2">
              <span>العمر</span>
              <span className="text-center">نموذج 1</span>
              <span className="text-center">نموذج 2</span>
              <span className="text-left font-black text-emerald-400">
                المتوسط
              </span>
            </div>
            {strengthResults.map((res: any, index: number) => (
              <div
                key={index}
                className="grid grid-cols-4 gap-4 items-center bg-white/[0.02] border border-white/5 p-3 rounded-2xl hover:bg-white/5 transition-all"
              >
                <div className="text-xs font-black western-nums bg-white/5 px-2 py-1 rounded text-slate-400">
                  {res.age}
                </div>
                <NumInput
                  value={res.s1}
                  onChange={(v) => updateStrength(index, "s1", v)}
                  disabled={readOnly}
                  className="bg-transparent border-0 border-b border-white/5 focus:border-white/20 text-center font-black western-nums text-white text-sm"
                />
                <NumInput
                  value={res.s2}
                  onChange={(v) => updateStrength(index, "s2", v)}
                  disabled={readOnly}
                  className="bg-transparent border-0 border-b border-white/5 focus:border-white/20 text-center font-black western-nums text-white text-sm"
                />
                <div className="text-left text-sm font-black western-nums text-emerald-400">
                  {((Number(res.s1) + Number(res.s2)) / 2).toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
