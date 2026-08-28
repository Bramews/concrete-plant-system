"use client";

import { useState, useEffect, useRef } from "react";
import { triggerManualBackup } from "@/app/actions/backup";
import {
  Database,
  Shield,
  Lock,
  FileText,
  LayoutGrid,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Archive,
  GitCompare,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type { DictionaryType } from "@/lib/dictionary";

interface BackupRecord {
  id: number;
  filename: string;
  sizeBytes: number;
  status: string;
  testStatus?: string | null;
  timestamp: Date | string;
  type?: string | null;
  durationMs?: number | null;
  encrypted?: boolean | null;
  storage?: string | null;
  creator?: string | null;
  integrityHash?: string | null;
  error?: string;
}

interface ManualBackupWizardProps {
  dict: DictionaryType;
}

type BackupType =
  | "FULL"
  | "DATABASE"
  | "FILES"
  | "SETTINGS"
  | "FULL_SNAPSHOT"
  | "INCREMENTAL"
  | "DIFFERENTIAL";

export function ManualBackupWizard({ dict }: ManualBackupWizardProps) {
  const router = useRouter();
  const [backupType, setBackupType] = useState<BackupType>("DATABASE");
  const [encrypt, setEncrypt] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [customName, setCustomName] = useState("");

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState("0 KB/s");
  const [timeRemaining, setTimeRemaining] = useState("-");
  const [bytesProcessed, setBytesProcessed] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<BackupRecord | { error: string } | null>(
    null,
  );
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const getExpectedStats = (type: BackupType) => {
    switch (type) {
      case "FULL_SNAPSHOT":
        return {
          size: "حوالي 30-80 ميغابايت",
          time: "~ 12-25 ثانية",
          files:
            "كامل الكود البرمجي بالنظام + قاعدة البيانات + الملفات + متغيرات البيئة (.env) وتكوينات الخادم",
        };
      case "FULL":
        return {
          size: "حوالي 15-50 ميغابايت",
          time: "~ 8-15 ثانية",
          files: "قاعدة البيانات + جميع المرفوعات + إعدادات النظام",
        };
      case "DATABASE":
        return {
          size: "حوالي 2-5 ميغابايت",
          time: "~ 2-4 ثانية",
          files: "ملف dev.db ومحتوياته بالكامل",
        };
      case "FILES":
        return {
          size: "حوالي 10-30 ميغابايت",
          time: "~ 5-10 ثانية",
          files: "المرفوعات والصور داخل public/uploads",
        };
      case "SETTINGS":
        return {
          size: "حوالي 50 كيلوبايت",
          time: "~ 1-2 ثانية",
          files: "جدول الإعدادات العامة والتخصيص",
        };
      case "INCREMENTAL":
        return {
          size: "حوالي 500 كيلوبايت - 5 ميغابايت",
          time: "~ 3-6 ثانية",
          files:
            "قاعدة البيانات + الملفات والاضافات الجديدة فقط منذ آخر نسخة احتياطية ناجحة",
        };
      case "DIFFERENTIAL":
        return {
          size: "حوالي 1-10 ميغابايت",
          time: "~ 4-8 ثانية",
          files:
            "قاعدة البيانات + الملفات والاضافات الجديدة منذ آخر نسخة كاملة (Full Backup)",
        };
    }
  };

  const currentStats = getExpectedStats(backupType);

  const addLog = (msg: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString("ar-EG")}] ${msg}`,
    ]);
  };

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const runBackup = async () => {
    if (encrypt && !password) {
      toast.error("الرجاء إدخال كلمة مرور لتشفير النسخة الاحتياطية");
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResult(null);
    setLogs([]);
    addLog(`بدء التحضير للنسخة الاحتياطية يدويًا...`);
    addLog(
      `النوع المحدد: ${
        backupType === "FULL_SNAPSHOT"
          ? "لقطة النظام الكاملة (Full System Snapshot)"
          : backupType === "FULL"
            ? "نسخة كاملة للبيانات"
            : backupType === "DATABASE"
              ? "قاعدة البيانات"
              : backupType === "FILES"
                ? "الملفات"
                : backupType === "SETTINGS"
                  ? "الإعدادات"
                  : backupType === "INCREMENTAL"
                    ? "تراكمي (Incremental)"
                    : "تفاضلي (Differential)"
      }`,
    );
    addLog(`خيار التشفير: ${encrypt ? "نشط (AES-256)" : "معطل"}`);

    let currentProgress = 0;
    const interval = setInterval(() => {
      if (currentProgress < 90) {
        currentProgress += Math.floor(Math.random() * 8) + 2;
        if (currentProgress > 90) currentProgress = 90;
        setProgress(currentProgress);

        const kbps = Math.floor(Math.random() * 1500) + 500;
        setSpeed(`${(kbps / 1024).toFixed(2)} MB/s`);
        const remainingSeconds = Math.max(
          1,
          Math.round((100 - currentProgress) * 0.2),
        );
        setTimeRemaining(`${remainingSeconds} ثانية`);

        const processed = Math.floor(
          (currentProgress / 100) *
            (backupType === "FULL_SNAPSHOT"
              ? 50000000
              : backupType === "FULL"
                ? 25000000
                : backupType === "DATABASE"
                  ? 3500000
                  : backupType === "FILES"
                    ? 20000000
                    : backupType === "INCREMENTAL"
                      ? 2500000
                      : backupType === "DIFFERENTIAL"
                        ? 5000000
                        : 50000),
        );
        setBytesProcessed(processed);

        if (
          currentProgress > 10 &&
          currentProgress <= 25 &&
          !logs.some((l) => l.includes("تجميع البيانات"))
        ) {
          addLog(
            "جاري قراءة الملفات والموارد والملفات المصدرية المطلوبة من القرص المحلي...",
          );
        } else if (
          currentProgress > 25 &&
          currentProgress <= 45 &&
          !logs.some((l) => l.includes("ضغط البيانات"))
        ) {
          addLog("بدء عملية الضغط خوارزمية Gzip لتحسين حجم الحزمة...");
        } else if (
          currentProgress > 45 &&
          currentProgress <= 70 &&
          encrypt &&
          !logs.some((l) => l.includes("تشفير"))
        ) {
          addLog("تطبيق خوارزمية التشفير المتناظر AES-256-CTR مع Salt و IV...");
        } else if (
          currentProgress > 70 &&
          currentProgress <= 85 &&
          !logs.some((l) => l.includes("SHA-256"))
        ) {
          addLog(
            "توليد البصمة الرقمية للتحقق من السلامة وحساب SHA-256 Hash...",
          );
        }
      }
    }, 400);

    try {
      const serverResult = await triggerManualBackup({
        type: backupType,
        encrypt,
        password,
        creator: "SYSTEM_OWNER",
        storage: "LOCAL",
        customName: customName.trim() || undefined,
      });

      clearInterval(interval);
      setProgress(100);
      setSpeed("0 KB/s");
      setTimeRemaining("انتهى");

      if (serverResult.success && serverResult.record) {
        addLog(`اكتمل حفظ الملف بنجاح باسم: ${serverResult.record.filename}`);
        addLog(
          `إجمالي الحجم الفعلي: ${(serverResult.record.sizeBytes / (1024 * 1024)).toFixed(2)} ميغابايت`,
        );
        addLog(`المدة المستغرقة: ${serverResult.record.durationMs} ملّي ثانية`);
        addLog(`رمز التحقق الفردي: ${serverResult.record.integrityHash}`);

        setResult(serverResult.record);
        toast.success("تم أخذ النسخة الاحتياطية بنجاح");
        router.refresh();
      } else {
        addLog(`حدث خطأ أثناء أخذ النسخة الاحتياطية: ${serverResult.error}`);
        toast.error("فشل إنشاء النسخة الاحتياطية");
        setResult({ error: serverResult.error || "خطأ غير معروف" });
      }
    } catch (e) {
      clearInterval(interval);
      addLog(`خطأ فادح: ${(e as Error).message || "فشل الاتصال بالخادم"}`);
      toast.error("حدث خطأ غير متوقع");
      setResult({ error: (e as Error).message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Settings Options */}
      <div className="lg:col-span-3 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-6">
        <div>
          <h3 className="text-base font-black text-white">
            معالج النسخ الاحتياطي اليدوي
          </h3>
          <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
            قم بتهيئة وحفظ نسخة أمنية جديدة فوراً
          </p>
        </div>

        {/* Backup Type Grid */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-400 block">
            حدد نوع النسخ المطلوب:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                id: "DATABASE",
                label: "قاعدة البيانات",
                icon: Database,
                desc: "بيانات المختبر والمبيعات والطلبات",
              },
              {
                id: "FULL",
                label: "كامل البيانات",
                icon: LayoutGrid,
                desc: "قاعدة البيانات + المرفوعات + الإعدادات",
              },
              {
                id: "FILES",
                label: "الملفات والمرفوعات",
                icon: FileText,
                desc: "الصور والملفات المرفوعة بالنظام",
              },
              {
                id: "SETTINGS",
                label: "الإعدادات فقط",
                icon: Shield,
                desc: "إعدادات وتخصيصات محرك العمل",
              },
              {
                id: "FULL_SNAPSHOT",
                label: "لقطة كاملة للنظام (Full Snapshot)",
                icon: Archive,
                desc: "الكود بالكامل + البيئة + قواعد البيانات + الإعدادات",
              },
              {
                id: "INCREMENTAL",
                label: "نسخ تراكمي (Incremental)",
                icon: GitCompare,
                desc: "التغييرات الحاصلة منذ آخر عملية نسخ احتياطي ناجحة",
              },
              {
                id: "DIFFERENTIAL",
                label: "نسخ تفاضلي (Differential)",
                icon: GitCompare,
                desc: "التغييرات الحاصلة منذ آخر نسخة كاملة (Full Backup)",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  disabled={isRunning}
                  onClick={() => setBackupType(item.id as BackupType)}
                  className={`flex flex-row items-center text-right p-4 rounded-2xl border transition-all duration-200 ${
                    backupType === item.id
                      ? "bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                      : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ml-3 flex-shrink-0 ${backupType === item.id ? "text-blue-400" : "text-slate-500"}`}
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-bold font-black block">
                      {item.label}
                    </span>
                    <span className="text-[9px] text-slate-500 leading-tight mt-0.5 block truncate">
                      {item.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expected Info Box */}
        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2 text-sm font-bold">
          <div className="flex justify-between">
            <span className="text-slate-500">حجم النسخة المتوقع:</span>
            <span className="text-slate-300 font-bold">
              {currentStats.size}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">الوقت التقريبي للاكتمال:</span>
            <span className="text-slate-300 font-bold">
              {currentStats.time}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">الموارد المشمولة:</span>
            <span className="text-slate-300 font-bold text-left">
              {currentStats.files}
            </span>
          </div>
        </div>

        {/* Custom Backup Name */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-400 block">
            اسم مخصص للنسخة الاحتياطية (اختياري):
          </label>
          <input
            type="text"
            value={customName}
            disabled={isRunning}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="مثال: backup-before-update (سيتم إضافة التاريخ والوقت تلقائياً)"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Security / Encryption */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-slate-400" />
              <div>
                <span className="text-sm font-bold text-white block">
                  تشفير وحماية البيانات
                </span>
                <span className="text-sm font-bold text-slate-500">
                  تشفير الملف بالكامل باستخدام معيار AES-256
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={encrypt}
                disabled={isRunning}
                onChange={(e) => setEncrypt(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {encrypt && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-sm font-bold text-slate-400 block">
                رمز حماية التشفير (مفتاح فك القفل):
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                disabled={isRunning}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل رمز حماية قوي لحماية الملف..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <div className="flex justify-between items-center text-sm font-bold">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-blue-400 font-bold hover:underline"
                >
                  {showPassword ? "إخفاء الرمز" : "إظهار الرمز"}
                </button>
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  احرص على حفظ كلمة المرور لاستعادة الملف لاحقاً
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Start Button */}
        <button
          onClick={runBackup}
          disabled={isRunning}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري تنفيذ النسخ الاحتياطي...
            </>
          ) : (
            "بدء إنشاء النسخة الاحتياطية"
          )}
        </button>
      </div>

      {/* Progress & Live Console Logs */}
      <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col space-y-6">
        <div>
          <h3 className="text-base font-black text-white">
            مراقبة تقدم التشغيل
          </h3>
          <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
            متابعة دقيقة لخطوات وسرعة النقل
          </p>
        </div>

        {/* Progress Display */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-400">
              حالة التقدم:
            </span>
            <span className="text-lg font-black text-blue-400">
              {progress}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm font-bold pt-2">
            <div>
              <span className="text-slate-500 block mb-1">السرعة الحالية</span>
              <span className="text-slate-200 font-black">{speed}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">الوقت المتبقي</span>
              <span className="text-slate-200 font-black">{timeRemaining}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">
                البيانات المعالجة
              </span>
              <span className="text-slate-200 font-black">
                {formatBytes(bytesProcessed)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">موقع الحفظ</span>
              <span className="text-slate-200 font-black">Local Storage</span>
            </div>
          </div>
        </div>

        {/* Console Logs */}
        <div className="flex-1 flex flex-col bg-slate-950/80 rounded-2xl border border-white/5 overflow-hidden min-h-[200px]">
          <div className="px-4 py-2 bg-slate-900 border-b border-white/5 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-400 font-bold uppercase tracking-wider">
              سجل التنفيذ المباشر (Console)
            </span>
          </div>
          <div className="flex-1 p-4 font-mono text-sm font-bold text-slate-300 space-y-1.5 overflow-y-auto max-h-[220px]">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600">
                بانتظار بدء العملية لتسجيل المخرجات...
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="leading-normal break-all">
                  {log}
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>

        {/* Completion Result Card */}
        {result && !result.error && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-bold">
              <span className="font-bold text-white block">تم الحفظ بنجاح</span>
              <p className="text-slate-400 mt-1">
                تأكد من فحص سلامة الملف من جدول النسخ لضمان دقة الهيكلية
                المخزنة.
              </p>
            </div>
          </div>
        )}

        {result?.error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-bold">
              <span className="font-bold text-white block">
                فشل تشغيل المهمة
              </span>
              <p className="text-slate-400 mt-1">{result.error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
