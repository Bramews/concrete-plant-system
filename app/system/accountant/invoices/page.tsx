import Link from "next/link";
import { requireRole, getSession } from "@/lib/auth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import { Metadata } from "next";
import { getInvoices, getInvoiceKpis, getPendingUninvoicedTicketsCount } from "@/app/actions/finance";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoicesHeaderActions } from "./InvoicesHeaderActions";
import { Eye } from "lucide-react";

export const metadata: Metadata = {
  title: "إدارة الفواتير والذمم | النظام المحاسبي",
  description: "نظام إدارة الفواتير والتحصيل المالي والفوترة الآلية",
};

export default async function AccountingInvoicesPage() {
  await requireRole(["ACCOUNTANT", "MANAGER"]);

  const session = await getSession();
  const companyId = session?.companyId;

  if (!companyId) {
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        خطأ: لم يتم العثور على جلسة عمل نشطة للشركة.
      </div>
    );
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);
  const isRtl = lang === "ar";

  const [kpis, invoices, pendingTicketsCount] = await Promise.all([
    getInvoiceKpis(companyId),
    getInvoices(companyId),
    getPendingUninvoicedTicketsCount(companyId),
  ]);

  const formatCurrency = (amount: number) => {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} ${kpis.currency}`;
  };

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {dict.accounting.invoicing_receivables}
          </h2>
          <p className="text-slate-400 font-bold text-sm mt-1 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-blue-500/40"></span>
            {dict.accounting.cashflow_management}
          </p>
        </div>
        <InvoicesHeaderActions
          companyId={companyId}
          pendingTicketsCount={pendingTicketsCount}
          invoices={invoices}
        />
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard
          title={dict.accounting.total_receivables}
          value={formatCurrency(kpis.totalReceivables)}
          icon="Wallet"
          status="success"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={dict.accounting.overdue_invoices}
          value={formatCurrency(kpis.overdueInvoices)}
          icon="AlertTriangle"
          status="danger"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={dict.accounting.collected_month}
          value={formatCurrency(kpis.collectedThisMonth)}
          icon="CheckCircle"
          status="success"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={dict.accounting.pending_processing}
          value={formatCurrency(kpis.pendingProcessing)}
          icon="Clock"
          status="warning"
          dir={isRtl ? "rtl" : "ltr"}
        />
      </div>

      {/* Data Table Section */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02]">
          <div>
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              {dict.accounting.recent_invoices}
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-bold">
            إجمالي السجلات: {invoices.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  {dict.accounting.invoice_no}
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  {dict.accounting.customer}
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  {dict.accounting.amount}
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5 text-center">
                  {dict.accounting.status}
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5 text-center">
                  {dict.accounting.action}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-20 text-center text-slate-500 italic text-sm"
                  >
                    {dict.accounting.no_invoices}
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-white/[0.03] transition-all group border-b border-white/5"
                  >
                    <td className="px-6 py-6 font-mono text-sm text-blue-400 font-bold">
                      #{inv.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-sm font-black text-white">
                        {inv.order?.customer?.name || "عميل عام"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {inv.ticket ? `تذكرة: ${inv.ticket.ticketNumber}` : inv.type}
                      </div>
                    </td>
                    <td className="px-6 py-6 font-mono">
                      <div className="text-base font-black text-emerald-400">
                        {formatCurrency(inv.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <InvoiceStatusBadge
                        invoiceId={inv.id}
                        initialStatus={inv.status}
                        companyId={companyId}
                        lang={lang}
                      />
                    </td>
                    <td className="px-6 py-6 text-center">
                      <Link
                        href={`/system/accountant/invoices/${inv.id}`}
                        className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-slate-400 hover:text-white transition-all inline-flex items-center gap-1 text-xs font-bold"
                        title={dict.accounting.view_details}
                      >
                        <Eye className="w-4 h-4" />
                        <span>{dict.accounting.view_details}</span>
                      </Link>
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

