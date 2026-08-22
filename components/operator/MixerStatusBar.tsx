"use client";

import { useState, useEffect } from "react";

const STATES = {
  IDLE: { label: "الخلاط جاهز — في وضع الاستعداد", color: "bg-slate-500", glow: "", barColor: "bg-slate-600" },
  WEIGHING: { label: "جاري وزن المواد...", color: "bg-cyan-400 animate-pulse", glow: "shadow-[0_0_15px_rgba(6,182,212,0.4)]", barColor: "bg-cyan-500" },
  MIXING: { label: "جاري الخلط", color: "bg-emerald-400 animate-pulse", glow: "shadow-[0_0_15px_rgba(16,185,129,0.4)]", barColor: "bg-emerald-500" },
  DISCHARGING: { label: "جاري التفريغ في الشاحنة", color: "bg-amber-400 animate-pulse", glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]", barColor: "bg-amber-500" },
};

type MixerState = keyof typeof STATES;

export default function MixerStatusBar() {
  const [state, setState] = useState<MixerState>("IDLE");
  const [progress, setProgress] = useState(0);
  const [timer, setTimer] = useState(0);

  // محاكاة — يُستبدل لاحقاً بإشارة PLC حقيقية
  useEffect(() => {
    const cycle = () => {
      setState("WEIGHING");
      setProgress(0);
      setTimer(0);

      const weighInterval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(weighInterval); return 100; }
          return p + 5;
        });
      }, 200);

      setTimeout(() => {
        clearInterval(weighInterval);
        setState("MIXING");
        setProgress(0);
        setTimer(60);

        const mixInterval = setInterval(() => {
          setTimer(t => {
            if (t <= 1) { clearInterval(mixInterval); return 0; }
            return t - 1;
          });
          setProgress(p => Math.min(100, p + (100 / 60)));
        }, 1000);

        setTimeout(() => {
          clearInterval(mixInterval);
          setState("DISCHARGING");
          setProgress(0);

          const dischargeInterval = setInterval(() => {
            setProgress(p => {
              if (p >= 100) { clearInterval(dischargeInterval); return 100; }
              return p + 10;
            });
          }, 300);

          setTimeout(() => {
            clearInterval(dischargeInterval);
            setState("IDLE");
            setProgress(0);
            setTimer(0);
          }, 3500);
        }, 60000);
      }, 4500);
    };

    const timeout = setTimeout(cycle, 5000);
    return () => clearTimeout(timeout);
  }, []);

  const config = STATES[state];

  return (
    <div className={`op-card p-4 flex items-center gap-4 ${config.glow}`} dir="rtl">
      {/* مؤشر الحالة */}
      <div className={`w-4 h-4 rounded-full shrink-0 ${config.color}`} />

      {/* شريط التقدم */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-white">{config.label}</span>
          {state === "MIXING" && timer > 0 && (
            <span className="text-2xl font-black font-mono text-emerald-400">
              {Math.floor(timer / 60).toString().padStart(2, "0")}:{(timer % 60).toString().padStart(2, "0")}
            </span>
          )}
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
