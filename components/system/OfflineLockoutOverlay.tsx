"use client";

import { useOfflineGuard } from "@/lib/offline-guard";
import { useState } from "react";

export function OfflineLockoutOverlay() {
  const {
    isOnline,
    isCheckingPing,
    remainingSeconds,
    isLockedOut,
    isTampered,
    retryConnection,
  } = useOfflineGuard();

  const [isRetrying, setIsRetrying] = useState(false);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryConnection();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <>
      {/* 1. Offline Countdown Warning Banner (Appears during the 5-minute offline window) */}
      {!isOnline && !isLockedOut && (
        <div className="fixed top-0 inset-x-0 z-[9999] bg-amber-500 text-slate-950 font-bold px-4 py-2 flex flex-wrap items-center justify-between shadow-xl animate-in slide-in-from-top duration-300 border-b border-amber-600">
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping"></span>
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              انقطع الاتصال بالإنترنت! النظام يعمل مؤقتاً بالنمط المحتفظ
              (أوفلاين).
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs md:text-sm mt-1 sm:mt-0">
            <span className="bg-slate-950 text-amber-400 font-mono px-3 py-0.5 rounded-md text-sm font-extrabold shadow-inner">
              متبقي: {formatTime(remainingSeconds)}
            </span>
            <button
              onClick={handleRetry}
              disabled={isRetrying || isCheckingPing}
              className="bg-slate-900 text-white hover:bg-slate-800 px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {isRetrying || isCheckingPing ? (
                <span className="animate-spin text-xs">⏳</span>
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              <span>إعادة الفحص</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Full-Screen Emergency Lockout Overlay (Appears when 5 minutes expire or tamper detected) */}
      {isLockedOut && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 text-white text-right animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 text-center">
            {/* Lockout Icon */}
            <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/40 shadow-inner animate-pulse">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 002 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            {/* Lockout Title & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-rose-400">
                {isTampered
                  ? "تم رصد تلاعب بساعة الجهاز!"
                  : "تم قفل النظام الأوفلاين (تجاوز 5 دقائق)"}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {isTampered
                  ? "تم إيقاف العمليات تلقائياً بسبب تعديل تاريخ أو وقت النظام المحلي بشكل يخالف شروط الأمان. يرجى الاتصال بالسيرفر للمزامنة."
                  : "انتهت المهلة الزمنية المحددة للعمل بدون إنترنت (5 دقائق). لحماية البيانات وتأكيد صلاحية الاشتراك، تم قفل الصب والتذاكر لحين إعادة الاتصال بالخادم."}
              </p>
            </div>

            {/* Emergency Status Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2 text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>حالة الاتصال بالإنترنت:</span>
                <span className="text-rose-400 font-bold">منقطع ❌</span>
              </div>
              <div className="flex justify-between">
                <span>الحد الأقصى المسموح للأوفلاين:</span>
                <span className="text-white font-bold">
                  5 دقائق (300 ثانية)
                </span>
              </div>
              <div className="flex justify-between">
                <span>حالة حماية النظام:</span>
                <span className="text-amber-400 font-bold">
                  إغلاق قسري فعال 🔒
                </span>
              </div>
            </div>

            {/* Reconnect Action Button */}
            <div className="pt-2">
              <button
                onClick={handleRetry}
                disabled={isRetrying || isCheckingPing}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isRetrying || isCheckingPing ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>جاري فحص الاتصال بالسيرفر...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>إعادة فحص الاتصال والمزامنة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
