"use client";

import { Icons } from "@/components/ui/Icons";
import { KpiCard } from "../KpiCard";

interface ManagementSectionProps {
  data: Record<string, any>;
  lang: string;
}

export function ManagementSection({ data, lang }: ManagementSectionProps) {
  const isRtl = lang === "ar";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Icons.Briefcase className="w-5 h-5" />
            </div>
            {isRtl ? "الإدارة العامة" : "Executive Desk"}
          </h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-12">
            {isRtl
              ? "مراقبة الأداء والعمليات"
              : "Operations & Project Governance"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Projects KPI */}
        <KpiCard
          title={isRtl ? "المشاريع النشطة" : "ACTIVE PROJECTS"}
          value={3} // Mock
          icon="Briefcase"
          status="neutral"
          isReadOnly={false}
        />

        {/* Pending Approvals */}
        <KpiCard
          title={isRtl ? "بانتظار الموافقة" : "PENDING APPROVALS"}
          value={data.lab?.pendingCubes || 0}
          icon="CheckCircle"
          status="warning"
          subValue={isRtl ? "مكعبات" : "Cubes"}
        />

        {/* Active Users */}
        <KpiCard
          title={isRtl ? "المستخدمين النشطين" : "ACTIVE USERS"}
          value={data.system?.activeUsers || 0}
          icon="Users"
          status="success"
        />

        {/* Financial Summary (Mini) */}
        <KpiCard
          title={isRtl ? "فواتير مفتوحة" : "OPEN INVOICES"}
          value={data.financial?.openInvoices || 0}
          icon="Wallet"
          status={
            (data.financial?.openInvoices || 0) > 0 ? "warning" : "success"
          }
        />
      </div>

      {/* Projects Table Placeholder */}
      <div className="glass-card rounded-3xl border border-white/5 overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-sm font-bold font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <Icons.Factory className="w-4 h-4" />
            </div>
            {isRtl ? "حالة المشاريع" : "PROJECT BLUEPRINT / STATUS"}
          </h3>
          <button className="text-sm font-bold font-black text-amber-500 hover:text-white transition-all uppercase tracking-widest px-4 py-2 rounded-xl bg-amber-500/5 hover:bg-amber-500/10">
            {isRtl ? "عرض الكل" : "FULL ARCHIVE"}
          </button>
        </div>

        <div className="p-12 text-center relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,191,0,0.03),transparent_70%)]" />
          <Icons.Box className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest relative z-10">
            {isRtl
              ? "لا توجد مشاريع نشطة للعرض في هذه المعاينة."
              : "Synchronizing project data streams..."}
          </p>
          <p className="text-sm font-bold text-slate-600 mt-2 italic">
            {isRtl
              ? "جاري الاتصال بمحرك البيانات المركزي..."
              : "Connecting to core ERP ledger..."}
          </p>
        </div>
      </div>
    </div>
  );
}
