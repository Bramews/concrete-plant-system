"use client";
import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { runSimulation } from "@/app/actions/manager";
import { motion, AnimatePresence } from "framer-motion";

interface QuickSimulatorProps {
  dict: Record<string, string>;
}

export function QuickSimulator({ dict }: QuickSimulatorProps) {
  const [mix, setMix] = useState("");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | "OK" | "RISK" | "FAIL">(null);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<string[]>([]);

  const handleSimulate = async () => {
    if (!mix || !qty) return;
    setLoading(true);
    setResult(null);
    setDetails([]);
    setMessage("");

    try {
      const res = await runSimulation(mix, parseInt(qty));
      setResult(
        res.result === "possible"
          ? "OK"
          : res.result === "risky"
            ? "RISK"
            : "FAIL",
      );

      if (res.result === "possible") {
        setMessage(dict.result_possible || "المواد كافية ✓");
      } else if (res.result === "risky") {
        setMessage(dict.result_risky || "تحذير: مواد منخفضة");
        setDetails([dict.result_risky_desc || "الاحتياطي منخفض"]);
      } else {
        setMessage(dict.result_impossible || "مواد غير كافية");
        let reason = res.blockingMaterial || "غير معروف";
        if (reason.startsWith("ERR_STOCK_ZERO_"))
          reason = `${dict.err_stock_zero} (${reason.replace("ERR_STOCK_ZERO_", "")})`;
        else if (reason.startsWith("ERR_MAT_MISSING_"))
          reason = `${dict.err_mat_missing} (${reason.replace("ERR_MAT_MISSING_", "")})`;
        else if (reason === "mix_data_corrupt")
          reason = dict.err_mix_data || "بيانات الخلطة تالفة";
        setDetails([
          `${dict.blocking || "العائق"}: ${reason}`,
          `${dict.deficit || "العجز"}: ${res.deficitKg.toFixed(1)} ${dict.vol_unit || "كغ"}`,
        ]);
      }
    } catch {
      setResult("FAIL");
      setMessage("خطأ في النظام");
    } finally {
      setLoading(false);
    }
  };

  const resultConfig = {
    OK: {
      bg: "bg-emerald-500/10 border-emerald-500/20",
      icon: <Icons.CheckCircle className="w-5 h-5 text-emerald-400" />,
      text: "text-emerald-400",
      label: "نجاح",
    },
    RISK: {
      bg: "bg-amber-500/10 border-amber-500/20",
      icon: <Icons.AlertCircle className="w-5 h-5 text-amber-400" />,
      text: "text-amber-400",
      label: "تحذير",
    },
    FAIL: {
      bg: "bg-rose-500/10 border-rose-500/20",
      icon: <Icons.XCircle className="w-5 h-5 text-rose-400" />,
      text: "text-rose-400",
      label: "فشل",
    },
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Icons.Dashboard className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">
            {dict.title || "محاكي سريع"}
          </h3>
          <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-wider">
            {dict.subtitle || "Material Projection"}
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-sm font-bold font-black text-slate-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
            <Icons.Ticket className="w-3 h-3" /> {dict.mix_code || "كود الخلطة"}
          </label>
          <input
            type="text"
            placeholder="مثال: C30"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 ring-violet-500/30 focus:border-violet-500/40 transition-all font-mono placeholder:text-slate-600"
            value={mix}
            onChange={(e) => setMix(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-bold font-black text-slate-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
            <Icons.Box className="w-3 h-3" /> {dict.vol || "الحجم (م³)"}
          </label>
          <input
            type="number"
            placeholder="0"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 ring-violet-500/30 focus:border-violet-500/40 transition-all font-mono placeholder:text-slate-600"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={handleSimulate}
        disabled={loading || !mix || !qty}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl text-sm transition-all flex justify-center items-center gap-2 shadow-lg shadow-violet-500/20"
      >
        {loading ? (
          <Icons.Loader className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {dict.sim_btn || "تشغيل المحاكاة"}
            <Icons.ChevronRight className="w-4 h-4 rotate-180" />
          </>
        )}
      </button>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`mt-4 p-4 rounded-xl border ${resultConfig[result].bg}`}
          >
            <div className="flex items-center gap-3 mb-2">
              {resultConfig[result].icon}
              <span
                className={`font-black text-sm ${resultConfig[result].text}`}
              >
                {message}
              </span>
            </div>
            {details.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {details.map((d, i) => (
                  <p
                    key={i}
                    className="text-sm font-bold text-slate-400 bg-white/[0.04] px-3 py-2 rounded-lg font-medium border border-white/[0.05]"
                  >
                    {d}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
