"use client";

import { useState } from "react";
import { restoreBackup, testRestoreBackup } from "@/app/actions/backup";
import {
  ShieldAlert,
  AlertTriangle,
  Play,
  HelpCircle,
  Loader2,
  RotateCcw,
  CheckCircle2,
  FileWarning,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Backup {
  id: number;
  filename: string;
  sizeBytes: number;
  status: string;
  testStatus: string | null;
  timestamp: Date;
  type: string | null;
  encrypted: boolean | null;
}

import type { Dictionary } from "@/lib/dictionary";

interface TestReport {
  type?: string;
  sizeBytes?: number;
  tablesVerified?: number;
  filesCount?: number;
  envParsed?: boolean;
  error?: string;
}

interface DisasterRecoveryCenterProps {
  dict: Dictionary;
  backups: Backup[];
}

export function DisasterRecoveryCenter({
  dict,
  backups,
}: DisasterRecoveryCenterProps) {
  const router = useRouter();
  const [selectedBackupId, setSelectedBackupId] = useState<number | "">("");
  const [restoreType, setRestoreType] = useState<string>("DATABASE");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Execution status
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);

  // Staging Test Report State
  const [testReport, setTestReport] = useState<TestReport | null>(null);

  const selectedBackup = backups.find((b) => b.id === Number(selectedBackupId));

  const handleTestRestore = async () => {
    if (!selectedBackupId) {
      toast.error("الرجاء اختيار نسخة احتياطية أولاً");
      return;
    }

    setIsTesting(true);
    setTestReport(null);
    setResult(null);

    try {
      const res = await testRestoreBackup(
        Number(selectedBackupId),
        selectedBackup?.encrypted ? password : undefined,
      );
      if (res.success && res.report) {
        setTestReport(res.report);
        toast.success("تم إجراء فحص محاكاة الاستعادة بنجاح");
      } else {
        toast.error("فشلت محاكاة الاستعادة: " + (res.message || res.error));
        setTestReport({ error: res.message || res.error });
      }
    } catch (e) {
      toast.error("حدث خطأ غير متوقع أثناء الفحص");
      setTestReport({ error: (e as Error).message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackupId) {
      toast.error("الرجاء اختيار نسخة احتياطية أولاً");
      return;
    }

    if (selectedBackup?.encrypted && !password) {
      toast.error("الرجاء إدخال رمز فك تشفير النسخة الاحتياطية");
      return;
    }

    if (confirmText !== verificationCode) {
      toast.error(
        `الرجاء كتابة رمز التحقق العشوائي "${verificationCode}" للتحقق من هويتك`,
      );
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResult(null);

    setStatusMsg(
      "الخطوة 1/4: أخذ لقطة حماية تلقائية مسبقاً (Safety Snapshot)...",
    );
    setProgress(15);

    setTimeout(() => {
      setStatusMsg("الخطوة 2/4: فك تشفير وضغط ملف الاستعادة المحدد...");
      setProgress(40);
    }, 1200);

    setTimeout(() => {
      setStatusMsg(
        "الخطوة 3/4: التحقق من بصمة السلامة SHA-256 ومطابقتها للتأكد من عدم التلف...",
      );
      setProgress(65);
    }, 2400);

    setTimeout(() => {
      setStatusMsg(
        "الخطوة 4/4: فصل Prisma وكتابة جداول البيانات على القرص الصلب...",
      );
      setProgress(85);
    }, 3600);

    try {
      const serverResult = await restoreBackup(Number(selectedBackupId), {
        password: selectedBackup?.encrypted ? password : undefined,
        type: restoreType,
      });

      setTimeout(() => {
        setProgress(100);
        if (serverResult.success) {
          setStatusMsg("اكتملت عملية الاستعادة واستعادة الكوارث بنجاح!");
          toast.success("تم استعادة النسخة بنجاح");
          setResult({ success: true });
          router.refresh();
        } else {
          setStatusMsg(
            `فشلت عملية الاستعادة: ${serverResult.message || "خطأ مجهول"}`,
          );
          toast.error(serverResult.message || "فشلت عملية الاستعادة");
          setResult({ error: serverResult.message || "Failed" });
        }
        setIsRunning(false);
      }, 4500);
    } catch (e) {
      setProgress(100);
      setIsRunning(false);
      setStatusMsg(
        `خطأ فادح أثناء الاستعادة: ${(e as Error).message || "انقطع الاتصال بالخادم"}`,
      );
      toast.error("حدث خطأ غير متوقع");
      setResult({ error: (e as Error).message });
    }
  };

  const getRestoreTypeLabel = (type: string) => {
    switch (type) {
      case "DATABASE":
        return "قاعدة البيانات فقط";
      case "SETTINGS":
        return "إعدادات النظام فقط";
      case "FILES":
        return "الملفات المرفوعة فقط";
      case "FULL_SNAPSHOT":
        return "لقطة النظام الكاملة (Full Snapshot)";
      case "LAB":
        return "بيانات المختبر فقط";
      default:
        return "استعادة كاملة (نظام + ملفات)";
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Configuration column */}
      <div className="lg:col-span-3 bg-slate-900/40 backdrop-blur-xl border border-red-500/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              مركز استعادة الكوارث (Disaster Recovery)
            </h3>
            <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
              مجموعة أدوات الاستعادة والتحكم الطارئ بنظام التشغيل
            </p>
          </div>
        </div>

        {/* Warning Alert Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-sm font-bold text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white block">
              تحذير أمني هام جداً:
            </span>
            <p className="text-slate-300 leading-relaxed font-bold">
              عملية الاستعادة ستقوم باستبدال البيانات الحالية بشكل كامل ومباشر.
              سيقوم النظام بإنشاء نسخة أمان تلقائية (Safety Snapshot) للبيانات
              الحالية قبل الاستبدال لتتمكن من التراجع في حال حدوث أي خطأ.
            </p>
          </div>
        </div>

        {/* Step 1: Select Backup File */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-400 block">
            1. اختر ملف الاستعادة المستهدف:
          </label>
          <select
            value={selectedBackupId}
            disabled={isRunning}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : "";
              setSelectedBackupId(val);
              setResult(null);
              setTestReport(null);
              if (val) {
                const code = Math.floor(
                  100000 + Math.random() * 900000,
                ).toString();
                setVerificationCode(code);
              } else {
                setVerificationCode("");
              }
              setConfirmText("");
            }}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
          >
            <option value="">-- اختر من قائمة النسخ المتاحة --</option>
            {backups.map((b) => (
              <option key={b.id} value={b.id}>
                {b.filename} ({(b.sizeBytes / (1024 * 1024)).toFixed(2)} MB) -{" "}
                {new Date(b.timestamp).toLocaleDateString("ar-EG")}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Choose Restore Scope */}
        {selectedBackup && (
          <div className="space-y-3 animate-fadeIn">
            <label className="text-sm font-bold text-slate-400 block">
              2. حدد نطاق الاستعادة المطلوب:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: "DATABASE",
                  label: "قاعدة البيانات فقط",
                  desc: "استرجاع الجداول والمخططات كاملة",
                },
                {
                  id: "FULL",
                  label: "استعادة كاملة للبيانات",
                  desc: "قاعدة البيانات + المرفوعات + إعدادات",
                },
                {
                  id: "FILES",
                  label: "الملفات المرفوعة",
                  desc: "استرجاع الصور والملفات فقط",
                },
                {
                  id: "SETTINGS",
                  label: "الإعدادات فقط",
                  desc: "استرجاع تخصيصات النظام الحالية",
                },
                {
                  id: "FULL_SNAPSHOT",
                  label: "لقطة النظام الكاملة",
                  desc: "أكواد برمجية + قواعد بيانات + إعدادات",
                },
                {
                  id: "LAB",
                  label: "بيانات المختبر فقط",
                  desc: "خلطات خرسانية وفحوصات وتجارب",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  disabled={isRunning}
                  onClick={() => setRestoreType(item.id)}
                  className={`flex flex-col items-start text-right p-4 rounded-2xl border transition-all duration-200 ${
                    restoreType === item.id
                      ? "bg-red-600/15 border-red-500 text-white"
                      : "bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="text-sm font-bold block">{item.label}</span>
                  <span className="text-sm font-bold text-slate-500 leading-tight mt-1">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Password if encrypted */}
        {selectedBackup?.encrypted && (
          <div className="space-y-2 animate-fadeIn">
            <label className="text-sm font-bold text-slate-400 block flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-red-400" />
              رمز فك تشفير وحماية النسخة:
            </label>
            <input
              type="password"
              value={password}
              disabled={isRunning}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل مفتاح فك التشفير AES-256 للمتابعة..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        )}

        {/* Action button */}
        {selectedBackup && (
          <div className="flex flex-col md:flex-row gap-4 pt-2">
            <button
              onClick={handleTestRestore}
              disabled={isRunning || isTesting}
              className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري محاكاة الاستعادة...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  محاكاة واختبار الاستعادة (Test Restore)
                </>
              )}
            </button>

            <button
              onClick={handleExecuteRestore}
              disabled={
                isRunning || isTesting || confirmText !== verificationCode
              }
              className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold font-black shadow-lg shadow-red-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري تنفيذ استعادة الكوارث...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  تنفيذ استعادة الكوارث والبيانات
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Confirm Input */}
        {selectedBackup && (
          <div className="space-y-3 p-4 rounded-2xl bg-red-950/20 border border-red-500/20 animate-fadeIn">
            <div className="text-sm font-bold space-y-1">
              <span className="font-bold text-white block">
                3. التحقق الأمني الإجباري:
              </span>
              <p className="text-slate-400">
                الرجاء كتابة رمز التحقق العشوائي التالي للتأكيد:{" "}
                <span className="text-red-400 font-bold tracking-widest font-mono select-all">
                  {verificationCode}
                </span>
              </p>
            </div>
            <input
              type="text"
              value={confirmText}
              disabled={isRunning}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="اكتب رمز التحقق هنا..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-mono tracking-widest text-center focus:outline-none focus:border-red-500"
            />
          </div>
        )}
      </div>

      {/* Progress & Live Logs column */}
      <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-red-500/10 rounded-3xl p-6 flex flex-col space-y-6">
        <div>
          <h3 className="text-base font-black text-white">
            متابعة عملية الاستعادة
          </h3>
          <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
            تتبع حي ومباشر للمهمة الجارية
          </p>
        </div>

        {/* Progress Display */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-400">
              التقدم الفعلي:
            </span>
            <span className="text-lg font-black text-red-400">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-red-500 to-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed min-h-[40px]">
            {statusMsg || "بانتظار بدء العملية لمراقبة التقدم الفعلي..."}
          </div>
        </div>

        {/* Staging / Test Restore Report Box */}
        {testReport && (
          <div
            className={`p-5 rounded-2xl border animate-fadeIn space-y-3 text-sm font-bold ${testReport.error ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"}`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white">
                تقرير محاكاة الاستعادة (Dry Run Report):
              </span>
            </div>
            {testReport.error ? (
              <p className="text-slate-300">
                النتيجة: فشل فك الحزمة والتشفير. {testReport.error}
              </p>
            ) : (
              <div className="space-y-1.5 text-slate-400">
                <div>
                  حالة التحقق:{" "}
                  <span className="text-emerald-400 font-bold">
                    جاهز للاسترجاع (سليم)
                  </span>
                </div>
                <div>
                  نوع النسخة:{" "}
                  <span className="text-white font-bold">
                    {testReport.type}
                  </span>
                </div>
                <div>
                  حجم البيانات الحقيقي:{" "}
                  <span className="text-white font-bold">
                    {formatBytes(testReport.sizeBytes || 0)}
                  </span>
                </div>
                <div>
                  عدد الجداول التي تم اختبار استرجاعها:{" "}
                  <span className="text-white font-bold">
                    {testReport.tablesVerified} جداول
                  </span>
                </div>
                <div>
                  عدد الملفات المكتشفة:{" "}
                  <span className="text-white font-bold">
                    {testReport.filesCount} ملفات
                  </span>
                </div>
                <div>
                  متغيرات البيئة (.env):{" "}
                  <span className="text-white font-bold">
                    {testReport.envParsed ? "سليمة وموجودة" : "لا ينطبق"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result outcome */}
        {result && result.success && (
          <div className="flex-1 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <div className="space-y-1">
              <span className="font-black text-white text-sm block">
                اكتملت الاستعادة بنجاح
              </span>
              <p className="text-sm font-bold text-slate-400 leading-relaxed">
                تمت استعادة البيانات المختارة بنجاح. سيقوم النظام الآن بإعادة
                تهيئة الجلسات والاتصالات بشكل آمن.
              </p>
            </div>
          </div>
        )}

        {result && result.error && (
          <div className="flex-1 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 animate-fadeIn">
            <AlertTriangle className="w-12 h-12 text-rose-400" />
            <div className="space-y-1">
              <span className="font-black text-white text-sm block">
                فشلت عملية الاستعادة
              </span>
              <p className="text-sm font-bold text-slate-400 leading-relaxed">
                خطأ: {result.error}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
