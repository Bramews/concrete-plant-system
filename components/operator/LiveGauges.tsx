"use client";

import React, { useState, useEffect } from "react";
import { BidiText } from "@/components/ui/BidiText";

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  colorClass: string;
  gradientId: string;
  gradientColors: { start: string; end: string };
}

function GaugeDial({
  value,
  min,
  max,
  label,
  unit,
  gradientId,
  gradientColors,
}: GaugeProps) {
  // SVG gauge circular metrics
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  // We represent the dial as a 270-degree arc (from 135 deg to 405 deg)
  const angleRange = 270;
  const arcLength = (angleRange / 360) * circumference;

  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100),
  );
  const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
      {/* SVG Definitions for Gradients */}
      <svg className="w-0 h-0 absolute">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors.start} />
            <stop offset="100%" stopColor={gradientColors.end} />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 120 120"
        >
          {/* Background Track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(135 60 60)"
          />
          {/* Active Color Fill */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(135 60 60)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Inner Text info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center mt-3">
          <span className="text-2xl font-black text-white leading-none tracking-tight">
            <BidiText>{value.toFixed(value < 10 ? 1 : 0)}</BidiText>
          </span>
          <span className="text-slate-400 text-xs font-bold mt-1 opacity-70">
            {unit}
          </span>
        </div>
      </div>

      <div className="text-center mt-2">
        <h4 className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
          {label}
        </h4>
      </div>
    </div>
  );
}

export default function LiveGauges() {
  const [data, setData] = useState({
    rate: 34.5,
    cement: 420,
    water: 85.0,
    temp: 68.0,
    pressure: 6.8,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const active = Math.random() > 0.3;
        return {
          rate: active ? +(30 + Math.random() * 15).toFixed(1) : 0,
          cement: active ? Math.round(380 + Math.random() * 150) : 0,
          water: Math.max(
            20,
            Math.min(
              100,
              +(prev.water + (active ? -0.1 : 0.2) * Math.random()).toFixed(1),
            ),
          ),
          temp: +(
            60 +
            (active ? 15 : -5) * Math.random() +
            Math.sin(Date.now() / 20000) * 3
          ).toFixed(1),
          pressure: +(6.2 + Math.random() * 1.2).toFixed(1),
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const gauges = [
    {
      id: "rate",
      value: data.rate,
      min: 0,
      max: 50,
      label: "معدل الإنتاج اللحظي",
      unit: "م³/ساعة",
      colorClass: "text-cyan-500",
      gradientId: "gradRate",
      gradientColors: { start: "#06b6d4", end: "#3b82f6" },
    },
    {
      id: "cement",
      value: data.cement,
      min: 0,
      max: 1000,
      label: "استهلاك الإسمنت",
      unit: "كجم/دقيقة",
      colorClass: "text-amber-500",
      gradientId: "gradCement",
      gradientColors: { start: "#f59e0b", end: "#d97706" },
    },
    {
      id: "water",
      value: data.water,
      min: 0,
      max: 100,
      label: "مستوى خزان الماء",
      unit: "%",
      colorClass: "text-blue-500",
      gradientId: "gradWater",
      gradientColors: { start: "#3b82f6", end: "#0284c7" },
    },
    {
      id: "temp",
      value: data.temp,
      min: 0,
      max: 120,
      label: "حرارة المحرك الرئيسي",
      unit: "°م",
      colorClass: "text-red-500",
      gradientId: "gradTemp",
      gradientColors: { start: "#ef4444", end: "#f43f5e" },
    },
    {
      id: "pressure",
      value: data.pressure,
      min: 0,
      max: 10,
      label: "ضغط هواء النظام",
      unit: "بار",
      colorClass: "text-emerald-500",
      gradientId: "gradPressure",
      gradientColors: { start: "#10b981", end: "#059669" },
    },
  ];

  return (
    <div className="bg-slate-900/60 border border-white/10 p-5 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            مقاييس الأداء الفوري بالمحطة
          </h3>
          <p className="text-slate-400 text-xs font-medium mt-0.5">
            رصد مباشر لمؤشرات المحرك والضغط والإنتاجية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {gauges.map((gauge) => (
          <GaugeDial key={gauge.id} {...gauge} />
        ))}
      </div>
    </div>
  );
}
