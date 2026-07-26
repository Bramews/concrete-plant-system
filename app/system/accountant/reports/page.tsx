import { requireRole } from "@/lib/auth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "التقارير المالية | النظام المحاسبي",
};

export default async function AccountingReportsPage() {
  await requireRole(["ACCOUNTANT", "MANAGER"]);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);
  const isRtl = lang === "ar";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-IQ", {
      style: "currency",
      currency: isRtl ? "IQD" : "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white">
            {dict.accounting.reports}
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm font-bold mt-1">
            {dict.accounting.profit_cost_analysis}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary">
            {dict.accounting.download_pdf}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard
          title={dict.accounting.net_profit}
          value={formatCurrency(28500)} // Using a fixed number for demonstration or actual data if available
          subValue={isRtl ? "يناير 2026" : "JAN 2026"}
          icon="TrendingUp"
          status="success"
          trend="+8%"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={dict.accounting.operating_cost}
          value={formatCurrency(16700)}
          icon="BarChart2"
          status="warning"
          trend="-2%"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={dict.accounting.profit_margin}
          value="34%"
          icon="Target"
          status="success"
          dir={isRtl ? "rtl" : "ltr"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-[2rem] p-8">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">
            {dict.accounting.cost_linkage}
          </h3>

          <div className="grid grid-cols-4 gap-4 h-[300px] items-end">
            <div className="flex flex-col items-center gap-3 h-full justify-end group">
              <div
                className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-t-2xl transition-all duration-500 group-hover:bg-indigo-500/20"
                style={{ height: "70%" }}
              ></div>
              <span className="text-[9px] font-black text-slate-500 uppercase">
                {dict.accounting.revenue}
              </span>
            </div>
            <div className="flex flex-col items-center gap-3 h-full justify-end group">
              <div
                className="w-full bg-rose-500/10 border border-rose-500/20 rounded-t-2xl transition-all duration-500 group-hover:bg-rose-500/20"
                style={{ height: "40%" }}
              ></div>
              <span className="text-[9px] font-black text-slate-500 uppercase">
                {dict.accounting.expenses}
              </span>
            </div>
            <div className="flex flex-col items-center gap-3 h-full justify-end group">
              <div
                className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-t-2xl transition-all duration-500 group-hover:bg-emerald-500/20"
                style={{ height: "90%" }}
              ></div>
              <span className="text-[9px] font-black text-slate-500 uppercase">
                {dict.accounting.production}
              </span>
            </div>
            <div className="flex flex-col items-center gap-3 h-full justify-end group">
              <div
                className="w-full bg-amber-500/10 border border-amber-500/20 rounded-t-2xl transition-all duration-500 group-hover:bg-amber-500/20"
                style={{ height: "60%" }}
              ></div>
              <span className="text-[9px] font-black text-slate-500 uppercase">
                {dict.accounting.payroll}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <span className="text-2xl">⚡</span>
          </div>
          <h4 className="text-white font-black tracking-tight">
            {dict.accounting.ai_insights}
          </h4>
          <p className="text-sm font-bold text-slate-400 leading-relaxed">
            {dict.accounting.ai_fuel_notice}
          </p>
          <button className="btn btn-secondary w-full text-sm font-bold py-3 uppercase tracking-widest font-black">
            {dict.accounting.smart_details}
          </button>
        </div>
      </div>
    </div>
  );
}
