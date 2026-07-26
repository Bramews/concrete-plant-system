"use client";

import { useState } from "react";
import {
  updateAutoBackupSettings,
  triggerManualBackup,
} from "@/app/actions/backup";
import { Icons } from "@/components/ui/Icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BackupConfig {
  enabled: boolean;
  frequency: string;
  retention: number;
  lastRun: Date | null;
  nextRun: Date | null;
}

export function BackupSettingsForm({
  initialConfig,
}: {
  initialConfig: BackupConfig;
}) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await updateAutoBackupSettings(config);
      if (res.success) {
        toast.success("تم تحديث إعدادات النسخ الاحتياطي بنجاح");
      } else {
        toast.error("فشل تحديث الإعدادات");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualBackup = async () => {
    setTriggering(true);
    toast.promise(triggerManualBackup(), {
      loading: "جاري إنشاء نسخة احتياطية مشفرة...",
      success: "تم إنشاء النسخة وتخزينها بنجاح",
      error: "فشل في عملية النسخ الاحتياطي",
      finally: () => setTriggering(false),
    });
  };

  return (
    <div className="bg-card/40 backdrop-blur-2xl border border-border/60 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 pb-10 border-b border-border/50 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20">
              <Icons.ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tight">
                بروتوكول الأمان والنسخ
              </h3>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
                إعدادات الأمان التلقائية
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleManualBackup}
          disabled={triggering}
          className="group bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20"
        >
          {triggering ? (
            <Icons.Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Icons.Zap className="w-5 h-5 fill-current group-hover:animate-pulse" />
          )}
          تفعيل نسخة الـتوارئ الآن
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-10 relative z-10">
        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Toggle Auto Backup */}
            <div className="flex items-center justify-between p-6 bg-muted/30 rounded-[2rem] border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "p-4 rounded-2xl transition-all shadow-inner",
                    config.enabled
                      ? "bg-green-500/20 text-green-600 ring-2 ring-green-500/10"
                      : "bg-gray-500/10 text-gray-500",
                  )}
                >
                  <Icons.RefreshCw
                    className={cn(
                      "w-6 h-6",
                      config.enabled && "animate-spin-slow",
                    )}
                  />
                </div>
                <div>
                  <div className="font-black text-sm uppercase">
                    النسخ التلقائي
                  </div>
                  <div className="text-sm font-bold text-muted-foreground font-bold">
                    مزامنة تعمل بالخلفية
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  setConfig({ ...config, enabled: !config.enabled })
                }
                className={cn(
                  "w-16 h-8 rounded-full relative transition-all duration-500 shadow-inner p-1",
                  config.enabled ? "bg-green-500" : "bg-muted-foreground/20",
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 bg-white rounded-full transition-all duration-500 shadow-xl",
                    config.enabled ? "translate-x-0" : "-translate-x-8",
                  )}
                />
              </button>
            </div>

            {/* Retention Policy */}
            <div className="flex items-center justify-between p-6 bg-muted/30 rounded-[2rem] border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 ring-2 ring-blue-500/5">
                  <Icons.History className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black text-sm uppercase">
                    دورة الاستبقاء
                  </div>
                  <div className="text-sm font-bold text-muted-foreground font-bold">
                    عدد النسخ المحفوظة
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-background/50 p-2 rounded-xl border border-border/60 shadow-inner">
                <input
                  type="number"
                  value={config.retention}
                  min={1}
                  max={30}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      retention: parseInt(e.target.value),
                    })
                  }
                  className="w-10 bg-transparent text-center font-black text-sm focus:outline-none text-primary"
                />
                <span className="text-sm font-bold font-black text-muted-foreground">
                  نسخة
                </span>
              </div>
            </div>
          </div>

          {/* Frequency Choice */}
          <div className="p-6 bg-muted/30 rounded-[2rem] border border-border/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-600 ring-2 ring-orange-500/5">
                <Icons.Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="font-black text-sm uppercase">
                  تكرار الجدول الزمني
                </div>
                <div className="text-sm font-bold text-muted-foreground font-bold">
                  دورية عملية النسخ
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-background/40 p-2 rounded-2xl border border-border/50 shadow-inner">
              {["DAILY", "WEEKLY", "MONTHLY"].map((freq) => (
                <button
                  key={freq}
                  onClick={() => setConfig({ ...config, frequency: freq })}
                  className={cn(
                    "py-3 text-sm font-bold font-black rounded-xl transition-all uppercase tracking-widest",
                    config.frequency === freq
                      ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 transform scale-[1.02]"
                      : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {freq === "DAILY"
                    ? "يومياً"
                    : freq === "WEEKLY"
                      ? "أسبوعياً"
                      : "شهرياً"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info & Status Column */}
        <div className="space-y-6">
          <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 h-full flex flex-col justify-between">
            <div>
              <div className="text-sm text-primary font-black flex items-center gap-2 mb-4 uppercase tracking-tighter">
                <Icons.Info className="w-5 h-5" />
                الحماية المتقدمة نشطة
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                يتم استخدام خوارزميات التشفير AES-256 لحماية ملفات قاعدة
                البيانات قبل رفعها للسحابة. النظام يقوم بالتحقق من سلامة
                البيانات (Integrity Check) تلقائياً بعد كل عملية نسخ.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center text-sm font-bold border-b border-primary/5 pb-2">
                <span className="text-muted-foreground">آخر مزامنة ناجحة:</span>
                <span className="text-primary">
                  {config.lastRun
                    ? new Date(config.lastRun).toLocaleDateString("ar-EG")
                    : "---"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-muted-foreground">الموعد القادم:</span>
                <span className="text-orange-600">
                  {config.nextRun
                    ? new Date(config.nextRun).toLocaleDateString("ar-EG")
                    : "---"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 relative z-10">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-foreground text-background hover:scale-105 px-12 py-4 rounded-2xl font-black transition-all shadow-2xl disabled:opacity-50 flex items-center gap-3 uppercase tracking-widest text-sm"
        >
          {loading ? (
            <Icons.Loader className="w-4 h-4 animate-spin" />
          ) : (
            "تطبيق الإعدادات الجديدة"
          )}
        </button>
      </div>
    </div>
  );
}
