"use client";

import { Activity } from "lucide-react";

interface LogEntry {
  id: number;
  action: string;
  details: string;
  timestamp: string;
}

interface Props {
  logs: LogEntry[];
}

const actionLabels: Record<string, { label: string; color: string }> = {
  BACKUP_CREATE: {
    label: "إنشاء نسخة",
    color: "text-emerald-400 bg-emerald-500/10",
  },
  BACKUP_DELETE: { label: "حذف نسخة", color: "text-rose-400 bg-rose-500/10" },
  BACKUP_RESTORE: { label: "استعادة", color: "text-amber-400 bg-amber-500/10" },
  BACKUP_VERIFY: {
    label: "فحص سلامة",
    color: "text-indigo-400 bg-indigo-500/10",
  },
  BACKUP_CLEANUP: {
    label: "تنظيف تلقائي",
    color: "text-violet-400 bg-violet-500/10",
  },
  BACKUP_PATH_UPDATE: {
    label: "تغيير المسار",
    color: "text-cyan-400 bg-cyan-500/10",
  },
  AUTO_BACKUP_UPDATE: {
    label: "تحديث الإعدادات",
    color: "text-blue-400 bg-blue-500/10",
  },
};

export function BackupActivityLog({ logs }: Props) {
  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("ar-SA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Activity className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-base font-black text-white">سجل العمليات</h3>
          <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
            آخر النشاطات على النسخ
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-slate-600 text-sm font-bold">
            لا توجد عمليات مسجلة بعد
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {logs.map((log) => {
            const meta = actionLabels[log.action] || {
              label: log.action,
              color: "text-slate-400 bg-slate-500/10",
            };
            return (
              <div
                key={log.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={`text-sm font-bold font-black px-3 py-1 rounded-full whitespace-nowrap ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-sm font-bold text-slate-400 font-medium truncate">
                    {log.details}
                  </span>
                </div>
                <span className="text-[11px] text-slate-600 font-bold whitespace-nowrap mr-4">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
