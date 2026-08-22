import { requireRole, getSession } from "@/lib/auth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import { Metadata } from "next";
import { getExpenses, getExpenseKpis } from "@/app/actions/finance";
import { AddExpenseButton } from "./AddExpenseButton";

export const metadata: Metadata = {
  title: "المصروفات التشغيلية | النظام المحاسبي",
  description: "تتبع المصاريف اليومية وتكاليف تشغيل المحطة",
};

export default async function AccountingExpensesPage() {
  await requireRole(["ACCOUNTANT", "MANAGER"]);

  const session = await getSession();
  const companyId = session?.companyId;

  if (!companyId) {
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        خطأ: لا توجد جلسة عمل نشطة للشركة
      </div>
    );
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);
  const isRtl = lang === "ar";

  const kpis = await getExpenseKpis(companyId);
  const expenses = await getExpenses(companyId);

  const formatCurrency = (amount: number) => {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} ${kpis.currency}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(date);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "FUEL":
        return { label: dict.accounting.fuel, color: "amber" };
      case "MAINTENANCE":
        return { label: dict.accounting.maintenance, color: "blue" };
      case "RAW_MATERIALS":
        return { label: dict.accounting.raw_materials, color: "emerald" };
      case "UTILITIES":
        return { label: dict.accounting.utilities, color: "purple" };
      case "RENT":
        return { label: dict.accounting.rent, color: "indigo" };
      default:
        return { label: dict.accounting.misc, color: "slate" };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {dict.accounting.expenses}
          </h2>
          <p className="text-slate-400 font-bold text-sm mt-1 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-rose-500/40"></span>
            {dict.accounting.cashflow_management}
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
          title={dict.accounting.fuel}
          value={formatCurrency(kpis.fuelCosts)}
          icon="Droplet"
          status="warning"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={dict.accounting.maintenance}
          value={formatCurrency(kpis.maintenanceCosts)}
          icon="Settings"
          status="neutral"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={dict.accounting.misc}
          value={formatCurrency(kpis.miscExpenses)}
          icon="Box"
          status="success"
          dir={isRtl ? "rtl" : "ltr"}
        />
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/5">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <h3 className="font-black text-white text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            {dict.accounting.expense_history}
          </h3>
          <div className="text-xs text-slate-400 font-bold">
            إجمالي السجلات: {expenses.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  {isRtl ? "التاريخ" : "Date"}
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  {dict.accounting.expense_category}
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  {dict.accounting.expense_details}
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  {dict.accounting.amount}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-20 text-center text-slate-500 italic text-sm"
                  >
                    {dict.accounting.no_expenses_month}
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => {
                  const cat = getCategoryLabel(exp.category);
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-white/[0.03] transition-all group border-b border-white/5"
                    >
                      <td className="px-6 py-6 text-sm text-slate-400 font-mono">
                        {formatDate(exp.timestamp)}
                      </td>
                      <td className="px-6 py-6">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black border tracking-wide uppercase ${
                            cat.color === "amber"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : cat.color === "blue"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : cat.color === "emerald"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }`}
                        >
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="font-bold text-white max-w-sm">
                          {exp.details || "-"}
                        </div>
                        {exp.reference && (
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            مرجع: {exp.reference}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6 text-base font-black text-rose-400 font-mono">
                        {formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

