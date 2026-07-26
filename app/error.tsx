"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/Icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [autoTries, setAutoTries] = useState(0);

  // Log error and handle automatic chunk reload
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message?.includes("ChunkLoadError") ||
      error.message?.includes("Failed to load chunk") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("failed to load");

    if (isChunkError) {
      try {
        const hasReloaded = sessionStorage.getItem("chunk-error-reloaded");
        if (!hasReloaded) {
          sessionStorage.setItem("chunk-error-reloaded", "true");
          window.location.reload();
        } else {
          // If it failed again after reloading, clear it after 5 seconds to allow subsequent navigation reloads
          setTimeout(() => {
            sessionStorage.removeItem("chunk-error-reloaded");
          }, 5000);
        }
      } catch (e) {
        // Fallback in case sessionStorage is disabled
        window.location.reload();
      }
    }
  }, [error]);

  const lang =
    typeof window !== "undefined" && document.documentElement.dir === "rtl"
      ? "ar"
      : "en";
  const isRtl = lang === "ar";

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      reset();
      setRetrying(false);
    }, 1200);
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden bg-[#060b14]"
      dir="rtl"
    >
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-10 text-center max-w-lg w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl">
        {/* Animated Icon Ring */}
        <div className="relative flex items-center justify-center w-28 h-28 mb-4">
          <div className="absolute inset-0 border-2 border-red-500/30 rounded-full animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-2 border-2 border-indigo-400/40 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
          <div className="absolute inset-4 border-2 border-dashed border-red-400/50 rounded-full animate-[spin_4s_linear_infinite]" />
          <Icons.Activity className="w-10 h-10 text-indigo-400 animate-pulse" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white tracking-wide font-sans">
            {retrying
              ? isRtl
                ? "جارِ استعادة الجلسة..."
                : "Recovering Session..."
              : isRtl
                ? "انقطاع في النظام"
                : "System Disruption"}
          </h2>
          <p className="text-sm font-medium text-slate-400 leading-relaxed font-sans px-4">
            {retrying
              ? isRtl
                ? "يتم الآن تأمين البيانات وإعادة تهيئة النظام الذكي بأمان، يرجى الانتظار ثوانٍ معدودة..."
                : "Securing data and re-initializing the system, please wait a few seconds..."
              : isRtl
                ? "واجه النظام حالة غير متوقعة بسبب عدم تطابق في مزامنة البيانات السريعة. يمكنك استعادة الجلسة فوراً."
                : "An unexpected state occurred. You can restore the session immediately."}
          </p>
        </div>

        <button
          onClick={handleRetry}
          disabled={retrying}
          className="group relative px-10 py-4 mt-6 overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-sans w-full max-w-[250px]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-indigo-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative flex items-center justify-center gap-3 text-sm font-bold text-white w-full">
            {retrying ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {isRtl ? "استعادة..." : "Restoring..."}
              </>
            ) : (
              <>
                <Icons.RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                {isRtl ? "أعد المحاولة" : "Try Again"}
              </>
            )}
          </span>
        </button>

        {!retrying && error.digest && (
          <p className="mt-4 text-sm font-bold text-slate-500 font-mono tracking-widest">
            REF_ID: {error.digest}
          </p>
        )}

        {process.env.NODE_ENV === "development" && !retrying && (
          <pre
            className="mt-6 p-4 bg-black/60 border border-red-500/20 rounded-xl text-left text-sm font-bold text-red-400/80 overflow-auto max-h-32 w-full backdrop-blur-md"
            dir="ltr"
          >
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
