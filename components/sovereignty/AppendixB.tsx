"use client";

import { Icons } from "@/components/ui/Icons";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { PremiumBadge } from "@/components/ui/premium/PremiumBadge";
import { usePreferences } from "@/context/PreferenceContext";

interface AuditLog {
  id: number;
  userId: number;
  action: string;
  timestamp: string | Date;
  details?: string | null;
  reason?: string | null;
  role: string;
}

interface AppendixBProps {
  data: {
    auditLogs: AuditLog[];
  };
  refresh: () => void;
}

export function AppendixB({ data }: AppendixBProps) {
  const { t } = usePreferences();

  const formatDistanceToNow = (date: Date | string | number) => {
    const diff = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    if (diff < 60) return t.common.time.just_now;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}${t.common.time.mins_ago}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${t.common.time.hours_ago}`;
    const days = Math.floor(hrs / 24);
    return `${days}${t.common.time.days_ago}`;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🔐 ACCOUNT CONTROL */}
        <PremiumCard className="border-rose-500/20">
          <h2 className="text-xl font-black mb-6 flex items-center gap-3">
            <Icons.User className="w-6 h-6 text-rose-500" />
            {t.sovereignty.account_control.title}
          </h2>
          <div className="space-y-4">
            {data.auditLogs.slice(0, 5).map((log: AuditLog) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                    <Icons.User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">
                      User ID: {log.userId}
                    </h3>
                    <p className="text-sm font-bold text-slate-500">
                      {log.action} • {formatDistanceToNow(log.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-rose-500/10 text-rose-500 text-sm font-bold rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
                    {t.sovereignty.account_control.force_logout}
                  </button>
                  <button className="px-3 py-1 bg-white/5 text-slate-400 text-sm font-bold rounded-lg border border-white/5 hover:bg-white/10 transition-all">
                    {t.sovereignty.account_control.manage}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>

        {/* 🧠 USER PERMISSIONS (GRANULAR) */}
        <PremiumCard className="border-blue-500/20">
          <h2 className="text-xl font-black mb-6 flex items-center gap-3">
            <Icons.Shield className="w-6 h-6 text-blue-400" />
            {t.sovereignty.permissions.title}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-bold">
              <thead>
                <tr className="text-slate-500 border-b border-white/5">
                  <th className="pb-3 font-bold uppercase">
                    {t.sovereignty.permissions.columns.module}
                  </th>
                  <th className="pb-3 font-bold uppercase text-center">
                    {t.sovereignty.permissions.columns.view}
                  </th>
                  <th className="pb-3 font-bold uppercase text-center">
                    {t.sovereignty.permissions.columns.create}
                  </th>
                  <th className="pb-3 font-bold uppercase text-center">
                    {t.sovereignty.permissions.columns.edit}
                  </th>
                  <th className="pb-3 font-bold uppercase text-center">
                    {t.sovereignty.permissions.columns.approve}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  t.common.modules.MATERIAL,
                  t.common.modules.LAB,
                  t.common.modules.FINANCE,
                  t.common.modules.PRODUCTION,
                  t.common.modules.HR,
                ].map((mod) => (
                  <tr
                    key={mod}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 font-bold text-slate-300">{mod}</td>
                    <td className="py-4 text-center">
                      <Icons.Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    </td>
                    <td className="py-4 text-center">
                      <Icons.Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    </td>
                    <td className="py-4 text-center">
                      <Icons.Alert className="w-4 h-4 text-rose-500/50 mx-auto" />
                    </td>
                    <td className="py-4 text-center">
                      <Icons.Alert className="w-4 h-4 text-rose-500/50 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-sm font-bold text-blue-300">
              {t.sovereignty.permissions.note}
            </p>
          </div>
        </PremiumCard>
      </div>

      {/* 📜 USER ACTIVITY AUDIT */}
      <PremiumCard className="border-white/5">
        <h2 className="text-xl font-black mb-6 flex items-center gap-3">
          <Icons.Activity className="w-6 h-6 text-slate-400" />
          {t.sovereignty.audit.title}
        </h2>
        <div className="space-y-3">
          {data.auditLogs.map((log: AuditLog) => (
            <div
              key={log.id}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-900/50 rounded-2xl border border-white/5 hover:border-slate-500/30 transition-all text-[11px] font-mono"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-400">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="text-emerald-400 font-bold uppercase">
                {log.action}
              </div>
              <div className="text-slate-500 truncate">
                {log.details || log.reason || t.common.audit_default}
              </div>
              <div className="flex items-center justify-end gap-3">
                <span className="text-slate-600">
                  IP: 192.168.1.{log.id % 255}
                </span>
                <Icons.Dashboard className="w-3 h-3 text-slate-700" />
                <PremiumBadge variant="secondary" size="sm">
                  {log.role}
                </PremiumBadge>
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
}
