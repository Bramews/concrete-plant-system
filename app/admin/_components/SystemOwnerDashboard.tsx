"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { KPICard } from "./KPICard";
import { Icons } from "@/components/ui/Icons";
import { DictionaryType } from "@/lib/dictionary";
import { toast } from "sonner";
import {
  toggleSystemLock,
  broadcastSystemMessage,
} from "@/app/actions/admin-sovereignty";
import { getTunnelStatus, startTunnel, stopTunnel } from "@/app/actions/tunnel";

interface DashboardProps {
  data: {
    kpis: {
      activeTenants: number;
      systemAlerts: number;
      storage: string;
      totalRevenue?: number;
      pendingRevenue?: number;
      pendingCount?: number;
      growthPercent?: number;
      activityChartData?: Array<{ day: string; count: number }>;
      [key: string]: unknown;
    };
    recentAlerts?: Array<{
      id: string;
      message: string;
      company?: { slug: string };
      timestamp?: string | Date;
    }>;
    companies?: Array<{
      id: string;
      name: string;
      status: string;
      createdAt?: string | Date;
    }>;
    mode?: string;
    [key: string]: unknown;
  };
  dict: DictionaryType;
  lang?: string;
}

export function SystemOwnerDashboard({
  data,
  dict,
  lang = "ar",
}: DashboardProps) {
  const companyList = ((data.companies || data.activeTenants || []) as any[]);
  const activeCountFromList = companyList.filter(
    (c: any) => c.status === "ACTIVE" || !c.status,
  ).length;
  const totalCompanies = data.kpis.activeTenants || companyList.length || 0;
  const activeCompanies =
    activeCountFromList > 0 ? activeCountFromList : totalCompanies;
  const alertsCount = data.kpis.systemAlerts || 0;
  const storage = data.kpis.storage || "0 GB";

  // Real financials from DB
  const totalRevenue = data.kpis.totalRevenue || 0;
  const pendingRevenue = data.kpis.pendingRevenue || 0;
  const pendingCount = data.kpis.pendingCount || 0;
  const growthPercent = data.kpis.growthPercent || 0;

  // Chart data
  const activityChartData = data.kpis.activityChartData || [
    { day: "Sun", count: 0 },
    { day: "Mon", count: 0 },
    { day: "Tue", count: 0 },
    { day: "Wed", count: 0 },
    { day: "Thu", count: 0 },
    { day: "Fri", count: 0 },
    { day: "Sat", count: 0 },
  ];
  const maxCount = Math.max(...activityChartData.map((d: any) => d.count), 0);

  // Calculate companies change in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const companiesBefore =
    companyList.filter(
      (c: any) => c.createdAt && new Date(c.createdAt) < thirtyDaysAgo,
    );
  const companiesNew =
    companyList.filter(
      (c: any) => c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo,
    );
  const companiesChange =
    companiesBefore.length > 0
      ? Math.round((companiesNew.length / companiesBefore.length) * 100)
      : companiesNew.length > 0
        ? 100
        : 0;

  // States
  const [isLocked, setIsLocked] = useState(data.mode === "EMERGENCY");
  const [isLockPending, startLockTransition] = useTransition();

  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [isBroadcastPending, startBroadcastTransition] = useTransition();

  const [isTunnelActive, setIsTunnelActive] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState("");
  const [tunnelStatus, setTunnelStatus] = useState("INACTIVE");
  const [isTunnelOpen, setIsTunnelOpen] = useState(false);
  const [isTunnelPending, startTunnelTransition] = useTransition();

  const loadTunnelStatus = async () => {
    try {
      const res = await getTunnelStatus();
      setIsTunnelActive(res.isActive);
      setTunnelUrl(res.url);
      setTunnelStatus(res.status);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTunnelStatus();
    let interval: any;
    if (tunnelStatus === "STARTING") {
      interval = setInterval(loadTunnelStatus, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [tunnelStatus]);

  // Relative Time Helper
  const formatRelativeTime = (dateInput: string | Date | undefined) => {
    if (!dateInput) return dict.common?.time?.just_now || "Just Now";
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const isAr = lang === "ar";

    if (diffMins < 1) return dict.common?.time?.just_now || "Just Now";
    if (diffMins < 60)
      return isAr ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24)
      return isAr ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    return isAr ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  };

  const handleLockToggle = () => {
    startLockTransition(async () => {
      const res = await toggleSystemLock();
      if (res.success) {
        setIsLocked(res.isLocked ?? false);
        toast.success(
          res.isLocked
            ? "تم قفل النظام وتفعيل وضع الطوارئ"
            : "تم فتح قفل النظام بنجاح",
        );
      } else {
        toast.error("فشل تغيير حالة قفل النظام: " + res.error);
      }
    });
  };

  const handleBroadcast = () => {
    if (!broadcastMsg || broadcastMsg.trim().length < 3) {
      toast.error("يرجى كتابة رسالة بث لا تقل عن 3 أحرف");
      return;
    }
    startBroadcastTransition(async () => {
      const res = await broadcastSystemMessage(broadcastMsg);
      if (res.success) {
        toast.success("تم بث الرسالة لجميع الأجهزة المتصلة بنجاح");
        setBroadcastMsg("");
        setIsBroadcastOpen(false);
      } else {
        toast.error("فشل إرسال البث: " + res.error);
      }
    });
  };

  return (
    <div className="h-full gradient-bg relative overflow-hidden">
      {/* Floating Orbs */}
      <div className="orb w-96 h-96 bg-indigo-500 top-0 right-0 delay-0 animate-pulse duration-10000" />
      <div className="orb w-80 h-80 bg-violet-500 bottom-0 left-0 delay-[5s] animate-pulse duration-10000" />
      <div className="orb w-64 h-64 bg-cyan-500 top-1/2 left-1/2 delay-[10s] animate-pulse duration-10000" />

      {/* Content */}
      <div className="relative z-10 p-4 space-y-4 h-full">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            title={dict.dashboard?.kpi?.active_tenants || "Active Tenants"}
            value={totalCompanies}
            change={companiesChange}
            icon="Factory"
            gradient="kpi-gradient-1"
            iconColor="text-indigo-400"
            href="/admin/companies"
          />
          <KPICard
            title={dict.dashboard?.kpi?.active || "Active"}
            value={activeCompanies}
            change={companiesChange}
            icon="CheckCircle"
            gradient="kpi-gradient-2"
            iconColor="text-emerald-400"
            href="/admin/companies"
          />
          <KPICard
            title={dict.dashboard?.kpi?.system_alerts || "System Alerts"}
            value={alertsCount}
            change={undefined}
            icon="AlertTriangle"
            gradient="kpi-gradient-3"
            iconColor="text-amber-400"
            href="/admin/alerts"
          />
          <KPICard
            title={dict.dashboard?.health?.storage || "Storage"}
            value={storage}
            icon="Box"
            gradient="kpi-gradient-4"
            iconColor="text-rose-400"
            href="/admin/settings/backup"
          />
        </div>

        {/* Vitality Section: Quick Actions & Financials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-slide-up [animation-delay:0.05s]">
          {/* Quick Actions (Spans 1 col on large screens) */}
          <div className="glass-card p-4 rounded-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Icons.Zap className="w-4 h-4 text-amber-400" />
              {dict.dashboard?.quick_actions?.title || "Quick Actions"}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <button
                onClick={() => setIsBroadcastOpen(true)}
                title={dict.dashboard?.quick_actions?.broadcast || "Broadcast"}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Radio className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm font-bold font-medium text-slate-300 group-hover:text-white transition-colors">
                  {dict.dashboard?.quick_actions?.broadcast || "Broadcast"}
                </span>
              </button>
              <button
                onClick={handleLockToggle}
                disabled={isLockPending}
                title={
                  isLocked
                    ? "إلغاء قفل النظام"
                    : dict.dashboard?.quick_actions?.lock || "Lock System"
                }
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all group ${
                  isLocked
                    ? "bg-rose-500/20 border-rose-500/50 hover:bg-rose-500/30 text-rose-400"
                    : "bg-white/5 hover:bg-white/10 border-white/5 hover:border-rose-500/30 text-slate-300"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${isLocked ? "bg-rose-500/30" : "bg-rose-500/20"}`}
                >
                  {isLocked ? (
                    <Icons.Unlock className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Icons.Lock className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <span className="text-sm font-bold font-medium group-hover:text-white transition-colors">
                  {isLocked
                    ? "إلغاء القفل"
                    : dict.dashboard?.quick_actions?.lock || "Lock System"}
                </span>
              </button>
              <button
                onClick={() => setIsTunnelOpen(true)}
                title="نفق البث ومشاركة الشاشة للضيوف"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all group"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${isTunnelActive ? "bg-emerald-500/20" : "bg-blue-500/20"}`}
                >
                  <Icons.Radio
                    className={`w-4 h-4 ${isTunnelActive ? "text-emerald-400 animate-pulse" : "text-blue-400"}`}
                  />
                </div>
                <span className="text-sm font-bold font-medium text-slate-300 group-hover:text-white transition-colors">
                  نفق البث
                </span>
              </button>
              <Link
                href="/admin/settings/backup"
                title={dict.dashboard?.quick_actions?.backup || "Backup"}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Database className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-bold font-medium text-slate-300 group-hover:text-white transition-colors">
                  {dict.dashboard?.quick_actions?.backup || "Backup"}
                </span>
              </Link>
              <Link
                href="/admin/settings/ledger"
                title="سجل آلة الزمن"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Clock className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-bold font-medium text-slate-300 group-hover:text-white transition-colors">
                  سجل آلة الزمن
                </span>
              </Link>
              <Link
                href="/admin/companies/new"
                title={
                  dict.dashboard?.quick_actions?.new_tenant || "New Tenant"
                }
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Plus className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm font-bold font-medium text-slate-300 group-hover:text-white transition-colors">
                  {dict.dashboard?.quick_actions?.new_tenant || "New Tenant"}
                </span>
              </Link>
            </div>
          </div>

          {/* Financial Snapshot */}
          <div className="glass-card p-4 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              {dict.dashboard?.financial?.title || "Revenue"}
              <Icons.Globe className="w-4 h-4 text-emerald-400" />
            </h3>
            <div className="space-y-4 relative z-10">
              <div>
                <p className="text-sm font-bold text-slate-400 mb-1">
                  {dict.dashboard?.financial?.revenue || "Monthly Revenue"}
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white tracking-tight">
                    {totalRevenue.toLocaleString(
                      lang === "ar" ? "ar-IQ" : "en-US",
                      { style: "currency", currency: "IQD" },
                    )}
                  </span>
                  <span
                    className={`text-sm font-bold mb-1 ${growthPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {growthPercent >= 0
                      ? `+${growthPercent}%`
                      : `${growthPercent}%`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className="flex-1">
                  <p className="text-[9px] text-slate-500 mb-0.5">
                    {dict.dashboard?.financial?.pending || "Pending"}
                  </p>
                  <p className="text-sm font-bold text-amber-400">
                    {pendingRevenue.toLocaleString(
                      lang === "ar" ? "ar-IQ" : "en-US",
                      { style: "currency", currency: "IQD" },
                    )}{" "}
                    <span className="text-[9px] text-slate-500 font-normal">
                      ({pendingCount})
                    </span>
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-slate-500 mb-0.5">
                    {dict.dashboard?.financial?.growth || "Growth"}
                  </p>
                  <p className="text-sm font-bold text-cyan-400">
                    {growthPercent >= 0
                      ? `+${growthPercent}%`
                      : `${growthPercent}%`}
                  </p>
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
                {dict.dashboard?.sections?.system_activity || "System Activity"}
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-slate-300">
                7 Days
              </div>
            </div>
            <div className="h-48 flex items-end justify-around gap-1">
              {activityChartData.map((dayData: any, i: number) => {
                const height =
                  maxCount > 0 ? (dayData.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-violet-500 transition-all hover:opacity-80"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${dayData.count} logs`}
                    />
                    <span className="text-[9px] text-slate-500">
                      {dayData.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="glass-card glass-card-hover p-4 rounded-xl animate-slide-up [animation-delay:0.1s]">
            <h2 className="text-sm font-bold text-white mb-3">
              {dict.dashboard?.sections?.recent_tenants ||
                "Tenant Distribution"}
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-300">
                    {dict.companies?.list?.status_active || "Active"}
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {activeCompanies}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                    style={{
                      width: `${(activeCompanies / (totalCompanies || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-300">
                    {dict.companies?.list?.status_suspended || "Suspended"}
                  </span>
                  <span className="text-sm font-bold text-amber-400">
                    {data.companies?.filter(
                      (c: any) => c.status === "SUSPENDED",
                    ).length || 0}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                    style={{
                      width: `${((data.companies?.filter((c: any) => c.status === "SUSPENDED").length || 0) / (totalCompanies || 1)) * 100}%`,
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
                    {data.companies?.filter((c: any) => c.status === "TRIAL")
                      .length || 0}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full"
                    style={{
                      width: `${((data.companies?.filter((c: any) => c.status === "TRIAL").length || 0) / (totalCompanies || 1)) * 100}%`,
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
              {dict.dashboard?.tabs?.overview || "Recent Activity"}
            </h2>
            <Link
              href="/admin/alerts"
              className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {dict.dashboard?.sections?.view_all || "View All"}
            </Link>
          </div>
          <div className="space-y-2">
            {(data.recentAlerts || []).slice(0, 4).map((alert: any) => (
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
                    {formatRelativeTime(alert.timestamp)}
                  </p>
                </div>
                <Icons.ChevronLeft className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </div>
            ))}
            {(!data.recentAlerts || data.recentAlerts.length === 0) && (
              <div className="py-6 text-center">
                <Icons.CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-50" />
                <p className="text-slate-400 text-sm font-bold">
                  {dict.dashboard?.kpi?.all_clear || "All Clear"}
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

      {/* Guest Tunnel Modal */}
      {isTunnelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-xl animate-scale-up space-y-6">
            <button
              onClick={() => setIsTunnelOpen(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors font-bold text-sm bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 text-xl">
                🌐
              </div>
              <h3 className="text-lg font-black text-white">
                نفق البث ومشاركة الشاشة
              </h3>
              <p className="text-xs text-slate-400">
                تحكم ببث الشاشات والخلطات للضيوف والمقاولين الخارجيين.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  حالة النفق:
                </span>
                {tunnelStatus === "ACTIVE" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    نشط ويعمل
                  </span>
                ) : tunnelStatus === "STARTING" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Icons.Radio className="w-3 h-3 animate-spin text-amber-400" />
                    جاري التفعيل...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    متوقف بالكامل
                  </span>
                )}
              </div>

              {tunnelStatus === "ACTIVE" && tunnelUrl && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[11px] font-bold text-slate-400">
                    رابط الضيوف الخارجي:
                  </span>
                  <div className="flex items-center gap-2 bg-slate-900/80 rounded-lg p-2.5 border border-white/5">
                    <span className="text-xs text-blue-400 select-all truncate flex-1 dir-ltr text-left">
                      {tunnelUrl}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tunnelUrl);
                        toast.success("تم نسخ رابط الضيوف");
                      }}
                      className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded"
                      title="نسخ"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                startTunnelTransition(async () => {
                  if (isTunnelActive || tunnelStatus === "ACTIVE") {
                    setTunnelStatus("INACTIVE");
                    const res = await stopTunnel();
                    if (res.success) {
                      setIsTunnelActive(false);
                      setTunnelUrl("");
                      toast.success("تم إيقاف نفق البث للضيوف");
                    } else {
                      toast.error(res.error || "فشل إيقاف النفق");
                    }
                  } else {
                    setTunnelStatus("STARTING");
                    const res = await startTunnel();
                    if (res.success) {
                      if (res.url) {
                        setIsTunnelActive(true);
                        setTunnelStatus("ACTIVE");
                        setTunnelUrl(res.url);
                        toast.success("تم تشغيل نفق البث وتوليد الرابط");
                      } else {
                        toast.info("جاري تهيئة النفق وتوليد الرابط...");
                      }
                    } else {
                      setTunnelStatus("INACTIVE");
                      toast.error(res.error || "فشل تشغيل النفق");
                    }
                  }
                });
              }}
              disabled={tunnelStatus === "STARTING" || isTunnelPending}
              className={`w-full py-3 rounded-xl font-black text-sm text-white shadow-lg transition-all duration-300 ${
                isTunnelActive || tunnelStatus === "ACTIVE"
                  ? "bg-rose-600 hover:bg-rose-500 hover:shadow-rose-600/20"
                  : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-600/20"
              } disabled:opacity-50`}
            >
              {tunnelStatus === "STARTING" || isTunnelPending
                ? "جاري تهيئة الاتصال..."
                : isTunnelActive || tunnelStatus === "ACTIVE"
                  ? "إيقاف نفق البث"
                  : "تفعيل نفق البث"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
