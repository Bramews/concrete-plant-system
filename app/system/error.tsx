"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/Icons";

export default function SystemError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [autoTries, setAutoTries] = useState(0);

  const handleRetry = () => {
    setRetrying(true);
    // Artificial delay for UI smoothing
    setTimeout(() => {
      reset();
      setRetrying(false);
    }, 1200);
  };

  // Log error, auto retry, and handle chunk reload
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("System Module Error:", error);
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
          setTimeout(() => {
            sessionStorage.removeItem("chunk-error-reloaded");
          }, 5000);
        }
      } catch (e) {
        window.location.reload();
      }
    } else if (autoTries === 0) {
      const timer = setTimeout(() => {
        setAutoTries(1);
        handleRetry();
      }, 500); // quick auto-retry
      return () => clearTimeout(timer);
    }
  }, [autoTries, error]);

  return (
    <div
      className="flex flex-col items-center justify-center w-full min-h-[60vh] relative overflow-hidden rounded-2xl bg-[#060b14] border border-white/5 shadow-2xl"
      dir="rtl"
    >
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center">
        {/* Animated Icon Ring */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-2">
          <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-2 border-2 border-cyan-400/40 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
          <div className="absolute inset-4 border-2 border-dashed border-indigo-400/50 rounded-full animate-[spin_4s_linear_infinite]" />
          <Icons.Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-wide font-sans">
            {retrying ? "جارِ استعادة الوحدة..." : "وحدة تتطلب التحديث"}
          </h2>
          <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed font-sans">
            {retrying
              ? "نقوم بتهيئة البيانات وتجهيز النظام الذكي، ثوانٍ معدودة..."
              : "النظام يقوم بمعالجة تحديثات سريعة لضمان أفضل أداء. باقي النظام يعمل بكفاءة."}
          </p>
        </div>

        <button
          onClick={handleRetry}
          disabled={retrying}
          className="group relative px-8 py-3 overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-sans mt-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative flex items-center gap-3 text-sm font-bold text-white">
            {retrying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                استعادة...
              </>
            ) : (
              <>
                <Icons.RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                تحديث فوري
              </>
            )}
          </span>
        </button>

        {process.env.NODE_ENV === "development" && !retrying && (
          <pre
            className="mt-8 p-4 bg-black/50 border border-red-500/20 rounded-xl text-left text-sm font-bold text-red-400/80 overflow-auto max-h-32 w-full max-w-lg backdrop-blur-md"
            dir="ltr"
          >
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
