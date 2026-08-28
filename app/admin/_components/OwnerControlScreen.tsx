"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { KPICard } from "./KPICard";
import { Icons } from "@/components/ui/Icons";
import { panicLockdown } from "@/app/actions/lockdown";
import { broadcastSystemMessage } from "@/app/actions/admin-sovereignty";
import { toast } from "sonner";

// ... imports
import { DictionaryType } from "@/lib/dictionary";

interface OwnerControlScreenProps {
  data: {
    kpis: {
      activeTenants: number;
      systemAlerts: number;
      storage: string;
      [key: string]: unknown;
    };
    recentAlerts?: Array<{
      id: string;
      message: string;
      company?: { slug: string };
    }>;
    companies?: Array<{
      id: string;
      name: string;
      status: string;
    }>;
    [key: string]: unknown;
  };
  dict: DictionaryType;
}

export function OwnerControlScreen({ data, dict }: OwnerControlScreenProps) {
  const totalCompanies = data.kpis.activeTenants || 0;
  const activeCompanies =
    data.companies?.filter((c) => c.status === "ACTIVE").length || 0;
  const alertsCount = data.kpis.systemAlerts || 0;
  const storage = data.kpis.storage || "0 GB";

  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [isBroadcastPending, startBroadcastTransition] = useTransition();

  const handleBroadcast = () => {
    if (!broadcastMsg || broadcastMsg.trim().length < 3) {
      toast.error("يرجى كتابة نص الرسالة (3 أحرف على الأقل)");
      return;
    }
    startBroadcastTransition(async () => {
      const res = await broadcastSystemMessage(broadcastMsg);
      if (res.success) {
        toast.success("تم بث الرسالة بنجاح لجميع المتصلين بالنظام!");
        setBroadcastMsg("");
        setIsBroadcastOpen(false);
      } else {
        toast.error(res.error || "فشل بث الرسالة");
      }
    });
  };

  const handlePanic = async () => {
    try {
      const res = await panicLockdown();
      if (res.success) {
        window.location.href = "/admin/lockdown-confirm";
      } else {
        toast.error(res.error || "فشل تفعيل الإغلاق الطارئ");
      }
    } catch (e: unknown) {
      toast.error("خطأ غير متوقع: " + (e as Error).message);
    }
  };

  return (
    <div className="h-full gradient-bg relative overflow-hidden">
      {/* Floating Orbs */}
      <div className="orb w-96 h-96 bg-indigo-500 top-0 right-0 delay-0" />
      <div className="orb w-80 h-80 bg-violet-500 bottom-0 left-0 delay-[5s]" />
      <div className="orb w-64 h-64 bg-cyan-500 top-1/2 left-1/2 delay-[10s]" />

      {/* Content */}
      <div className="relative z-10 p-4 space-y-4 h-full">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            title={
              dict.admin?.dashboard?.kpi?.active_tenants || "Active Tenants"
            }
            value={totalCompanies}
            change={12}
            icon="Factory"
            gradient="kpi-gradient-1"
            iconColor="text-indigo-400"
          />
          <KPICard
            title={dict.admin?.dashboard?.kpi?.active}
            value={activeCompanies}
            change={8}
            icon="CheckCircle"
            gradient="kpi-gradient-2"
            iconColor="text-emerald-400"
          />
          <KPICard
            title={dict.admin?.dashboard?.kpi?.system_alerts}
            value={alertsCount}
            change={-5}
            icon="AlertTriangle"
            gradient="kpi-gradient-3"
            iconColor="text-amber-400"
          />
          <KPICard
            title={dict.admin?.dashboard?.health?.storage || "Storage"}
            value={storage}
            icon="Box"
            gradient="kpi-gradient-4"
            iconColor="text-rose-400"
          />
        </div>

        {/* Vitality Section: Quick Actions & Financials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-slide-up [animation-delay:0.05s]">
          {/* Quick Actions (Spans 1 col on large screens) */}
          <div className="glass-card p-4 rounded-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Icons.Zap className="w-4 h-4 text-amber-400" />
              {dict.admin?.dashboard?.quick_actions?.title}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(true)}
                title={dict.admin?.dashboard?.quick_actions?.broadcast}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Radio className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm font-bold font-medium text-slate-300 group-hover:text-white transition-colors">
                  {dict.admin?.dashboard?.quick_actions?.broadcast}
                </span>
              </button>
              <button
                onClick={handlePanic}
                title={
                  dict.admin?.dashboard?.quick_actions?.lock || "إغلاق طارئ"
                }
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-rose-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform animate-pulse">
                  <Icons.Lock className="w-4 h-4 text-rose-450 animate-bounce" />
                </div>
                <span className="text-sm font-bold font-medium text-red-400 group-hover:text-red-300 transition-colors">
                  {dict.admin?.dashboard?.quick_actions?.lock || "إغلاق طارئ"}
                </span>
              </button>
              <Link
                href="/admin/settings/backup"
                title={dict.admin?.dashboard?.quick_actions?.backup}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Database className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-bold font-medium text-slate-300 group-hover:text-white transition-colors">
                  {dict.admin?.dashboard?.quick_actions?.backup}
                </span>
              </Link>
              <Link
                href="/admin/settings/ledger"
                title="آلة الزمن"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Clock className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-bold font-medium text-slate-300 group-hover:text-white transition-colors">
                  سجل آلة الزمن
                </span>
              </Link>
              <button
                title={dict.admin?.dashboard?.quick_actions?.new_tenant}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Plus className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm font-bold font-medium text-slate-300 group-hover:text-white transition-colors">
                  {dict.admin?.dashboard?.quick_actions?.new_tenant}
                </span>
              </button>
            </div>
          </div>

          {/* Financial Snapshot */}
          <div className="glass-card p-4 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              {dict.admin?.dashboard?.financial?.title}
              <Icons.Globe className="w-4 h-4 text-emerald-400" />
            </h3>
            <div className="space-y-4 relative z-10">
              <div>
                <p className="text-sm font-bold text-slate-400 mb-1">
                  {dict.admin?.dashboard?.financial?.revenue}
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white tracking-tight">
                    $128,450
                  </span>
                  <span className="text-sm font-bold text-emerald-400 mb-1">
                    +14.2%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className="flex-1">
                  <p className="text-[9px] text-slate-500 mb-0.5">
                    {dict.admin?.dashboard?.financial?.pending}
                  </p>
                  <p className="text-sm font-bold text-amber-400">
                    $12,500{" "}
                    <span className="text-[9px] text-slate-500 font-normal">
                      (3)
                    </span>
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-slate-500 mb-0.5">
                    {dict.admin?.dashboard?.financial?.growth}
                  </p>
                  <p className="text-sm font-bold text-cyan-400">+2.4%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Activity Chart */}
          <div className="glass-card glass-card-hover p-4 rounded-xl animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">
                {dict.admin?.dashboard?.sections?.system_activity}
              </h2>
              <select
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-slate-300"
                aria-label="Select Period"
              >
                <option>7 Days</option>
                <option>30 Days</option>
                <option>90 Days</option>
              </select>
            </div>
            <div className="h-48 flex items-end justify-around gap-1">
              {[65, 85, 45, 90, 75, 60, 95].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-violet-500 transition-all hover:opacity-80"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[9px] text-slate-500">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="glass-card glass-card-hover p-4 rounded-xl animate-slide-up [animation-delay:0.1s]">
            <h2 className="text-sm font-bold text-white mb-3">
              {dict.admin?.dashboard?.sections?.recent_tenants}
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-300">
                    {dict.companies?.list?.status_active}
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {activeCompanies}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                    style={{
                      width: `${(activeCompanies / totalCompanies) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-300">
                    {dict.companies?.list?.status_suspended}
                  </span>
                  <span className="text-sm font-bold text-amber-400">
                    {data.companies?.filter((c) => c.status === "SUSPENDED")
                      .length || 0}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                    style={{
                      width: `${((data.companies?.filter((c) => c.status === "SUSPENDED").length || 0) / totalCompanies) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-300">
                    Trial
                  </span>
                  <span className="text-sm font-bold text-indigo-400">
                    {data.companies?.filter((c) => c.status === "TRIAL")
                      .length || 0}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full"
                    style={{
                      width: `${((data.companies?.filter((c) => c.status === "TRIAL").length || 0) / totalCompanies) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card glass-card-hover p-4 rounded-xl animate-slide-up [animation-delay:0.2s]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">
              {dict.admin?.dashboard?.tabs?.overview}
            </h2>
            <button
              title={dict.admin?.dashboard?.sections?.view_all}
              className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {dict.admin?.dashboard?.sections?.view_all}
            </button>
          </div>
          <div className="space-y-2">
            {(data.recentAlerts || []).slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Icons.Bell className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white font-medium truncate">
                    {alert.message}
                  </p>
                  <p className="text-sm font-bold text-slate-500 mt-0.5">
                    {dict.common.time.just_now}
                  </p>
                </div>
                <Icons.ChevronLeft className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </div>
            ))}
            {(!data.recentAlerts || data.recentAlerts.length === 0) && (
              <div className="py-6 text-center">
                <Icons.CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-50" />
                <p className="text-slate-400 text-sm font-bold">
                  {dict.admin?.dashboard?.kpi?.all_clear}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Broadcast Message Modal */}
      {isBroadcastOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="w-full max-w-md p-6 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Icons.Radio className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-base font-black text-white">
                بث رسالة عامة للشركات
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">
              سيتم عرض هذه الرسالة بشكل فوري وحي في لوحة تحكم جميع المستخدمين
              والشركات المتصلة بالنظام حالياً.
            </p>
            <textarea
              className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-indigo-500"
              rows={4}
              placeholder="اكتب رسالة البث هنا..."
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white/5 rounded-xl transition-all"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isBroadcastPending}
                onClick={handleBroadcast}
                className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                {isBroadcastPending ? (
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Icons.Radio className="w-4 h-4" />
                )}
                إرسال البث الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
