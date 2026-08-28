"use client";

import { useState, useTransition } from "react";
import { updateAutoBackupSettings } from "@/app/actions/backup";
import {
  LayoutDashboard,
  Play,
  Clock,
  HardDrive,
  RotateCcw,
  Database,
  Terminal,
  ShieldCheck,
  Loader2,
  Save,
  BellRing,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { BackupDashboard } from "./BackupDashboard";
import { ManualBackupWizard } from "./ManualBackupWizard";
import { StorageProviderSettings } from "./StorageProviderSettings";
import { DisasterRecoveryCenter } from "./DisasterRecoveryCenter";
import { BackupTable } from "./BackupTable";
import { BackupActivityLog } from "./BackupActivityLog";

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
  integrityHash: string | null;
}

import { DictionaryType } from "@/lib/dictionary";

interface LogEntry {
  id: number;
  action: string;
  details: string;
  timestamp: string;
}

interface BackupManagementClientProps {
  dict: DictionaryType;
  backups: Backup[];
  autoSettings: {
    enabled: boolean;
    frequency: string;
    retention: number;
    type?: string;
    encrypt?: boolean;
    password?: string;
    destinations?: unknown[];
    lastRun: Date | null;
    nextRun: Date | null;
  };
  logs: LogEntry[];
  healthStatus: {
    status: string;
    reason: string;
    successRate: number;
    lastBackupTime: Date | null;
  };
  totalDiskCapacity?: number;
  freeDiskCapacity?: number;
}

export function BackupManagementClient({
  dict,
  backups,
  autoSettings,
  logs,
  healthStatus,
  totalDiskCapacity,
  freeDiskCapacity,
}: BackupManagementClientProps) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isPending, startTransition] = useTransition();

  // Scheduling states
  const [autoEnabled, setAutoEnabled] = useState(autoSettings.enabled);
  const [frequency, setFrequency] = useState(autoSettings.frequency);
  const [retention, setRetention] = useState(autoSettings.retention);
  const [backupType, setBackupType] = useState(autoSettings.type || "DATABASE");
  const [encrypt, setEncrypt] = useState(autoSettings.encrypt || false);
  const [password, setPassword] = useState(autoSettings.password || "");
  const [notificationChannel, setNotificationChannel] =
    useState<string>("SYSTEM");

  const handleSaveScheduling = () => {
    startTransition(async () => {
      const res = await updateAutoBackupSettings({
        enabled: autoEnabled,
        frequency,
        retention,
        type: backupType,
        encrypt,
        password: encrypt ? password : "",
      });

      if (res.success) {
        toast.success("تم حفظ إعدادات الجدولة التلقائية بنجاح");
      } else {
        toast.error("فشل حفظ إعدادات الجدولة: " + res.error);
      }
    });
  };

  const tabs = [
    { id: "dashboard", label: "لوحة المعلومات", icon: LayoutDashboard },
    { id: "manual", label: "النسخ اليدوي", icon: Play },
    { id: "scheduling", label: "الجدولة المؤتمتة", icon: Clock },
    { id: "storage", label: "إدارة التخزين", icon: HardDrive },
    { id: "recovery", label: "استعادة الكوارث", icon: RotateCcw },
    { id: "list", label: "سجلات النسخ", icon: Database },
    { id: "logs", label: "سجل العمليات", icon: Terminal },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 backdrop-blur-xl p-6 rounded-3xl border border-white/5">
        <div>
          <h2 className="text-xl font-black text-white">
            مركز إدارة النسخ الاحتياطي واستعادة الكوارث
          </h2>
          <p className="text-sm font-bold text-slate-500 font-bold mt-1">
            Enterprise Data Protection & Business Continuity Hub
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold text-emerald-400 font-bold">
            اتصال قاعدة البيانات نشط وآمن
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-white/5 pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold font-black transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "bg-white/[0.01] border border-white/5 text-slate-400 hover:bg-white/[0.03] hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        {activeTab === "dashboard" && (
          <BackupDashboard
            backups={backups}
            autoSettings={autoSettings}
            healthStatus={healthStatus}
            totalDiskCapacity={totalDiskCapacity}
            freeDiskCapacity={freeDiskCapacity}
          />
        )}

        {activeTab === "manual" && <ManualBackupWizard dict={dict} />}

        {activeTab === "scheduling" && (
          <div className="max-w-3xl mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Clock className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  جدولة النسخ الاحتياطي التلقائي
                </h3>
                <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
                  تكوين سياسات الأتمتة والاحتفاظ بملفات الحفظ الأمنية
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Enabled toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-white block">
                    تفعيل أتمتة النسخ الاحتياطي
                  </span>
                  <span className="text-sm font-bold text-slate-500">
                    مزامنة وتشغيل المهام في الخلفية بشكل آلي
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoEnabled}
                    onChange={(e) => setAutoEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {autoEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                  {/* Frequency */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">
                      تكرار العملية (Frequency):
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-bold focus:outline-none"
                    >
                      <option value="HOURLY">كل ساعة</option>
                      <option value="DAILY">يوميًا (Daily)</option>
                      <option value="WEEKLY">أسبوعيًا (Weekly)</option>
                      <option value="MONTHLY">شهريًا (Monthly)</option>
                    </select>
                  </div>

                  {/* Retention Policy */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">
                      سياسة الاحتفاظ (Retention Limit):
                    </label>
                    <input
                      type="number"
                      value={retention}
                      onChange={(e) =>
                        setRetention(parseInt(e.target.value) || 7)
                      }
                      min={1}
                      max={60}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-bold focus:outline-none"
                      placeholder="عدد النسخ المحتفظ بها..."
                    />
                  </div>

                  {/* Backup Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">
                      نوع النسخة الاحتياطية المجدولة:
                    </label>
                    <select
                      value={backupType}
                      onChange={(e) => setBackupType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-bold focus:outline-none"
                    >
                      <option value="DATABASE">قاعدة البيانات فقط</option>
                      <option value="FULL">نسخة كاملة (Full Backup)</option>
                      <option value="FILES">الملفات المرفوعة فقط</option>
                      <option value="SETTINGS">إعدادات النظام فقط</option>
                      <option value="FULL_SNAPSHOT">
                        لقطة كاملة للنظام (Full System Snapshot)
                      </option>
                      <option value="INCREMENTAL">
                        نسخة تراكمية (Incremental Backup)
                      </option>
                      <option value="DIFFERENTIAL">
                        نسخة تفاضلية (Differential Backup)
                      </option>
                    </select>
                  </div>

                  {/* Notifications Channel */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">
                      قنوات التنبيه والإشعار:
                    </label>
                    <select
                      value={notificationChannel}
                      onChange={(e) => setNotificationChannel(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-bold focus:outline-none"
                    >
                      <option value="SYSTEM">تنبيهات النظام الداخلية</option>
                      <option value="EMAIL">البريد الإلكتروني</option>
                      <option value="TELEGRAM">
                        تلغرام بوت (Telegram API)
                      </option>
                      <option value="WHATSAPP">
                        تنبيهات واتساب (WhatsApp API)
                      </option>
                    </select>
                  </div>

                  {/* Encryption Settings */}
                  <div className="md:col-span-2 space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Settings2 className="w-4 h-4 text-slate-500" />
                        <div>
                          <span className="text-sm font-bold text-white block">
                            تشفير النسخ التلقائية
                          </span>
                          <span className="text-sm font-bold text-slate-500">
                            حماية جميع الملفات المنشأة تلقائياً بكلمة مرور
                          </span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={encrypt}
                          onChange={(e) => setEncrypt(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {encrypt && (
                      <div className="space-y-2 animate-fadeIn">
                        <label className="text-sm font-bold text-slate-400 block">
                          رمز حماية التشفير التلقائي:
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="أدخل رمز تشفير لحفظه بالإعدادات العامة..."
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={handleSaveScheduling}
                disabled={isPending}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold font-black flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                حفظ تكوين الجدولة
              </button>
            </div>
          </div>
        )}

        {activeTab === "storage" && (
          <StorageProviderSettings
            dict={dict}
            destinations={autoSettings.destinations || []}
          />
        )}

        {activeTab === "recovery" && (
          <DisasterRecoveryCenter dict={dict} backups={backups} />
        )}

        {activeTab === "list" && <BackupTable dict={dict} backups={backups} />}

        {activeTab === "logs" && <BackupActivityLog logs={logs} />}
      </div>
    </div>
  );
}
