"use client";

import React from "react";
import { BidiText } from "@/components/ui/BidiText";

interface TimelineBatch {
  id: number;
  time: string; // HH:MM
  quantity: number; // m³
  orderNumber: string;
  customerName: string;
  mixGrade: string;
}

interface DailyTimelineProps {
  batches?: TimelineBatch[];
}

export default function DailyTimeline({ batches = [] }: DailyTimelineProps) {
  const displayBatches = batches;

  // Helper to convert HH:MM to percentage of timeline (6:00 to 22:00)
  const getPercentage = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const startHour = 6;
    const endHour = 22;
    const totalMinutes = (endHour - startHour) * 60;
    const currentMinutes = (hours - startHour) * 60 + minutes;
    return Math.max(2, Math.min(98, (currentMinutes / totalMinutes) * 100));
  };

  const totalVolume = displayBatches.reduce((acc, b) => acc + b.quantity, 0);

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">
            الشريط الزمني للإنتاج اليومي
          </h3>
          <p className="text-slate-400 text-sm font-medium mt-1">
            سجل حركة خلاطات الصب وجدول التدفق اليومي
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
          <span className="text-slate-400 text-sm font-medium">
            مجموع صب اليوم:
          </span>
          <span className="text-emerald-400 text-lg font-black">
            <BidiText>{totalVolume.toFixed(1)} م³</BidiText>
          </span>
        </div>
      </div>

      {/* The Timeline Ruler */}
      <div className="relative mt-8 mb-12 px-2">
        {/* Horizontal Line track */}
        <div className="w-full h-2 bg-slate-900 border border-white/5 rounded-full relative">
          {/* Hour markers */}
          {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((hour) => {
            const timeStr = `${hour.toString().padStart(2, "0")}:00`;
            const leftPos = getPercentage(timeStr);
            return (
              <div
                key={hour}
                className="absolute transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${leftPos}%` }}
              >
                <div className="w-1.5 h-4 bg-slate-700 rounded-full mb-1"></div>
                <span className="text-slate-500 text-xs font-bold font-mono">
                  <BidiText>{timeStr}</BidiText>
                </span>
              </div>
            );
          })}

          {/* Current Time marker if within bounds */}
          {(() => {
            const now = new Date();
            const hours = now.getHours();
            if (hours >= 6 && hours <= 22) {
              const timeStr = `${hours.toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
              const leftPos = getPercentage(timeStr);
              return (
                <div
                  className="absolute -top-2 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center transform -translate-x-1/2 z-10"
                  style={{ left: `${leftPos}%` }}
                  title="الآن"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
                </div>
              );
            }
            return null;
          })()}

          {/* Production Batches on the timeline */}
          {displayBatches.map((batch) => {
            const leftPos = getPercentage(batch.time);
            // Size batch circle based on quantity volume
            const size = Math.max(14, Math.min(32, batch.quantity * 2));
            return (
              <div
                key={batch.id}
                className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                style={{ left: `${leftPos}%` }}
              >
                {/* Visual marker ring */}
                <div
                  style={{ width: `${size}px`, height: `${size}px` }}
                  className="rounded-full bg-gradient-to-br from-amber-500 to-amber-700 border-2 border-slate-950 flex items-center justify-center shadow-lg shadow-amber-950/50 group-hover:scale-125 transition-transform"
                >
                  <span className="text-[10px] text-white font-mono font-black select-none">
                    <BidiText>{batch.time}</BidiText>
                  </span>
                </div>

                {/* Tooltip detail overlay */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-64 bg-slate-900 border border-white/10 p-4 rounded-xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all z-30">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                    <span className="text-amber-400 text-sm font-black font-mono">
                      <BidiText>{batch.orderNumber}</BidiText>
                    </span>
                    <span className="text-slate-400 text-xs font-bold">
                      <BidiText>{batch.time}</BidiText>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white text-sm font-bold truncate">
                      {batch.customerName}
                    </p>
                    <div className="flex justify-between text-xs font-bold pt-1">
                      <span className="text-slate-400">الخلطة:</span>
                      <span className="text-slate-200">
                        <BidiText>{batch.mixGrade}</BidiText>
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-1">
                      <span className="text-slate-400">حجم الدفعة:</span>
                      <span className="text-emerald-400 font-black">
                        <BidiText>{batch.quantity} م³</BidiText>
                      </span>
                    </div>
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-white/10 rotate-45 -mt-1.5"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
