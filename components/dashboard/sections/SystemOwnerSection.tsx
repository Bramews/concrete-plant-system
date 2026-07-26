"use client";

import { KpiCard } from "../KpiCard";
import { Icons } from "@/components/ui/Icons";

interface SystemOwnerSectionProps {
  data: Record<string, any>;
  lang: string;
}

export function SystemOwnerSection({ data, lang }: SystemOwnerSectionProps) {
  const isRtl = lang === "ar";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card p-6 rounded-3xl border border-violet-500/20 bg-violet-500/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-110" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-violet-500/20 rounded-2xl text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <Icons.ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {isRtl ? "لوحة حكم النظام" : "System Sovereignty"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                <p className="text-sm font-bold font-black text-violet-400/80 uppercase tracking-[0.3em]">
                  {isRtl ? "وصول كامل المزايا" : "FULL ARCHITECT ACCESS"}
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-bold font-mono font-black text-slate-400 tracking-widest backdrop-blur-md">
            {isRtl ? "المحرك الأساسي v2.4.0" : "CORE ENGINE v2.4.0"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <KpiCard
          title={isRtl ? "إجمالي الشركات" : "REGISTERED CORPORATIONS"}
          value={data.system?.totalCompanies || 0}
          icon="Factory"
          status="neutral"
        />
        <KpiCard
          title={isRtl ? "المنشآت المعلقة" : "SUSPENDED TENANTS"}
          value={data.system?.suspendedCompanies || 0}
          icon="Lock"
          status="danger"
        />
      </div>
    </div>
  );
}
