import Link from "next/link";
import { requireRole, getSession } from "@/lib/auth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import { Metadata } from "next";
import { getInvoices, getInvoiceKpis } from "@/app/actions/finance";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

export const metadata: Metadata = {
  title: "إدارة الفواتير والذمم | النظام المحاسبي",
  description: "نظام إدارة الفواتير والتحصيل المالي",
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

  const kpis = await getInvoiceKpis(companyId);
  const invoices = await getInvoices(companyId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-IQ", {
      style: "currency",
      currency: isRtl ? "IQD" : "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
            {dict.accounting.invoicing_receivables}
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm font-bold mt-1 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-primary/30"></span>
            {dict.accounting.cashflow_management}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold transition-all">
            {dict.accounting.export_report}
          </button>
          <button className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 rounded-xl px-6 py-2 text-sm font-black transition-all">
            {dict.accounting.new_invoice}
          </button>
        </div>
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
            <h3 className="font-black text-white tracking-widest uppercase text-sm font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              {dict.accounting.recent_invoices}
            </h3>
          </div>
          <div className="w-full md:w-64 relative">
            <input
              type="text"
              placeholder={dict.common?.search || "بحث..."}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white focus:ring-2 ring-blue-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right md:text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-5 text-sm font-bold font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {dict.accounting.invoice_no}
                </th>
                <th className="px-6 py-5 text-sm font-bold font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {dict.accounting.customer}
                </th>
                <th className="px-6 py-5 text-sm font-bold font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {dict.accounting.amount}
                </th>
                <th className="px-6 py-5 text-sm font-bold font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">
                  {dict.accounting.status}
                </th>
                <th className="px-6 py-5 text-sm font-bold font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">
                  {dict.accounting.action}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-20 text-center text-slate-500 italic"
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
                    <td className="px-6 py-6 font-mono text-sm text-blue-400/80 font-bold">
                      #{inv.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-sm font-black text-white">
                        {inv.order?.customer?.name || "-"}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">
                        {inv.ticket?.ticketNumber || inv.type}
                      </div>
                    </td>
                    <td className="px-6 py-6 font-mono">
                      <div className="text-lg font-black tracking-tighter text-emerald-400">
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
                        className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-slate-400 hover:text-white transition-all inline-flex"
                        title={dict.accounting.view_details}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
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
