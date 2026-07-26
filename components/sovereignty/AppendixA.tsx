"use client";

import { Icons } from "@/components/ui/Icons";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { PremiumBadge } from "@/components/ui/premium/PremiumBadge";
import {
  toggleModuleSeal,
  updateSystemPolicy,
} from "@/app/actions/sovereignty";
import { usePreferences } from "@/context/PreferenceContext";

interface Policy {
  key: string;
  value: string;
}

interface Seal {
  id: number;
  moduleName: string;
  isSealed: boolean;
  reason?: string | null;
}

interface AppendixAProps {
  data: {
    policies: Policy[];
    seals: Seal[];
  };
  refresh: () => void;
}

export function AppendixA({ data, refresh }: AppendixAProps) {
  const { t } = usePreferences();

  const handleUpdatePolicy = async (key: string, currentValue: string) => {
    const newVal = prompt(`Update ${key}:`, currentValue);
    if (newVal !== null && newVal !== currentValue) {
      await updateSystemPolicy(key, newVal, "صيانة دورية من قبل المالك");
      refresh();
    }
  };

  const handleToggleSeal = async (
    moduleName: string,
    currentStatus: boolean,
  ) => {
    const reason = prompt("Enter reason for sealing change:");
    if (reason) {
      await toggleModuleSeal(moduleName, !currentStatus, reason);
      refresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 🏭 PLANT INFORMATION */}
      <div className="space-y-6 lg:col-span-2">
        <PremiumCard className="border-cyan-500/20">
          <h2 className="text-xl font-black mb-6 flex items-center gap-3">
            <Icons.Dashboard className="w-6 h-6 text-cyan-400" />
            {t.sovereignty.plant_info.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase font-bold text-slate-500">
                {t.sovereignty.plant_info.name}
              </label>
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-white/5">
                <span className="font-mono text-sm">
                  {data.policies.find((p: Policy) => p.key === "PLANT_NAME")
                    ?.value || t.sovereignty.plant_info.default_name}
                </span>
                <button
                  onClick={() =>
                    handleUpdatePolicy("PLANT_NAME", "Concrete Alpha")
                  }
                  className="text-cyan-400 hover:text-white"
                  title="تعديل اسم المحطة"
                >
                  <Icons.Edit className="w-4 h-4" />
                </button>
              </div>

              <label className="text-sm font-bold uppercase font-bold text-slate-500">
                {t.sovereignty.plant_info.address}
              </label>
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-white/5">
                <span className="font-mono text-sm text-slate-400 truncate max-w-[200px]">
                  {data.policies.find((p: Policy) => p.key === "PLANT_ADDRESS")
                    ?.value || "N/A"}
                </span>
                <button
                  onClick={() => handleUpdatePolicy("PLANT_ADDRESS", "N/A")}
                  className="text-cyan-400 hover:text-white"
                  title="تعديل العنوان"
                >
                  <Icons.Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase font-bold text-slate-500">
                {t.sovereignty.plant_info.operating_window}
              </label>
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-white/5">
                <span className="font-mono text-sm">
                  {data.policies.find(
                    (p: Policy) => p.key === "PLANT_WORKING_HOURS",
                  )?.value || "06:00 - 18:00"}
                </span>
                <button
                  onClick={() =>
                    handleUpdatePolicy("PLANT_WORKING_HOURS", "06:00-18:00")
                  }
                  className="text-cyan-400 hover:text-white"
                  title="تعديل ساعات العمل"
                >
                  <Icons.Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Icons.ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400 uppercase">
                    {t.sovereignty.plant_info.integrity_status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight">
                  {t.sovereignty.plant_info.integrity_note}
                </p>
              </div>
            </div>
          </div>
        </PremiumCard>

        {/* 🚨 THRESHOLDS & ALERTS */}
        <PremiumCard className="border-amber-500/20">
          <h2 className="text-xl font-black mb-6 flex items-center gap-3">
            <Icons.Alert className="w-6 h-6 text-amber-400" />
            {t.sovereignty.thresholds.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: t.sovereignty.thresholds.over_production,
                key: "THRESHOLD_OVER_PRODUCTION",
              },
              {
                label: t.sovereignty.thresholds.rejection_limit,
                key: "THRESHOLD_REJECTION_LIMIT",
              },
              {
                label: t.sovereignty.thresholds.delay_tolerance,
                key: "THRESHOLD_DELAY_LIMIT_MINS",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="p-4 bg-slate-900 border border-white/5 rounded-2xl group hover:border-amber-500/40 transition-all"
              >
                <p className="text-sm font-bold text-slate-500 mb-2 uppercase">
                  {item.label}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">
                    {data.policies.find((p: Policy) => p.key === item.key)
                      ?.value || "0"}
                  </span>
                  <button
                    onClick={() => handleUpdatePolicy(item.key, "0")}
                    className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={`تعديل ${item.label}`}
                  >
                    <Icons.Edit className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>

        {/* 🔒 MODULE SEALS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.seals.map((seal: Seal) => (
            <div
              key={seal.id}
              className={`p-5 rounded-2xl border ${seal.isSealed ? "bg-rose-500/5 border-rose-500/20" : "bg-white/5 border-white/5"} transition-all`}
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-2 rounded-lg ${seal.isSealed ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}
                >
                  <Icons.Lock className="w-5 h-5" />
                </div>
                <PremiumBadge variant={seal.isSealed ? "error" : "success"}>
                  {seal.isSealed
                    ? t.sovereignty.seals.sealed
                    : t.sovereignty.seals.unsealed}
                </PremiumBadge>
              </div>
              <h3 className="font-bold text-lg">{seal.moduleName}</h3>
              <p className="text-sm font-bold text-slate-500 mt-1 mb-4">
                {seal.reason || t.sovereignty.seals.reason_default}
              </p>
              <button
                onClick={() => handleToggleSeal(seal.moduleName, seal.isSealed)}
                className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${seal.isSealed ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}
              >
                {seal.isSealed
                  ? t.sovereignty.seals.unseal_module
                  : t.sovereignty.seals.force_seal}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 🧠 SYSTEM HEALTH & STATUS */}
      <div className="space-y-6">
        <PremiumCard className="bg-[#0f172a] border-white/5">
          <h2 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t.sovereignty.health.title}
          </h2>
          <div className="space-y-6">
            {[
              {
                label: t.sovereignty.health.db_latency,
                val: "14ms",
                status: t.sovereignty.health.status_map.passed,
              },
              {
                label: t.sovereignty.health.storage,
                val: `42% ${t.sovereignty.health.status_map.used}`,
                status: t.sovereignty.health.status_map.OPTIMAL,
              },
              {
                label: t.sovereignty.health.active_sessions,
                val: "128",
                status: t.sovereignty.health.status_map.NORMAL,
              },
              {
                label: t.sovereignty.health.security_handshake,
                val: t.sovereignty.health.status_map.passed,
                status: t.sovereignty.health.status_map.SECURE,
              },
            ].map((h, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase">
                    {h.label}
                  </p>
                  <p className="text-lg font-black">{h.val}</p>
                </div>
                <PremiumBadge variant="success" size="sm">
                  {h.status}
                </PremiumBadge>
              </div>
            ))}
          </div>
        </PremiumCard>

        {/* 🔧 SYSTEM MODES */}
        <PremiumCard>
          <h2 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest">
            {t.sovereignty.directives.title}
          </h2>
          <div className="space-y-3">
            <button className="w-full flex justify-between items-center p-4 bg-slate-900 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
              <div className="text-left">
                <p className="text-sm font-bold">
                  {t.sovereignty.directives.maintenance.title}
                </p>
                <p className="text-[9px] text-slate-500">
                  {t.sovereignty.directives.maintenance.desc}
                </p>
              </div>
              <PremiumBadge variant="secondary">OFF</PremiumBadge>
            </button>
            <button className="w-full flex justify-between items-center p-4 bg-slate-900 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all">
              <div className="text-left">
                <p className="text-sm font-bold">
                  {t.sovereignty.directives.readonly.title}
                </p>
                <p className="text-[9px] text-slate-500">
                  {t.sovereignty.directives.readonly.desc}
                </p>
              </div>
              <PremiumBadge variant="secondary">OFF</PremiumBadge>
            </button>
            <button className="w-full flex justify-between items-center p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 hover:bg-rose-500/20 transition-all">
              <div className="text-left">
                <p className="text-sm font-bold text-rose-500">
                  {t.sovereignty.directives.emergency.title}
                </p>
                <p className="text-[9px] text-rose-400/70">
                  {t.sovereignty.directives.emergency.desc}
                </p>
              </div>
              <Icons.ShieldAlert className="w-5 h-5 text-rose-500" />
            </button>
          </div>
        </PremiumCard>

        {/* 💾 BACKUP & RESTORE */}
        <PremiumCard className="border-emerald-500/20">
          <h2 className="text-sm font-bold text-emerald-400 mb-4 uppercase flex items-center gap-2">
            <Icons.Globe className="w-4 h-4" />
            {t.sovereignty.backup.title}
          </h2>
          <div className="p-4 bg-slate-900/50 rounded-xl mb-4 text-sm font-bold text-slate-500 font-mono">
            {t.sovereignty.backup.last_snapshot}: 2026-01-31 03:00 AM
            <br />
            {t.sovereignty.backup.size}: 245.8 MB (Integrity Verified)
          </div>
          <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            {t.sovereignty.backup.generate}
          </button>
        </PremiumCard>
      </div>
    </div>
  );
}
