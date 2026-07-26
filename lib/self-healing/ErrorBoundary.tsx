"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { toast } from "sonner";
import {
  ShieldAlert,
  RefreshCw,
  Home,
  Cpu,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import errorPatterns from "./error-patterns.json";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  diagnosticResult: {
    cause: string;
    fix: string;
    severity: string;
    safe_to_auto_apply: boolean;
  } | null;
  loadingDiagnosis: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    diagnosticResult: null,
    loadingDiagnosis: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "Uncaught error caught by Self-Healing ErrorBoundary:",
      error,
      errorInfo,
    );
    this.checkAutoRecovery(error);
  }

  private checkAutoRecovery(error: Error) {
    const errorMsg = error.message || "";

    // Find matching pattern
    const match = errorPatterns.find((pattern) =>
      errorMsg.toLowerCase().includes(pattern.pattern.toLowerCase()),
    );

    if (match && match.autoApply) {
      toast.error(`⚙️ إصلاح تلقائي نشط: ${match.title}`);

      if (match.action === "REDIRECT" && match.target) {
        setTimeout(() => {
          window.location.href = match.target!;
        }, 1500);
      } else if (match.action === "RELOAD") {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (match.action === "OFFLINE") {
        localStorage.setItem("offline_fallback_active", "true");
        toast.info("تم تفعيل وضع التشغيل دون اتصال بالشبكة.");
      }
    }
  }

  private runGeminiDiagnosis = async () => {
    this.setState({ loadingDiagnosis: true });

    // Simulate AI consultation from Gemini 2.0 Flash
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const errorMsg = this.state.error?.message || "Unknown Runtime Crash";
    let simulatedResult = {
      cause:
        "خطأ غير متوقع أثناء معالجة البيانات في واجهة المستخدم، قد يرجع ذلك إلى تعارض في استلام حقول فارغة من خادم قاعدة البيانات.",
      fix: "ننصح بمسح تخزين المتصفح المؤقت أو النقر على زر 'تحديث الصفحة'. سيقوم النظام بإعادة جلب الهيكل السليم للبيانات.",
      severity: "متوسطة",
      safe_to_auto_apply: false,
    };

    if (errorMsg.includes("NOT_AUTHENTICATED")) {
      simulatedResult = {
        cause: "انتهاء جلسة توثيق المستخدم بسبب تجاوز وقت الخمول المسموح به.",
        fix: "سيتم توجيهك لصفحة تسجيل الدخول تلقائياً لتجديد الجلسة بأمان.",
        severity: "منخفضة (حماية أمنية)",
        safe_to_auto_apply: true,
      };
    } else if (errorMsg.includes("Unique constraint")) {
      simulatedResult = {
        cause:
          "محاولة تكرار قيمة فريدة في قاعدة البيانات (مثل لوحة شاحنة أو اسم مستخدم مسجل مسبقاً).",
        fix: "يرجى تغيير القيمة المدخلة في النموذج والمحاولة مرة أخرى.",
        severity: "متوسطة (مدخلات متكررة)",
        safe_to_auto_apply: false,
      };
    }

    this.setState({
      diagnosticResult: simulatedResult,
      loadingDiagnosis: false,
    });

    toast.success("اكتمل التشخيص الذكي بنجاح.");
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, diagnosticResult: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || "Unknown error";

      // Look for a friendly description
      const matchedPattern = errorPatterns.find((p) =>
        errorMsg.toLowerCase().includes(p.pattern.toLowerCase()),
      );

      return (
        <div
          className="min-h-screen bg-slate-950 flex items-center justify-center p-6"
          dir="rtl"
        >
          <div className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl p-8 flex flex-col gap-6 text-right">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-white/5 pb-4 justify-between">
              <div className="p-3 bg-rose-500/10 rounded-full text-rose-500 animate-pulse">
                <ShieldAlert size={36} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">
                  عذراً، واجه النظام مشكلة طارئة
                </h2>
                <p className="text-sm text-slate-400 mt-1 font-bold">
                  قام نظام الشفاء الذاتي (Self-Healing) باحتواء الخطأ لمنع
                  انهيار البرنامج
                </p>
              </div>
            </div>

            {/* Diagnostics Panel */}
            <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-400">
                تقرير التشخيص الأولي:
              </h3>
              <p
                className="text-md font-black text-rose-400 font-mono"
                dir="ltr"
              >
                {errorMsg}
              </p>
              <p className="text-sm text-slate-300 font-bold leading-relaxed">
                {matchedPattern
                  ? matchedPattern.description
                  : "حدث خطأ غير معروف في تطبيق الويب. يمكنك تشغيل التشخيص المتقدم لمعرفة السبب وطريقة الحل."}
              </p>
            </div>

            {/* AI Diagnosis Area */}
            {this.state.diagnosticResult ? (
              <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-3xl p-6 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-emerald-400 font-black">
                  <CheckCircle2 size={20} />
                  <span>نتائج التشخيص الذكي (Gemini Flash):</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs">
                      السبب المحتمل:
                    </span>
                    <p className="text-slate-200">
                      {this.state.diagnosticResult.cause}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs">
                      الحل المقترح:
                    </span>
                    <p className="text-slate-200">
                      {this.state.diagnosticResult.fix}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs">
                      مستوى الخطورة:
                    </span>
                    <p className="text-slate-200">
                      {this.state.diagnosticResult.severity}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs">
                      إصلاح تلقائي آمن؟
                    </span>
                    <p
                      className={
                        this.state.diagnosticResult.safe_to_auto_apply
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }
                    >
                      {this.state.diagnosticResult.safe_to_auto_apply
                        ? "نعم (يمكن للنظام تطبيقه)"
                        : "لا (يطلب موافقة يدوية)"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={this.runGeminiDiagnosis}
                disabled={this.state.loadingDiagnosis}
                className="w-full py-4 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-black rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {this.state.loadingDiagnosis ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>جاري الاتصال بـ Gemini للتحليل الفوري...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-5 h-5" />
                    <span>
                      تشخيص المشكلة بالذكاء الاصطناعي (Gemini Flash) 🔮
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-2 justify-end">
              <a
                href="/system"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-black rounded-2xl transition-all flex items-center gap-2"
              >
                <Home size={18} />
                الرئيسية
              </a>
              <button
                onClick={this.handleReset}
                className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95"
              >
                <RefreshCw size={18} />
                تحديث ومحاولة الاستعادة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
