"use client";

import { useState, useEffect } from "react";
import { Database, Scale, ArrowLeft, Cog, Truck } from "lucide-react";

const STEPS = [
  { id: "silo", label: "الصوامع", icon: Database },
  { id: "weigh", label: "الموازين", icon: Scale },
  { id: "mix", label: "الخلاط", icon: Cog },
  { id: "truck", label: "الشاحنة", icon: Truck },
];

export default function ProcessFlow() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="op-card p-5" dir="rtl">
      <h3 className="text-sm font-black text-white mb-4">مسار تدفق المواد</h3>
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === activeStep;
          const isDone = i < activeStep;

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                  isActive 
                    ? "bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                    : isDone 
                      ? "bg-emerald-500/20 border-emerald-500/30" 
                      : "bg-white/5 border-white/10"
                }`}>
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? "text-cyan-400" : isDone ? "text-emerald-400" : "text-slate-600"
                  }`} />
                </div>
                <span className={`text-xs font-bold ${isActive ? "text-cyan-400" : isDone ? "text-emerald-400" : "text-slate-600"}`}>
                  {step.label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <ArrowLeft className={`w-5 h-5 mx-1 transition-colors ${
                  i < activeStep ? "text-emerald-500" : i === activeStep ? "text-cyan-400 animate-pulse" : "text-slate-700"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
