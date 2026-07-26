"use client";

import { Icons } from "@/components/ui/Icons";

interface UsageCardProps {
  title: string;
  used: number;
  total: number;
  unit: string;
  type?: "STORAGE" | "USERS" | "PROJECTS"; // Optional validation
  isLoading?: boolean;
  usageLabel?: string; // e.g. "USED" or "مستخدم"
}

export function UsageCard({
  title,
  used,
  total,
  unit,
  type: _type, // Unused but kept for API shape compatibility
  isLoading,
  usageLabel = "مستخدم",
}: UsageCardProps) {
  if (isLoading) {
    return (
      <div className="ind-card animate-pulse h-48 bg-muted/40 border-dashed"></div>
    );
  }

  // Usage type can influence color later
  const percentage = Math.min(Math.round((used / total) * 100), 100);
  const isCritical = percentage >= 90;
  const isWarning = percentage >= 75;

  const getColor = () => {
    if (isCritical) return "text-destructive stroke-destructive";
    if (isWarning) return "text-amber-500 stroke-amber-500";
    return "text-primary stroke-primary";
  };

  return (
    <div className="glass-card glass-card-hover group relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-3xl border border-white/5 transition-all duration-500">
      {/* Background Glow */}
      <div
        className={`absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-[60px] opacity-10 transition-all duration-700 group-hover:opacity-25 ${
          percentage > 90
            ? "bg-rose-500"
            : percentage > 75
              ? "bg-amber-500"
              : "bg-indigo-500"
        }`}
      />

      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-8 relative z-10 group-hover:text-slate-200 transition-colors">
        {title}
      </h3>

      {/* Radial Progress */}
      <div className="relative w-32 h-32 mb-8 group-hover:scale-105 transition-transform duration-500 relative z-10">
        {/* Outer Glow Ring */}
        <div
          className={`absolute inset-0 rounded-full blur-xl opacity-20 ${
            percentage > 90
              ? "bg-rose-500"
              : percentage > 75
                ? "bg-amber-500"
                : "bg-indigo-500"
          }`}
        />

        <svg className="w-full h-full transform -rotate-90 relative z-10">
          <circle
            cx="64"
            cy="64"
            r="56"
            className="stroke-white/5"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            className={`transition-all duration-1000 ease-out ${
              percentage > 90
                ? "stroke-rose-500"
                : percentage > 75
                  ? "stroke-amber-500"
                  : "stroke-indigo-500"
            }`}
            strokeWidth="10"
            fill="none"
            strokeDasharray="351.8"
            strokeDashoffset={351.8 - (351.8 * percentage) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span
            className={`text-3xl font-bold font-mono tracking-tighter text-white`}
          >
            {percentage}%
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {percentage === 100 ? "مكتمل" : "مستهلك"}
          </span>
        </div>
      </div>

      <div className="text-center relative z-10">
        <p className="text-2xl font-bold font-mono tracking-tighter text-white mb-1">
          {used}{" "}
          <span className="text-sm text-slate-400 font-semibold uppercase ml-1">
            {unit}
          </span>
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              percentage > 90
                ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                : percentage > 75
                  ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            }`}
          />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {`من أصل ${total} ${unit}`}
          </p>
        </div>
      </div>

      {isCritical && (
        <div className="absolute top-4 right-4 animate-bounce">
          <Icons.ShieldAlert className="w-5 h-5 text-rose-500" />
        </div>
      )}
    </div>
  );
}
