"use client";

import { Icons } from "@/components/ui/Icons";
import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  status?: "success" | "warning" | "danger" | "neutral";
  icon: keyof typeof Icons;
  isLoading?: boolean;
  isEmpty?: boolean;
  isReadOnly?: boolean;
  trend?: string;
  dir?: "rtl" | "ltr"; // Explicit direction control
}

export function KpiCard({
  title,
  value,
  subValue,
  status = "neutral",
  icon,
  isLoading,
  isEmpty,
  isReadOnly,
  trend,
  dir,
}: KpiCardProps) {
  const Icon = (Icons[icon] || Icons.AlertTriangle) as any;

  // Extra safety: if Icon is still null/undefined, don't crash
  if (!Icon) return null;

  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-[2rem] border border-white/5 shadow-2xl h-32 flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-start">
          <div className="w-24 h-4 bg-white/5 rounded"></div>
          <div className="w-8 h-8 bg-white/5 rounded-full"></div>
        </div>
        <div className="w-16 h-8 bg-white/5 rounded mt-2"></div>
      </div>
    );
  }

  // Consistent coloring with LabDashboard
  const getIconStyles = () => {
    switch (status) {
      case "success":
        return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
      case "warning":
        return "text-amber-400 bg-amber-500/10 border border-amber-500/20";
      case "danger":
        return "text-rose-400 bg-rose-500/10 border border-rose-500/20";
      default:
        return "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-inner";
    }
  };

  return (
    <div
      dir={dir}
      className={`bg-card p-8 rounded-[2rem] border border-white/5 shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group relative overflow-hidden backdrop-blur-xl ${
        isReadOnly ? "opacity-75 grayscale bg-white/5" : ""
      }`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-all" />
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl transition-colors ${getIconStyles()}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span
            className={`text-sm font-bold px-2.5 py-1 rounded-full ${
              status === "success" || trend.includes("+")
                ? "bg-emerald-100 text-emerald-700"
                : status === "warning"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      <div className="space-y-1 relative z-10">
        <h3 className="text-4xl font-bold text-white tracking-tighter">
          {isEmpty ? "---" : value}
          {subValue && (
            <span className="text-sm text-slate-400 ml-2 font-semibold uppercase tracking-wider">
              {subValue}
            </span>
          )}
        </h3>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">
          {title}
        </p>
      </div>

      {isReadOnly && (
        <div className="absolute top-2 right-2">
          <Icons.Lock className="w-4 h-4 text-slate-400" />
        </div>
      )}
    </div>
  );
}
