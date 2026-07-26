"use client";

import { Icons } from "@/components/ui/Icons";

interface SystemTopPulseProps {
  stats: {
    totalCompanies: number;
    activeCompanies: number;
    criticalAlerts: number;
    systemStatus: "stable" | "pressure" | "danger";
  };
  dict: any; // Ideally this would be the actual dictionary type
}

export function SystemTopPulse({ stats, dict }: SystemTopPulseProps) {
  const t = dict?.admin?.tower ?? dict?.tower ?? {};
  const statusConfig = {
    stable: {
      label: "مستقر",
      color: "text-emerald-500",
      dot: "bg-emerald-500",
    },
    pressure: { label: "ضغط", color: "text-amber-500", dot: "bg-amber-500" },
    danger: { label: "خطر", color: "text-red-500", dot: "bg-red-500" },
  };

  const currentStatus = statusConfig[stats.systemStatus];

  return (
    <div className="glass-card rounded-2xl p-1 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        {/* Metric Groups */}
        <div className="flex items-center gap-8">
          <div className="group cursor-help">
            <p className="text-sm font-bold font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">
              {t?.total_entities ?? "Total Entities"}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">
                {stats.totalCompanies}
              </span>
              <Icons.Factory className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>

          <div className="h-8 w-px bg-white/5" />

          <div className="group cursor-help">
            <p className="text-sm font-bold font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">
              {t?.active_flows ?? "Active Flows"}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">
                {stats.activeCompanies}
              </span>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-3 bg-emerald-500/20 rounded-full overflow-hidden"
                >
                  <div
                    className={`w-full h-full bg-emerald-500 animate-pulse ${
                      i === 1 ? "delay-200" : i === 2 ? "delay-500" : ""
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="h-8 w-px bg-white/5" />

          <div className="group cursor-help">
            <p className="text-sm font-bold font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-red-500 transition-colors">
              {t?.node_alerts ?? "Node Alerts"}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-red-500">
                {stats.criticalAlerts}
              </span>
              <Icons.ShieldAlert className="w-3.5 h-3.5 text-red-900/50" />
            </div>
          </div>
        </div>

        {/* System Pulse Status */}
        <div className="flex items-center gap-4 bg-white/5 pl-4 pr-1 py-1 rounded-full border border-white/5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/50 border border-white/5">
            <div
              className={`w-2 h-2 rounded-full ${currentStatus.dot} animate-pulse shadow-[0_0_10px_currentColor]`}
            />
            <span
              className={`text-sm font-bold font-black uppercase tracking-[0.2em] ${currentStatus.color}`}
            >
              {t?.system_status ?? "System Status"} {currentStatus.label}
            </span>
          </div>
          <div className="flex -space-x-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-500"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
