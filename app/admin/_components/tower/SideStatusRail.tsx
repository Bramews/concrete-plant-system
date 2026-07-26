"use client";

import React, { useEffect, useState } from "react";
import { Icons } from "@/components/ui/Icons";

interface SideStatusRailProps {
  status: "stable" | "attention" | "risk";
  modeName: string;
}

export function SideStatusRail({ status, modeName }: SideStatusRailProps) {
  const [startTime] = useState(new Date());
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor(
        (new Date().getTime() - startTime.getTime()) / 1000,
      );
      const h = Math.floor(diff / 3600)
        .toString()
        .padStart(2, "0");
      const m = Math.floor((diff % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const s = (diff % 60).toString().padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const statusColors = {
    stable: "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]",
    attention: "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]",
    risk: "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]",
  };

  return (
    <aside className="w-16 md:w-20 lg:w-24 h-screen border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col items-center py-10 justify-between fixed left-0 top-0 z-50">
      <div className="flex flex-col items-center gap-12">
        {/* State Indicator */}
        <div className="relative group">
          <div
            className={`w-3 h-3 rounded-full ${statusColors[status]} transition-all duration-500 animate-pulse`}
          />
          <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 rotate-90 origin-center whitespace-nowrap">
            <span className="text-sm font-bold font-black tracking-[0.4em] uppercase text-white/40 group-hover:text-white transition-colors">
              SYSTEM STATE
            </span>
          </div>
        </div>

        {/* Mode Name */}
        <div className="mt-20">
          <div className="rotate-90 origin-center whitespace-nowrap flex items-center gap-4">
            <span className="text-[11px] font-black text-white uppercase tracking-[0.6em]">
              {modeName}
            </span>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2 scale-75">
          UPTIME
        </span>
        <span className="text-sm font-bold font-mono font-bold text-white/60 tabular-nums">
          {elapsed}
        </span>
      </div>
    </aside>
  );
}
