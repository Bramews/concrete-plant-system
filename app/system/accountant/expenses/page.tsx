import { requireRole, getSession } from "@/lib/auth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";
import { Metadata } from "next";
import { getExpenses, getExpenseKpis } from "@/app/actions/finance";
import { AddExpenseButton } from "./AddExpenseButton";

export const metadata: Metadata = {
  title: "المصروفات التشغيلية | النظام المحاسبي",
};

export default async function AccountingExpensesPage() {
  await requireRole(["ACCOUNTANT", "MANAGER"]);

  const session = await getSession();
  const companyId = session?.companyId;

  if (!companyId) {
    return <div>خطأ: لا توجد جلسة عمل نشطة</div>;
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const isRtl = lang === "ar";

  const kpis = await getExpenseKpis(companyId);
  const expenses = await getExpenses(companyId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-IQ", {
      style: "currency",
      currency: isRtl ? "IQD" : "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-IQ", {
      dateStyle: "medium",
    }).format(date);
  };

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
            {isRtl ? "المصروفات التشغيلية" : "Operational Expenses"}
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm font-bold mt-1 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-rose-500/30"></span>
            {isRtl
              ? "تتبع المصاريف اليومية وتكاليف المحطة"
              : "Daily Expense Tracking & Plant Costs"}
          </p>
        </div>
        <div className="w-full md:w-auto">
          <AddExpenseButton companyId={companyId} lang={lang} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard
          title={isRtl ? "إجمالي مصاريف الشهر" : "Total Monthly Expenses"}
          value={formatCurrency(kpis.totalMonthly)}
          icon="TrendingDown"
          status="danger"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={isRtl ? "تكاليف الوقود" : "Fuel Costs"}
          value={formatCurrency(kpis.fuelCosts)}
          icon="Droplet"
          status="warning"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={isRtl ? "صيانة وإصلاحات" : "Maintenance"}
          value={formatCurrency(kpis.maintenanceCosts)}
          icon="Settings"
          status="neutral"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={isRtl ? "المصاريف النثرية" : "Misc Expenses"}
          value={formatCurrency(kpis.miscExpenses)}
          icon="Box"
          status="success"
          dir={isRtl ? "rtl" : "ltr"}
        />
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/5">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <h3 className="font-black text-white tracking-widest uppercase text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            {isRtl ? "سجل المصروفات" : "Expense Ledger"}
          </h3>
          <div className="bg-white/5 rounded-lg px-3 py-1 text-[9px] font-bold text-slate-500 uppercase">
            {expenses.length} {isRtl ? "سجلات" : "Entries"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-5 text-sm font-bold font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {isRtl ? "التاريخ" : "Date"}
                </th>
                <th className="px-6 py-5 text-sm font-bold font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {isRtl ? "الفئة" : "Category"}
                </th>
                <th className="px-6 py-5 text-sm font-bold font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {isRtl ? "التفاصيل" : "Details"}
                </th>
                <th className="px-6 py-5 text-sm font-bold font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {isRtl ? "المبلغ" : "Amount"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-20 text-center text-slate-500 italic"
                  >
                    {isRtl
                      ? "لا توجد مصروفات مسجلة هذا الشهر"
                      : "No expenses recorded this month"}
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-white/[0.03] transition-all group border-b border-white/5"
                  >
                    <td className="px-6 py-6 text-sm font-bold text-slate-500 font-mono">
                      {formatDate(exp.timestamp)}
                    </td>
                    <td className="px-6 py-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black border tracking-widest uppercase ${
                          exp.category === "FUEL"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : exp.category === "MAINTENANCE"
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}
                      >
                        {isRtl
                          ? {
                              FUEL: "وقود",
                              MAINTENANCE: "صيانة",
                              MISC: "نثريات",
                            }[exp.category] || exp.category
                          : exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="font-bold text-white max-w-xs">
                        {exp.details || "-"}
                      </div>
                      <div className="text-sm font-bold text-slate-500 font-mono mt-0.5">
                        {exp.reference || "#REF"}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-lg font-black text-rose-400 tracking-tighter">
                      {formatCurrency(exp.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
