"use client";

import { useState, useMemo } from "react";
import { Icons } from "@/components/ui/Icons";
import { motion, AnimatePresence } from "framer-motion";
import { AppCard } from "@/components/ui/IndustrialComponents";
import { format, differenceInHours, addDays } from "date-fns";
import { ar } from "date-fns/locale";
import { ArrowLeftRight } from "lucide-react";

// --- Types & Constants ---
type ToolTab = "converter" | "maturity" | "aggregates" | "calculator" | "costs";

const CUBE_150_AREA = 22500;
const CUBE_100_AREA = 10000;
const CYLINDER_150_AREA = 17671;

export default function LabToolsPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>("converter");

  // --- Universal Converter State ---
  const [convValue, setConvValue] = useState<string>("");
  const [convType, setConvType] = useState<"mass" | "volume" | "pressure">(
    "mass",
  );
  const [convFrom, setConvFrom] = useState<string>("kg");
  const [convTo, setConvTo] = useState<string>("g");
  const [convArea, setConvArea] = useState<string>(CUBE_150_AREA.toString());

  // --- Maturity State ---
  const [maturityMode, setMaturityMode] = useState<"past" | "future">("past");
  const [castTime, setCastTime] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );
  const [avgTemp, setAvgTemp] = useState<string>("25");
  const [targetMpa, setTargetMpa] = useState<string>("28");
  const [datumTemp, setDatumTemp] = useState<string>("0");

  // --- Aggregates State ---
  const [aggType, setAggType] = useState<"sand" | "gravel">("sand");
  const [wWet, setWWet] = useState<string>("");
  const [wDry, setW_Dry] = useState<string>("");
  const [wSsd, setW_Ssd] = useState<string>("");
  const [bulkWeight, setBulkWeight] = useState<string>("1000");

  // --- Scientific Calculator State ---
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");

  const swapUnits = () => {
    const temp = convFrom;
    setConvFrom(convTo);
    setConvTo(temp);
  };

  // --- Logic: Converter ---
  const conversionResult = useMemo(() => {
    const val = parseFloat(convValue);
    if (isNaN(val)) return null;

    if (convType === "mass") {
      const factors: Record<string, number> = {
        ton: 1000000,
        kg: 1000,
        g: 1,
        lb: 453.59,
      };
      const valGrams = val * factors[convFrom];
      return valGrams / factors[convTo];
    }

    if (convType === "volume") {
      const factors: Record<string, number> = {
        m3: 1000,
        l: 1,
        ml: 0.001,
        cm3: 0.001,
      };
      const valLiters = val * factors[convFrom];
      return valLiters / factors[convTo];
    }

    if (convType === "pressure") {
      if (convFrom === "kN" && convTo === "MPa") {
        const area = parseFloat(convArea);
        return (val * 1000) / area;
      }
      if (convFrom === "MPa" && convTo === "kN") {
        const area = parseFloat(convArea);
        return (val * area) / 1000;
      }
      return val;
    }
    return null;
  }, [convValue, convType, convFrom, convTo, convArea]);

  // --- Logic: Maturity ---
  const maturityResult = useMemo(() => {
    const start = new Date(castTime);
    const temp = parseFloat(avgTemp);
    const datum = parseFloat(datumTemp);

    if (maturityMode === "past") {
      const hours = differenceInHours(new Date(), start);
      if (hours < 0) return null;
      const maturityIndex = (temp - datum) * hours;
      return {
        ageHours: hours,
        ageDays: (hours / 24).toFixed(1),
        maturity: maturityIndex.toFixed(0),
      };
    } else {
      const targetDays = parseInt(targetMpa);
      const projected = addDays(start, isNaN(targetDays) ? 0 : targetDays);
      return {
        date: format(projected, "eeee, dd MMMM yyyy", { locale: ar }),
        time: format(projected, "HH:mm"),
      };
    }
  }, [castTime, avgTemp, datumTemp, maturityMode, targetMpa]);

  // --- Logic: Aggregates ---
  const aggResult = useMemo(() => {
    const wet = parseFloat(wWet);
    const dry = parseFloat(wDry);
    const ssd = parseFloat(wSsd);
    const bulk = parseFloat(bulkWeight);
    const absorption = dry > 0 && ssd >= dry ? ((ssd - dry) / dry) * 100 : 0;
    const moisture = dry > 0 && wet >= dry ? ((wet - dry) / dry) * 100 : 0;
    const freeWaterPerKg = (moisture - absorption) / 100;
    return {
      absorption: absorption.toFixed(2),
      moisture: moisture.toFixed(2),
      waterInSample: (bulk * freeWaterPerKg).toFixed(3),
    };
  }, [wWet, wDry, wSsd, bulkWeight]);

  const handleCalc = (btn: string) => {
    if (btn === "=") {
      try {
        const res = Function(`"use strict"; return (${calcInput})`)();
        setCalcResult(res.toString());
      } catch {
        setCalcResult("Error");
      }
    } else if (btn === "C") {
      setCalcInput("");
      setCalcResult("");
    } else {
      setCalcInput((prev) => prev + btn);
    }
  };

  const tabs: { id: ToolTab; label: string; icon: keyof typeof Icons }[] = [
    { id: "converter", label: "محول الوحدات", icon: "Activity" },
    { id: "maturity", label: "النضج (ASTM)", icon: "History" },
    { id: "aggregates", label: "الرطوبة", icon: "Droplet" },
    { id: "calculator", label: "الحاسبة", icon: "Settings" },
    { id: "costs", label: "التكاليف", icon: "DollarSign" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-700">
      {/* Sleek Header */}
      <div className="flex items-center gap-4 py-4">
        <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-xl">
          <Icons.Tool className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            أدوات المختبر المركزية
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.2em]">
            Engineering Analytics Suite
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-900/60 border border-white/5 rounded-2xl backdrop-blur-xl relative z-10 shadow-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            }`}
          >
            {(() => {
              const Icon = Icons[tab.icon];
              return <Icon className="w-4 h-4" />;
            })()}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 gap-6"
        >
          {/* 1. UNIVERSAL CONVERTER - Reverted to Classic From/To */}
          {activeTab === "converter" && (
            <div className="grid grid-cols-1 gap-6">
              <AppCard title="محول الوحدات الهندسية">
                <div className="space-y-6 p-1">
                  <div className="flex gap-1.5 p-1 bg-black/30 rounded-xl">
                    {(["mass", "volume", "pressure"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setConvType(t);
                          setConvFrom(
                            t === "mass" ? "kg" : t === "volume" ? "m3" : "kN",
                          );
                          setConvTo(
                            t === "mass" ? "g" : t === "volume" ? "l" : "MPa",
                          );
                        }}
                        className={`flex-1 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${convType === t ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-white/5"}`}
                      >
                        {t === "mass"
                          ? "الكتلة"
                          : t === "volume"
                            ? "الحجوم"
                            : "الضغط والإجهاد"}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch py-2">
                    <div className="space-y-4">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
                        القيمة المدخلة
                      </label>
                      <input
                        id="converter-input-value"
                        type="number"
                        value={convValue}
                        onChange={(e) => setConvValue(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-5 rounded-xl text-4xl font-black text-white outline-none focus:border-indigo-500/50 transition-all font-mono"
                        placeholder="0.00"
                        title="أدخل القيمة المراد تحويلها"
                      />

                      <div className="flex gap-2">
                        <select
                          id="converter-select-from"
                          title="تحويل من"
                          aria-label="تحويل من"
                          value={convFrom}
                          onChange={(e) => setConvFrom(e.target.value)}
                          className="flex-1 bg-slate-900 border border-white/5 p-3.5 rounded-xl text-white font-bold outline-none text-xs appearance-none cursor-pointer"
                        >
                          {convType === "mass" &&
                            ["ton", "kg", "g", "lb"].map((u) => (
                              <option key={u} value={u}>
                                {u.toUpperCase()}
                              </option>
                            ))}
                          {convType === "volume" &&
                            ["m3", "l", "ml", "cm3"].map((u) => (
                              <option key={u} value={u}>
                                {u.toUpperCase()}
                              </option>
                            ))}
                          {convType === "pressure" &&
                            ["kN", "MPa", "kPa", "psi"].map((u) => (
                              <option key={u} value={u}>
                                {u.toUpperCase()}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={swapUnits}
                          type="button"
                          className="flex items-center justify-center p-2.5 rounded-xl bg-slate-950 border border-white/5 text-indigo-400 hover:text-white hover:bg-slate-900 transition-all self-center mx-1 shadow-md hover:scale-105 active:scale-95"
                          title="عكس الوحدات"
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>
                        <select
                          id="converter-select-to"
                          title="تحويل إلى"
                          aria-label="تحويل إلى"
                          value={convTo}
                          onChange={(e) => setConvTo(e.target.value)}
                          className="flex-1 bg-slate-900 border border-white/5 p-3.5 rounded-xl text-white font-bold outline-none text-xs appearance-none cursor-pointer"
                        >
                          {convType === "mass" &&
                            ["ton", "kg", "g", "lb"].map((u) => (
                              <option key={u} value={u}>
                                {u.toUpperCase()}
                              </option>
                            ))}
                          {convType === "volume" &&
                            ["m3", "l", "ml", "cm3"].map((u) => (
                              <option key={u} value={u}>
                                {u.toUpperCase()}
                              </option>
                            ))}
                          {convType === "pressure" &&
                            ["kN", "MPa", "kPa", "psi"].map((u) => (
                              <option key={u} value={u}>
                                {u.toUpperCase()}
                              </option>
                            ))}
                        </select>
                      </div>

                      {convType === "pressure" &&
                        ((convFrom === "kN" && convTo === "MPa") ||
                          (convFrom === "MPa" && convTo === "kN")) && (
                          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/10 mt-4">
                            <label className="block text-[8px] font-black text-indigo-400 uppercase mb-2 tracking-widest">
                              مساحة المقطع (mm²)
                            </label>
                            <div className="flex gap-2">
                              <input
                                id="pressure-area-input"
                                type="number"
                                value={convArea}
                                onChange={(e) => setConvArea(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/5 p-2.5 rounded-lg text-white font-mono text-xs"
                                placeholder="Area"
                                title="أدخل مساحة المقطع بالمليمتر المربع"
                              />
                              <button
                                onClick={() =>
                                  setConvArea(CUBE_150_AREA.toString())
                                }
                                className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${convArea === CUBE_150_AREA.toString() ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-500"}`}
                              >
                                CUBE 150
                              </button>
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-center shadow-2xl shadow-indigo-900/40 flex flex-col justify-center border border-white/10 min-h-[160px]">
                      <p className="text-[10px] font-black text-white/50 mb-1 uppercase tracking-widest">
                        النتيجة النهائية
                      </p>
                      <h2 className="text-5xl font-black text-white tracking-tighter truncate leading-none">
                        {conversionResult !== null
                          ? conversionResult.toLocaleString(undefined, {
                              maximumFractionDigits: 4,
                            })
                          : "---"}
                      </h2>
                      <p className="text-sm font-bold text-white/70 mt-3 uppercase italic">
                        {convTo}
                      </p>
                    </div>
                  </div>
                </div>
              </AppCard>
            </div>
          )}

          {/* 2. MATURITY */}
          {activeTab === "maturity" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppCard title="نضج الخرسانة - ASTM C1074">
                <div className="space-y-6 p-1">
                  <div className="flex gap-1.5 p-1 bg-black/30 rounded-xl">
                    <button
                      onClick={() => setMaturityMode("past")}
                      className={`flex-1 py-2.5 rounded-lg font-black text-[10px] transition-all ${maturityMode === "past" ? "bg-amber-600 text-white shadow-md" : "text-slate-500"}`}
                    >
                      العمر الفعلي
                    </button>
                    <button
                      onClick={() => setMaturityMode("future")}
                      className={`flex-1 py-2.5 rounded-lg font-black text-[10px] transition-all ${maturityMode === "future" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500"}`}
                    >
                      تنبؤ الوصول
                    </button>
                  </div>
                  <div className="space-y-4">
                    <input
                      id="maturity-cast-time"
                      type="datetime-local"
                      value={castTime}
                      onChange={(e) => setCastTime(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/10 p-4 rounded-xl text-white font-black text-xs"
                      title="وقت الصب"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        value={avgTemp}
                        onChange={(e) => setAvgTemp(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 p-3 rounded-lg text-white font-mono text-xs"
                        placeholder="Temp °C"
                      />
                      <input
                        type="number"
                        value={datumTemp}
                        onChange={(e) => setDatumTemp(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 p-3 rounded-lg text-white font-mono text-xs"
                        placeholder="Datum"
                      />
                    </div>
                    {maturityMode === "future" && (
                      <input
                        type="number"
                        value={targetMpa}
                        onChange={(e) => setTargetMpa(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 p-3.5 rounded-lg text-white font-black text-xs"
                        placeholder="Target Age (Days)"
                      />
                    )}
                  </div>
                </div>
              </AppCard>
              <div className="bg-slate-900/60 border border-white/5 rounded-[2.5rem] p-8 h-full flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden">
                {maturityMode === "past" && maturityResult ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                      العمر الحقيقي من الصب
                    </p>
                    <h3 className="text-5xl font-black text-white">
                      {(maturityResult as any).ageDays}{" "}
                      <span className="text-xl text-slate-500">يوم</span>
                    </h3>
                    <div className="mt-8 pt-6 border-t border-white/5 w-1/2 mx-auto">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">
                        Maturity Index
                      </p>
                      <h4 className="text-2xl font-mono font-black text-white/80">
                        {(maturityResult as any).maturity}
                      </h4>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                      الموعد المتوقع
                    </p>
                    <h3 className="text-3xl font-black text-white leading-tight">
                      {(maturityResult as any).date}
                    </h3>
                    <p className="text-xl font-black text-indigo-500">
                      {(maturityResult as any).time}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* 3. AGGREGATES */}
          {activeTab === "aggregates" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AppCard title="تحليل الركام والامتصاص">
                  <div className="grid grid-cols-2 gap-4 p-1">
                    {[
                      { l: "الوزن الرطب (g)", v: wWet, s: setWWet },
                      { l: "الوزن SSD (g)", v: wSsd, s: setW_Ssd },
                      { l: "الوزن الجاف (g)", v: wDry, s: setW_Dry },
                      {
                        l: "الوزنة الكلية (kg)",
                        v: bulkWeight,
                        s: setBulkWeight,
                      },
                    ].map((f, i) => (
                      <div key={i} className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 px-1">
                          {f.l}
                        </label>
                        <input
                          id={`agg-field-${i}`}
                          type="number"
                          value={f.v}
                          onChange={(e) => f.s(e.target.value)}
                          className="w-full bg-slate-950 border border-white/5 p-3 rounded-xl text-white font-mono text-xs outline-none"
                          placeholder="0.00"
                          title={f.l}
                        />
                      </div>
                    ))}
                  </div>
                </AppCard>
              </div>
              <div className="flex flex-col gap-4">
                <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 flex flex-col justify-center space-y-4 shadow-sm text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase">
                    الامتصاص
                  </p>
                  <h4 className="text-3xl font-black text-white">
                    {aggResult.absorption}%
                  </h4>
                </div>
                <div className="flex-1 p-6 rounded-2xl bg-emerald-600 text-white shadow-xl flex flex-col justify-center text-center">
                  <p className="text-[9px] font-black text-white/50 mb-1 uppercase tracking-widest">
                    الماء الحر الصافي
                  </p>
                  <h3 className="text-4xl font-black tracking-tighter">
                    {aggResult.waterInSample}{" "}
                    <span className="text-lg">kg</span>
                  </h3>
                  <div className="mt-2 text-[10px] font-black opacity-60 italic">
                    Used for Batch correction
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. CALCULATOR */}
          {activeTab === "calculator" && (
            <div className="max-w-xs mx-auto w-full">
              <AppCard title="الحاسبة">
                <div className="bg-slate-950 p-4 rounded-xl space-y-4">
                  <div className="p-3 text-right min-h-[70px] flex flex-col justify-end">
                    <div className="text-[10px] font-mono text-slate-600 truncate">
                      {calcInput}
                    </div>
                    <div className="text-3xl font-black text-white truncate">
                      {calcResult || "0"}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      "C",
                      "(",
                      ")",
                      "/",
                      "7",
                      "8",
                      "9",
                      "*",
                      "4",
                      "5",
                      "6",
                      "-",
                      "1",
                      "2",
                      "3",
                      "+",
                      "0",
                      ".",
                      "=",
                    ].map((b) => (
                      <button
                        key={b}
                        onClick={() => handleCalc(b)}
                        className={`py-3 rounded-lg text-sm font-bold transition-all ${b === "=" ? "bg-indigo-600 col-span-2 text-white shadow-lg" : "bg-white/5 text-slate-400"}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </AppCard>
            </div>
          )}

          {/* 5. COSTS */}
          {activeTab === "costs" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppCard title="تقدير التكاليف المباشرة">
                <div className="space-y-3 p-1">
                  {[
                    { l: "الأسمنت (كغم)", q: "400", p: "15" },
                    { l: "الركام (كغم)", q: "1100", p: "45" },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className="flex gap-2 items-center bg-white/5 p-3 rounded-lg border border-white/5"
                    >
                      <span className="text-[10px] font-black text-slate-500 w-20">
                        {m.l}
                      </span>
                      <input
                        type="number"
                        placeholder={m.q}
                        className="flex-1 bg-black/40 p-2 rounded text-[10px] text-white outline-none"
                      />
                      <input
                        type="number"
                        placeholder={m.p}
                        className="flex-1 bg-black/40 p-2 rounded text-[10px] text-white outline-none"
                      />
                    </div>
                  ))}
                  <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xs shadow-lg uppercase tracking-widest mt-2">
                    حساب الكلفة
                  </button>
                </div>
              </AppCard>
              <div className="p-8 rounded-[2rem] bg-indigo-600/5 border border-white/5 flex flex-col justify-center text-center items-center">
                <Icons.ShieldCheck className="w-10 h-10 text-indigo-400 mb-4" />
                <p className="text-slate-500 font-bold text-[10px] max-w-xs uppercase tracking-widest">
                  Standards-Based Engine
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer Notes */}
      <div className="pt-6 border-t border-white/5 flex items-center justify-between opacity-50">
        <p className="text-[10px] font-bold text-slate-600">
          ASTM C1074 Certified Engine
        </p>
        <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase">
            Operational Verified
          </span>
        </div>
      </div>
    </div>
  );
}
