import { requireRole, getSession } from "@/lib/auth";
import { getCustomerLedgers } from "@/app/actions/finance";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { CustomerLedgersClient } from "./CustomerLedgersClient";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import { Metadata } from "next";
import { Users, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "كشوفات وذمم العملاء | النظام المحاسبي",
  description: "متابعة ذمم العملاء والسقوف الائتمانية وكشوف الحسابات",
};

export default async function CustomerLedgersPage() {
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

  const { customers, kpis } = await getCustomerLedgers(companyId);

  const formatCurrency = (amount: number) => {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} ${kpis.currency}`;
  };

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {dict.accounting.customer_ledgers || "كشوفات وذمم العملاء"}
          </h2>
          <p className="text-slate-400 font-bold text-sm mt-1 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-blue-500/40"></span>
            متابعة أرصدة المقاولين، التحصيلات، والسقوف الائتمانية
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard
          title="إجمالي الذمم المستحقة"
          value={formatCurrency(kpis.totalReceivables)}
          icon="TrendingDown"
          status={kpis.totalReceivables > 0 ? "warning" : "success"}
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title="إجمالي المسحوبات / الفواتير"
          value={formatCurrency(kpis.totalBilled)}
          icon="TrendingUp"
          status="neutral"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title="إجمالي التحصيلات النقدية"
          value={formatCurrency(kpis.totalCollected)}
          icon="CheckCircle"
          status="success"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title="عدد العملاء والمقاولين"
          value={kpis.activeCustomersCount.toString()}
          icon="Users"
          status="neutral"
          dir={isRtl ? "rtl" : "ltr"}
        />
      </div>

      {/* Client Filter & Table View */}
      <CustomerLedgersClient
        companyId={companyId}
        customers={customers}
        currency={kpis.currency}
      />
    </div>
  );
}
