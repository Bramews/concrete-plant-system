"use client";

import React, { useEffect, useState } from "react";
import { Icons } from "./Icons";
import { PremiumBadge } from "./premium/PremiumBadge";

interface SovereignGuardProps {
  moduleName: string;
  children: React.ReactNode;
}

/**
 * SovereignGuard: The ultimate gatekeeper.
 * It checks if a module is "SEALED" by the System Owner.
 * If sealed, it shows a premium lock screen instead of the content.
 */
export function SovereignGuard({ moduleName, children }: SovereignGuardProps) {
  const [status, setStatus] = useState<{
    sealed: boolean;
    reason?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSeal() {
      try {
        // We use a light fetch for performance
        const res = await fetch(`/api/governance/check?module=${moduleName}`);
        const data = await res.json();
        setStatus(data);
      } catch (e) {
        console.error("SovereignGuard Check Failed", e);
      } finally {
        setLoading(false);
      }
    }
    checkSeal();
  }, [moduleName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 animate-pulse">
        <Icons.Shield className="w-12 h-12 text-primary/20" />
      </div>
    );
  }

  if (status?.sealed) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-warning/20 bg-warning/5 backdrop-blur-xl p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
        {/* Animated Security Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px] animate-pulse"></div>

        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-warning/10 flex items-center justify-center animate-bounce-slow">
            <Icons.Lock className="w-12 h-12 text-warning" />
          </div>
          {/* Pulse Rings */}
          <div className="absolute inset-0 rounded-full border border-warning/50 animate-ping"></div>
        </div>

        <div className="max-w-md space-y-4">
          <PremiumBadge variant="warning" size="md" className="px-6 py-2">
            تم ختم الوحدة • MODULE SEALED
          </PremiumBadge>

          <h2 className="text-3xl font-bold text-white tracking-tight">
            وصول سيادي مقيد
          </h2>

          <p className="text-slate-400 text-lg leading-relaxed">
            تم إغلاق هذه الوحدة بقرار سيادي مباشر من مالك النظام. لا يمكن تحرير
            الأقفال إلا عبر لوحة التحكم العليا.
          </p>

          {status.reason && (
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-warning font-mono text-sm">
              المبرر: {status.reason}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-semibold"
          >
            تحديث الحالة
          </button>
        </div>

        <div className="absolute bottom-4 text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">
          Sovereign Control Layer v2.0 • SHA-512 Encrypted
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
