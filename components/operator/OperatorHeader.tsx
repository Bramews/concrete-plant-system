"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize, Activity } from "lucide-react";

function ConnectionStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${online ? "bg-emerald-400" : "bg-red-400"} opacity-75`}></span>
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${online ? "bg-emerald-500" : "bg-red-500"}`}></span>
      </span>
      <span className={`text-xs font-bold ${online ? "text-emerald-400" : "text-red-400"}`}>
        {online ? "متصل بالشبكة" : "غير متصل — وضع محلي"}
      </span>
    </div>
  );
}

import { SunlightModeToggle } from "@/components/ui/SunlightModeToggle";

export function OperatorHeader({ userName }: { userName: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [time, setTime] = useState(new Date());

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    
    return `${dayName} ${day} ${month} — ${h}:${m}:${s}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <header className="h-14 px-6 bg-[#0c1220] border-b border-white/5 flex items-center justify-between shrink-0">
      {/* Right side (RTL) - Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <span className="font-bold text-white text-sm">غرفة التحكم والمراقبة</span>
      </div>

      {/* Center - Digital Clock */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <span suppressHydrationWarning className="text-lg font-black font-mono text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
          {mounted ? formatTime(time) : ""}
        </span>
      </div>

      {/* Left side (RTL) - Controls & User */}
      <div className="flex items-center gap-4">
        <SunlightModeToggle variant="compact" />

        <div className="h-4 w-px bg-white/10" />

        <ConnectionStatus />
        
        <div className="h-4 w-px bg-white/10" />
        
        <span className="text-sm font-bold text-slate-300">
          المشغل: <span className="text-white">{userName}</span>
        </span>

        <div className="h-4 w-px bg-white/10" />

        <button 
          onClick={toggleFullscreen}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          title="ملء الشاشة"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
