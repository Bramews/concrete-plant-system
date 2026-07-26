"use client";

import { Icons } from "@/components/ui/Icons";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Alert {
  id: string | number;
  title: string;
  message: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  timestamp: Date;
}

interface AlertsCardProps {
  alerts: Alert[];
  lang: string;
  isLoading?: boolean;
  dir?: "rtl" | "ltr";
}

export function AlertsCard({ alerts, lang, isLoading, dir }: AlertsCardProps) {
  const isRtl = lang === "ar"; // This handles internal date formatting

  // Note: We use the passed 'dir' prop for the container layout direction,
  // but we still need 'lang' for date-fns localization.

  if (isLoading) {
    return (
      <div className="ind-card h-64 animate-pulse bg-muted/40 border-dashed"></div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <Icons.ShieldAlert className="w-4 h-4 text-destructive" />;
      case "WARNING":
        return <Icons.AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Icons.Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div
      dir={dir}
      className="bg-white flex flex-col h-full min-h-[400px] p-6 rounded-3xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <Icons.Bell className="w-5 h-5 text-indigo-600" />
          {isRtl ? "تنبيهات النظام" : "System Alerts"}
        </h3>
        <span className="text-sm font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase tracking-wide">
          {alerts.length} {isRtl ? "نشط" : "Active"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-10">
            <Icons.CheckCircle className="w-10 h-10 text-emerald-500/30" />
            <p className="text-sm font-bold uppercase tracking-wider">
              {isRtl ? "النظام مستقر" : "All Systems Operational"}
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                alert.severity === "CRITICAL"
                  ? "bg-rose-50 border-rose-100 hover:border-rose-200"
                  : alert.severity === "WARNING"
                    ? "bg-amber-50 border-amber-100 hover:border-amber-200"
                    : "bg-slate-50 border-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {alert.title}
                    </h4>
                    <span className="text-sm font-bold text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(alert.timestamp), {
                        addSuffix: true,
                        locale: isRtl ? ar : enUS,
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mt-1 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide flex items-center justify-center gap-2 w-full py-2 rounded-xl hover:bg-indigo-50 transition-colors">
          {isRtl ? "سجل التنبيهات" : "View Alert Log"}
          <Icons.ChevronRight
            className={`w-3 h-3 ${isRtl ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
