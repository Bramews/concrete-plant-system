"use client";

import { Icons } from "@/components/ui/Icons";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: keyof typeof Icons;
  gradient:
    | "kpi-gradient-1"
    | "kpi-gradient-2"
    | "kpi-gradient-3"
    | "kpi-gradient-4";
  iconColor: string;
}

export function KPICard({
  title,
  value,
  change,
  icon,
  gradient,
  iconColor,
}: KPICardProps) {
  const Icon = Icons[icon];
  const isPositive = change && change > 0;

  return (
    <div
      className={`glass-card glass-card-hover ${gradient} p-6 rounded-2xl animate-fade-in`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl ${iconColor} bg-opacity-20 flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
          >
            <span>{isPositive ? "↑" : "↓"}</span>
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-black text-white mb-1">{value}</p>
        <p className="text-sm text-slate-400 font-medium">{title}</p>
      </div>
    </div>
  );
}
