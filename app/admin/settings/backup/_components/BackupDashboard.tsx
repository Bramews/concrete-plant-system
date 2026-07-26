"use client";

import { useState } from "react";
import {
  Database,
  HardDrive,
  Clock,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  FileWarning,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface Backup {
  id: number;
  filename: string;
  sizeBytes: number;
  status: string;
  testStatus: string | null;
  timestamp: Date;
  type: string | null;
  durationMs: number | null;
  encrypted: boolean | null;
  storage: string | null;
  creator: string | null;
}

interface BackupDashboardProps {
  backups: Backup[];
  autoSettings: {
    enabled: boolean;
    frequency: string;
    retention: number;
    lastRun: Date | null;
    nextRun: Date | null;
  };
  healthStatus: {
    status: string;
    reason: string;
    successRate: number;
    lastBackupTime: Date | null;
  };
  totalDiskCapacity?: number;
  freeDiskCapacity?: number;
}

export function BackupDashboard({
  backups,
  autoSettings,
  healthStatus,
  totalDiskCapacity,
  freeDiskCapacity,
}: BackupDashboardProps) {
  const totalBackups = backups.length;
  const totalSizeBytes = backups.reduce((sum, b) => sum + b.sizeBytes, 0);
  const successBackups = backups.filter((b) => b.status === "COMPLETED").length;
  const failedBackups = backups.filter((b) => b.status === "FAILED").length;

  // Safe math preventing logical errors if no backups exist
  const successRate =
    totalBackups > 0 ? Math.round((successBackups / totalBackups) * 100) : 0;

  const encryptedCount = backups.filter((b) => b.encrypted).length;
  const largestBackup = backups.reduce(
    (max, b) => (b.sizeBytes > max ? b.sizeBytes : max),
    0,
  );

  // Simulated or real system storage capacity
  const diskTotal = totalDiskCapacity ?? 500 * 1024 * 1024 * 1024; // fallback 500 GB
  const diskFree = freeDiskCapacity ?? diskTotal - totalSizeBytes;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 بايت";
    const k = 1024;
    const sizes = ["بايت", "كيلوبايت", "ميغابايت", "جيجابايت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "لا يوجد";
    return new Intl.DateTimeFormat("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const chartData = [...backups]
    .reverse()
    .slice(-10)
    .map((b) => ({
      name: new Intl.DateTimeFormat("ar-EG", {
        month: "short",
        day: "numeric",
      }).format(new Date(b.timestamp)),
      "الحجم (ميغابايت)": Math.round((b.sizeBytes / (1024 * 1024)) * 100) / 100,
    }));

  const typeCounts = backups.reduce(
    (acc, b) => {
      const type = b.type || "DATABASE";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const typeData = Object.entries(typeCounts).map(([key, value]) => ({
    name:
      key === "FULL"
        ? "كامل"
        : key === "DATABASE"
          ? "قاعدة بيانات"
          : key === "SETTINGS"
            ? "إعدادات"
            : key === "FULL_SNAPSHOT"
              ? "لقطة النظام"
              : "الملفات",
    العدد: value,
  }));

  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

  return (
    <div className="space-y-6">
      {/* Backup Health Panel */}
      <div
        className={`p-6 rounded-3xl border backdrop-blur-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
          healthStatus.status === "HEALTHY"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : healthStatus.status === "WARNING"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl ${
              healthStatus.status === "HEALTHY"
                ? "bg-emerald-500/20 border-emerald-500/30"
                : healthStatus.status === "WARNING"
                  ? "bg-amber-500/20 border-amber-500/30"
                  : "bg-rose-500/20 border-rose-500/30"
            } border`}
          >
            {healthStatus.status === "HEALTHY" ? (
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            ) : healthStatus.status === "WARNING" ? (
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            ) : (
              <FileWarning className="w-8 h-8 text-rose-400" />
            )}
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-white flex items-center gap-2">
              حالة سلامة وصحة النسخ:
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-bold font-black border ${
                  healthStatus.status === "HEALTHY"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : healthStatus.status === "WARNING"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {healthStatus.status === "HEALTHY"
                  ? "سليم وجاهز"
                  : healthStatus.status === "WARNING"
                    ? "تنبيه معلق"
                    : "حالة حرجة"}
              </span>
            </h4>
            <p className="text-sm font-bold text-slate-300 leading-relaxed font-bold">
              {healthStatus.reason}
            </p>
          </div>
        </div>

        {totalBackups > 0 && (
          <div className="text-right text-sm font-bold space-y-1 text-slate-400">
            <div>
              آخر فحص للسلامة:{" "}
              <span className="text-white font-bold">
                {formatDate(healthStatus.lastBackupTime)}
              </span>
            </div>
            <div>
              معدل النجاح الإجمالي:{" "}
              <span className="text-white font-bold">
                {healthStatus.successRate}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Backups */}
        <div className="group relative overflow-hidden rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-500" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                إجمالي النسخ الاحتياطية
              </p>
              <p className="text-3xl font-black text-white">{totalBackups}</p>
              <p className="text-sm font-bold text-blue-400 font-semibold">
                {encryptedCount} نسخة مشفرة AES-256
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Total Size */}
        <div className="group relative overflow-hidden rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 hover:border-violet-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/10 transition-all duration-500" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                إجمالي حجم التخزين
              </p>
              <p className="text-3xl font-black text-white">
                {formatBytes(totalSizeBytes)}
              </p>
              <p className="text-sm font-bold text-violet-400 font-semibold">
                أكبر نسخة: {formatBytes(largestBackup)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <HardDrive className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="group relative overflow-hidden rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-500" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                معدل نجاح العمليات
              </p>
              <p className="text-3xl font-black text-white">
                {totalBackups > 0 ? `${successRate}%` : "—"}
              </p>
              <p className="text-sm font-bold text-emerald-400 font-semibold">
                {successBackups} ناجحة · {failedBackups} فاشلة
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Next Backup */}
        <div className="group relative overflow-hidden rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 hover:border-amber-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-500" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                موعد النسخ التلقائي القادم
              </p>
              <p className="text-sm font-black text-white truncate max-w-[200px]">
                {autoSettings.enabled
                  ? formatDate(autoSettings.nextRun)
                  : "معطل"}
              </p>
              <p className="text-sm font-bold text-amber-400 font-semibold">
                الجدولة:{" "}
                {autoSettings.enabled ? autoSettings.frequency : "غير نشطة"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Storage Capacity Details Panel */}
      <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl space-y-4">
        <div>
          <h3 className="text-sm font-black text-white">
            إدارة مساحات التخزين والخادم
          </h3>
          <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
            توزيع الحجم المتاح والمستهلك الفعلي
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-bold">
          {/* Capacity Progress Bar */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex justify-between font-bold text-slate-400">
              <span>نسبة استخدام مساحة التخزين الخاصة بالخادم:</span>
              <span className="text-white">
                {((totalSizeBytes / diskTotal) * 100).toFixed(4)}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-blue-500 to-indigo-500 rounded-full"
                style={{
                  width: `${Math.max(1, (totalSizeBytes / diskTotal) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>المساحة الكلية المقدرة: {formatBytes(diskTotal)}</span>
              <span>المساحة المتبقية: {formatBytes(diskFree)}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2 flex flex-col justify-center">
            <div className="flex justify-between">
              <span className="text-slate-500">أكبر حجم نسخة:</span>
              <span className="text-white font-bold">
                {formatBytes(largestBackup)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">أحدث تاريخ تشغيل:</span>
              <span className="text-white font-bold">
                {formatDate(backups[0]?.timestamp || null)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Size Growth */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col space-y-4">
          <div>
            <h3 className="text-sm font-black text-white">
              منحنى نمو حجم النسخ
            </h3>
            <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
              مقارنة الحجم الإجمالي لآخر 10 نسخ
            </p>
          </div>
          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm font-bold">
                لا تتوفر بيانات كافية للرسم البياني
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="الحجم (ميغابايت)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSize)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart: Types Distribution */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col space-y-4">
          <div>
            <h3 className="text-sm font-black text-white">توزيع أنواع النسخ</h3>
            <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
              تكرار كل نوع في قاعدة البيانات
            </p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {typeData.length === 0 ? (
              <div className="text-slate-500 text-sm font-bold">
                لا تتوفر بيانات
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={typeData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="العدد" radius={[8, 8, 0, 0]}>
                    {typeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
