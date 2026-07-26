"use client";

import { Icons } from "@/components/ui/Icons";
import { NumInput } from "@/components/ui/NumInput";

interface MixWeightsProps {
  materials: any;
  setMaterials: (m: any) => void;
  results: any;
  dict: any;
  readOnly?: boolean;
}

export function MixWeights({
  materials,
  setMaterials,
  results,
  dict,
  readOnly,
}: MixWeightsProps) {
  const updateMat = (key: string, field: string, val: number | null) => {
    setMaterials((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], [field]: val },
    }));
  };

  const rowCls =
    "grid grid-cols-12 gap-4 items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.04] transition-all relative overflow-hidden";

  return (
    <div
      className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
      dir="rtl"
    >
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest border-r-2 border-indigo-500 pr-3">
          أوزان مكونات الخلطة (SSD weights)
        </h3>
        <div className="flex gap-4">
          <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 western-nums tabular-nums">
            Total Volume: {results?.summary?.volume?.toFixed(3) || "0.000"} m³
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Cementitious Section */}
        <div className="p-6 bg-slate-900/40 rounded-[2rem] border border-white/5 space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
            المواد الإسمنتية (Cementitious)
          </h4>

          {[
            { id: "cement", label: "إسمنت بورتلاندي", color: "text-slate-200" },
            {
              id: "microsilica",
              label: "مايكروسيليكا",
              color: "text-indigo-300",
            },
            {
              id: "ggbfs",
              label: "خبث الأفران (GGBFS)",
              color: "text-emerald-300",
            },
            {
              id: "flyAsh",
              label: "الرماد المتطاير (Fly Ash)",
              color: "text-amber-300",
            },
          ].map((mat: any) => (
            <div key={mat.id} className={rowCls}>
              <div className="col-span-1 p-2 bg-white/5 rounded-lg text-slate-500 transition-colors group-hover:text-white">
                <Icons.Box className="w-4 h-4" />
              </div>
              <div className="col-span-3">
                <p className={`text-xs font-black ${mat.color}`}>{mat.label}</p>
                <p className="text-[8px] font-bold text-slate-500 western-nums tabular-nums uppercase">
                  SG: {materials[mat.id]?.sg || "---"}
                </p>
              </div>
              <div className="col-span-4">
                <NumInput
                  value={materials[mat.id]?.weight}
                  onChange={(v) => updateMat(mat.id, "weight", v)}
                  disabled={readOnly}
                  className="bg-slate-950/50 border-white/5 text-sm font-black western-nums text-center"
                  placeholder="الوزن (kg)"
                />
              </div>
              <div className="col-span-4 text-left px-4">
                <p className="text-lg font-black text-slate-500 western-nums tabular-nums">
                  {results?.components?.[mat.id]?.volume?.toFixed(4) ||
                    "0.0000"}{" "}
                  <span className="text-[8px] opacity-40">m³</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Aggregates Section */}
        <div className="p-6 bg-slate-900/40 rounded-[2rem] border border-white/5 space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
            الركام (Aggregates)
          </h4>

          {[
            {
              id: "sand",
              label: "رمل مغسول (0-4.75)",
              color: "text-amber-500",
            },
            { id: "ca10mm", label: "حصى 10 ملم", color: "text-slate-400" },
            { id: "ca20mm", label: "حصى 20 ملم", color: "text-slate-300" },
          ].map((mat: any) => (
            <div key={mat.id} className={rowCls}>
              <div className="col-span-4">
                <p className={`text-xs font-black ${mat.color}`}>{mat.label}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-[8px] font-bold text-slate-500 western-nums uppercase">
                    SG: {materials[mat.id]?.sg || "---"}
                  </span>
                  <span className="text-[8px] font-bold text-slate-500 western-nums uppercase">
                    Abs: {materials[mat.id]?.absorption || "---"}%
                  </span>
                </div>
              </div>
              <div className="col-span-4">
                <NumInput
                  value={materials[mat.id]?.weight}
                  onChange={(v) => updateMat(mat.id, "weight", v)}
                  disabled={readOnly}
                  className="bg-slate-950/50 border-white/5 text-sm font-black western-nums text-center"
                  placeholder="الوزن (kg)"
                />
              </div>
              <div className="col-span-4 text-left px-4">
                <p className="text-lg font-black text-slate-500 western-nums tabular-nums">
                  {results?.components?.[mat.id]?.volume?.toFixed(4) ||
                    "0.0000"}{" "}
                  <span className="text-[8px] opacity-40">m³</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
