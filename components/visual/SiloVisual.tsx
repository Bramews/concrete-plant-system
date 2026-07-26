"use client";

import { useMemo } from "react";

interface SiloVisualProps {
  name: string;
  percentage: number;
  unit: string;
  isLow?: boolean;
  type?: "solid" | "liquid";
}

export function SiloVisual({
  name,
  percentage,
  unit,
  isLow,
  type = "solid",
}: SiloVisualProps) {
  const fillHeight = useMemo(
    () => Math.max(5, Math.min(percentage, 95)),
    [percentage],
  );

  const color = isLow ? "#f59e0b" : "#3b82f6"; // Amber or Blue
  const gradientId = `grad-${name.replace(/\s+/g, "-")}`;

  return (
    <div className="relative group flex flex-col items-center">
      {/* Silo 3D Construction */}
      <div className="relative w-24 h-48 sm:w-32 sm:h-64">
        <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="50%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0.8" />
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Silo Body - Back */}
          <path
            d="M 10,20 Q 50,10 90,20 L 90,180 Q 50,190 10,180 Z"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Liquid/Solid Fill Level */}
          <path
            d={`M 10,${180 - fillHeight * 1.6} Q 50,${170 - fillHeight * 1.6} 90,${180 - fillHeight * 1.6} L 90,180 Q 50,190 10,180 Z`}
            fill={`url(#${gradientId})`}
            className="transition-all duration-1000 ease-in-out"
            filter="url(#glow)"
          />

          {/* Top Cap */}
          <ellipse
            cx="50"
            cy="20"
            rx="40"
            ry="10"
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Internal Reflections */}
          <line
            x1="25"
            y1="30"
            x2="25"
            y2="170"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2"
            strokeDasharray="5,10"
          />
          <line
            x1="75"
            y1="30"
            x2="75"
            y2="170"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2"
            strokeDasharray="5,10"
          />

          {/* Measurement Markers */}
          {[25, 50, 75].map((tick) => (
            <line
              key={tick}
              x1="85"
              y1={180 - tick * 1.6}
              x2="95"
              y2={180 - tick * 1.6}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Text Overlay (Percentage) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xl font-black text-white/40 font-mono tracking-tighter">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      {/* Label and Info */}
      <div className="mt-4 text-center">
        <h4 className="text-sm font-bold font-black text-white uppercase tracking-widest">
          {name}
        </h4>
        <div
          className={`mt-1 inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isLow ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-400"}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isLow ? "bg-amber-500 animate-pulse" : "bg-blue-400"}`}
          ></span>
          {percentage.toFixed(1)}% {unit}
        </div>
      </div>
    </div>
  );
}
