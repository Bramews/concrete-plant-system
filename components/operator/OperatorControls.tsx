"use client";

import { useState, useEffect } from "react";
import { Maximize, Minimize, Clock } from "lucide-react";

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <button
      onClick={toggle}
      title={isFullscreen ? "إنهاء ملء الشاشة" : "وضع ملء الشاشة (غرفة التحكم)"}
      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold shadow-lg"
    >
      {isFullscreen ? (
        <>
          <Minimize className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">إلغاء ملء الشاشة</span>
        </>
      ) : (
        <>
          <Maximize className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">ملء الشاشة SCADA</span>
        </>
      )}
    </button>
  );
}

export function LiveClock() {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-slate-300 font-mono text-xs font-bold shadow-inner">
      <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
      <span>{timeStr || "00:00:00"}</span>
    </div>
  );
}
