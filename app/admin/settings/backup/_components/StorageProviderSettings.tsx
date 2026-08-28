"use client";

import { useState, useEffect } from "react";
import {
  testStorageConnection,
  saveStorageSettings,
  getStorageSettings,
} from "@/app/actions/backup";
import {
  HardDrive,
  Server,
  Cloud,
  ShieldCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import type { DictionaryType } from "@/lib/dictionary";

interface StorageConfig {
  path?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  host?: string;
  port?: string;
  user?: string;
  password?: string;
  folderId?: string;
  credentialsJson?: string;
}

interface TestResult {
  success: boolean;
  status?: string;
  speed?: string;
  capacity?: string;
  used?: string;
  error?: string;
}

interface StorageProviderSettingsProps {
  dict: DictionaryType;
  destinations: unknown[];
}

export function StorageProviderSettings({
  dict,
  destinations,
}: StorageProviderSettingsProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("LOCAL");

  // Connection states
  const [configs, setConfigs] = useState<Record<string, StorageConfig>>({
    LOCAL: { path: "backups/" },
    S3: { bucket: "", accessKey: "", secretKey: "", region: "us-east-1" },
    FTP: { host: "", port: "21", user: "", password: "", path: "/" },
    GOOGLE_DRIVE: { folderId: "", credentialsJson: "" },
  });

  const [loadingConfigs, setLoadingConfigs] = useState(false);

  useEffect(() => {
    const loadAllConfigs = async () => {
      setLoadingConfigs(true);
      try {
        const loaded: Record<string, StorageConfig> = { ...configs };
        let hasLoadedAny = false;
        for (const provider of ["LOCAL", "S3", "FTP", "GOOGLE_DRIVE"]) {
          const res = await getStorageSettings(provider);
          if (res.success && res.config) {
            loaded[provider] = res.config as StorageConfig;
            hasLoadedAny = true;
          }
        }
        if (hasLoadedAny) {
          setConfigs(loaded);
        }
      } catch (e) {
        console.error("Error loading storage configurations:", e);
      } finally {
        setLoadingConfigs(false);
      }
    };
    loadAllConfigs();
  }, []);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const providerDetails: Record<
    string,
    {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      desc: string;
    }
  > = {
    LOCAL: {
      label: "تخزين محلي (Server Local)",
      icon: HardDrive,
      desc: "حفظ النسخ الاحتياطية على القرص الصلب الخاص بالخادم الرئيسي",
    },
    S3: {
      label: "أمازون (Amazon S3)",
      icon: Cloud,
      desc: "رفع النسخ الاحتياطية إلى سحابة Amazon Web Services S3",
    },
    FTP: {
      label: "خادم خارجي (FTP / SFTP)",
      icon: Server,
      desc: "مزامنة النسخ مع خادم خارجي عبر بروتوكول نقل الملفات الآمن",
    },
    GOOGLE_DRIVE: {
      label: "غوغل درايف (Google Drive)",
      icon: Cloud,
      desc: "تخزين النسخ تلقائيًا على مساحة Google Workspace الخاصة بالمؤسسة",
    },
  };

  const handleInputChange = (field: string, value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        [field]: value,
      },
    }));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testStorageConnection(
        selectedProvider,
        configs[selectedProvider] as Record<string, string>,
      );
      if (result.success) {
        setTestResult(result as TestResult);
        toast.success("تم الاتصال بالوجهة التخزينية بنجاح");
      } else {
        setTestResult({
          success: false,
          error: result.message || "فشلت عملية المصادقة مع المزود",
        });
        toast.error("فشل الاتصال بالوجهة التخزينية");
      }
    } catch (e) {
      setTestResult({
        success: false,
        error: (e as Error).message || "حدث خطأ غير متوقع أثناء الفحص",
      });
      toast.error("فشل اختبار الاتصال");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    setTesting(true);
    try {
      const res = await saveStorageSettings(
        selectedProvider,
        configs[selectedProvider] as Record<string, string>,
      );
      if (res.success) {
        toast.success(
          `تم حفظ إعدادات ${providerDetails[selectedProvider].label} بنجاح`,
        );
      } else {
        toast.error("فشل حفظ الإعدادات: " + res.error);
      }
    } catch (e) {
      toast.error("حدث خطأ غير متوقع: " + (e as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Provider selector */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-4">
        <div>
          <h3 className="text-base font-black text-white">
            وجهات التخزين المتعددة
          </h3>
          <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
            اختر وقم بتهيئة مواقع الحفظ والرفع السحابي
          </p>
        </div>

        <div className="space-y-2">
          {Object.entries(providerDetails).map(([key, info]) => {
            const Icon = info.icon;
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedProvider(key);
                  setTestResult(null);
                }}
                className={`w-full text-right p-4 rounded-2xl border flex items-start gap-3 transition-all duration-200 ${
                  selectedProvider === key
                    ? "bg-blue-600/15 border-blue-500 text-white"
                    : "bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                <div
                  className={`p-2 rounded-xl mt-0.5 ${selectedProvider === key ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-slate-800 text-slate-500"}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold font-black block">
                    {info.label}
                  </span>
                  <span className="text-sm font-bold text-slate-500 line-clamp-1 mt-0.5">
                    {info.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connection Config Form */}
      <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-6">
        <div>
          <h3 className="text-base font-black text-white">
            إعدادات الاتصال والوصول
          </h3>
          <p className="text-sm font-bold text-slate-500 font-bold uppercase tracking-widest">
            أدخل تفاصيل التخويل والتفويض لـ{" "}
            {providerDetails[selectedProvider].label}
          </p>
        </div>

        {/* Dynamic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedProvider === "LOCAL" && (
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-400">
                مسار المجلد المحلي على الخادم:
              </label>
              <input
                type="text"
                value={configs.LOCAL.path}
                onChange={(e) => handleInputChange("path", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="backups/"
              />
            </div>
          )}

          {selectedProvider === "S3" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  اسم الحاوية (S3 Bucket Name):
                </label>
                <input
                  type="text"
                  value={configs.S3.bucket}
                  onChange={(e) => handleInputChange("bucket", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
                  placeholder="my-company-backups"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  المنطقة الجغرافية (Region):
                </label>
                <input
                  type="text"
                  value={configs.S3.region}
                  onChange={(e) => handleInputChange("region", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
                  placeholder="us-east-1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  مفتاح الوصول (Access Key ID):
                </label>
                <input
                  type="text"
                  value={configs.S3.accessKey}
                  onChange={(e) =>
                    handleInputChange("accessKey", e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  المفتاح السري للوصول (Secret Access Key):
                </label>
                <input
                  type="password"
                  value={configs.S3.secretKey}
                  onChange={(e) =>
                    handleInputChange("secretKey", e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
                  placeholder="••••••••••••••••••••••••••••••••••••••••"
                />
              </div>
            </>
          )}

          {selectedProvider === "FTP" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  عنوان الاستضافة (Host Address):
                </label>
                <input
                  type="text"
                  value={configs.FTP.host}
                  onChange={(e) => handleInputChange("host", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
                  placeholder="ftp.mycompany.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  المنفذ (Port):
                </label>
                <input
                  type="text"
                  value={configs.FTP.port}
                  onChange={(e) => handleInputChange("port", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
                  placeholder="21"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  اسم المستخدم (User):
                </label>
                <input
                  type="text"
                  value={configs.FTP.user}
                  onChange={(e) => handleInputChange("user", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
                  placeholder="ftp_user"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  كلمة المرور (Password):
                </label>
                <input
                  type="password"
                  value={configs.FTP.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  المسار المطلوب لحفظ الملفات:
                </label>
                <input
                  type="text"
                  value={configs.FTP.path}
                  onChange={(e) => handleInputChange("path", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
                  placeholder="/"
                />
              </div>
            </>
          )}

          {selectedProvider === "GOOGLE_DRIVE" && (
            <>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  معرف المجلد السحابي (Folder ID):
                </label>
                <input
                  type="text"
                  value={configs.GOOGLE_DRIVE.folderId}
                  onChange={(e) =>
                    handleInputChange("folderId", e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none"
                  placeholder="1A2B3C4D5E6F7G8H9I0J..."
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  ملف الإعتمادات (Credentials JSON):
                </label>
                <textarea
                  value={configs.GOOGLE_DRIVE.credentialsJson}
                  onChange={(e) =>
                    handleInputChange("credentialsJson", e.target.value)
                  }
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-bold font-mono focus:outline-none resize-none"
                  placeholder='{ "type": "service_account", "project_id": "..." }'
                />
              </div>
            </>
          )}
        </div>

        {/* Action Controls & Testing */}
        <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-white/5">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري اختبار الاتصال بالمزود...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                اختبار الاتصال والمصادقة
              </>
            )}
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={testing}
            className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              "حفظ إعدادات المزود"
            )}
          </button>
        </div>

        {/* Test Connection Output Box */}
        {testResult && (
          <div
            className={`p-5 rounded-2xl border animate-fadeIn flex gap-4 ${testResult.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}
          >
            {testResult.success ? (
              <>
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                <div className="text-sm font-bold space-y-2 text-slate-300">
                  <span className="font-bold text-white block">
                    الاتصال نشط وجاهز للتشغيل
                  </span>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-slate-400">
                    <div>
                      حالة الخادم:{" "}
                      <span className="text-emerald-400 font-bold">
                        {testResult.status}
                      </span>
                    </div>
                    <div>
                      سرعة النقل المقدرة:{" "}
                      <span className="text-white font-bold">
                        {testResult.speed}
                      </span>
                    </div>
                    <div>
                      السعة الإجمالية:{" "}
                      <span className="text-white font-bold">
                        {testResult.capacity}
                      </span>
                    </div>
                    <div>
                      المساحة المستغلكة:{" "}
                      <span className="text-white font-bold">
                        {testResult.used}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
                <div className="text-sm font-bold space-y-1">
                  <span className="font-bold text-white block">
                    فشل التحقق من الاتصال
                  </span>
                  <p className="text-slate-400">
                    {testResult.error ||
                      "خطأ مجهول في المصادقة مع خوادم التخزين السحابي"}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
