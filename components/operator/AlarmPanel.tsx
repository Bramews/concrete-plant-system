"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

interface Alarm {
  id: string;
  level: "WARNING" | "GENERAL" | "EMERGENCY";
  message: string;
  time: string;
}

const LEVEL_CONFIG = {
  WARNING: { label: "تحذير", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: "🟡" },
  GENERAL: { label: "عام", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", icon: "🟠" },
  EMERGENCY: { label: "طوارئ", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400 op-glow-crit", icon: "🔴" },
};

export default function AlarmPanel() {
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: "1", level: "WARNING", message: "مخزون الأسمنت أقل من 30% — يُنصح بالتعبئة", time: "12:00:00" },
    { id: "2", level: "GENERAL", message: "تأخر موعد صيانة الخلاط بـ 3 أيام", time: "12:00:00" },
  ]);

  useEffect(() => {
    const now = new Date().toLocaleTimeString("en-US", { hour12: false });
    setAlarms([
      { id: "1", level: "WARNING", message: "مخزون الأسمنت أقل من 30% — يُنصح بالتعبئة", time: now },
      { id: "2", level: "GENERAL", message: "تأخر موعد صيانة الخلاط بـ 3 أيام", time: now },
    ]);
  }, []);

  const dismiss = (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  if (alarms.length === 0) {
    return (
      <div className="op-card p-4 flex items-center gap-3" dir="rtl">
        <CheckCircle className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-bold text-emerald-400">جميع الأنظمة تعمل بشكل طبيعي ✓</span>
      </div>
    );
  }

  return (
    <div className="op-card p-4 space-y-2" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-black text-white">لوحة الإنذارات ({alarms.length})</h3>
      </div>
      {alarms.map(alarm => {
        const config = LEVEL_CONFIG[alarm.level];
        return (
          <div key={alarm.id} className={`flex items-center gap-3 p-3 rounded-xl border ${config.bg} ${config.border}`}>
            <span className="text-lg">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-2 py-0.5 rounded ${config.bg} ${config.text}`}>{config.label}</span>
                <span className="text-xs font-mono text-slate-500" suppressHydrationWarning>{alarm.time}</span>
              </div>
              <p className={`text-sm font-bold mt-1 ${config.text}`}>{alarm.message}</p>
            </div>
            <button onClick={() => dismiss(alarm.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors shrink-0" title="تم المعالجة">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
