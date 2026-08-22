"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CustomerLedgerSummary } from "@/app/actions/finance";
import { RecordPaymentModal } from "@/components/accountant/RecordPaymentModal";
import {
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Phone,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

interface Props {
  companyId: number;
  customers: CustomerLedgerSummary[];
  currency: string;
}

export function CustomerLedgersClient({ companyId, customers, currency }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "OVERDUE" | "WITH_BALANCE">("ALL");

  const fmt = (n: number) =>
    `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} ${currency}`;

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm));

      if (!matchesSearch) return false;

      if (filterType === "OVERDUE") return c.overdueInvoicesCount > 0 || c.isOverLimit;
      if (filterType === "WITH_BALANCE") return c.outstandingBalance > 0;
      return true;
    });
  }, [customers, searchTerm, filterType]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="glass-panel rounded-3xl p-4 md:p-6 border border-white/5 shadow-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث باسم العميل أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pr-11 pl-4 py-3 text-xs font-bold text-white placeholder-slate-500 outline-none focus:ring-2 ring-blue-500/20"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterType === "ALL"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            جميع العملاء ({customers.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("WITH_BALANCE")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterType === "WITH_BALANCE"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            عليهم ذمم مستحقة ({customers.filter((c) => c.outstandingBalance > 0).length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("OVERDUE")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterType === "OVERDUE"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            متأخرات وتجاوز السقف ({customers.filter((c) => c.overdueInvoicesCount > 0 || c.isOverLimit).length})
          </button>
        </div>
      </div>

      {/* Customer Ledgers Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  العميل / المقاول
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  المشاريع والطلبيات
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  إجمالي الفواتير
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  المبلغ المسدد
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  الرصيد المتبقي (الذمة)
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  حالة الائتمان
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5 text-center">
                  الإجراءات المالية
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-20 text-center text-slate-500 italic text-sm"
                  >
                    لا يوجد عملاء مطابقين لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-white/[0.03] transition-all group border-b border-white/5"
                  >
                    <td className="px-6 py-6">
                      <div className="font-bold text-white text-base flex items-center gap-2">
                        <span>{c.name}</span>
                      </div>
                      {c.phone && (
                        <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-6">
                      <div className="text-xs font-bold text-slate-300">
                        {c.projectsCount} مشاريع نشطة
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {c.ordersCount} طلبيات توريد
                      </div>
                    </td>

                    <td className="px-6 py-6 font-mono font-bold text-slate-300">
                      {fmt(c.totalInvoiced)}
                    </td>

                    <td className="px-6 py-6 font-mono font-bold text-emerald-400">
                      {fmt(c.totalPaid)}
                    </td>

                    <td className="px-6 py-6 font-mono font-black text-base text-rose-400">
                      {fmt(c.outstandingBalance)}
                    </td>

                    <td className="px-6 py-6">
                      {c.isOverLimit ? (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          تجاوز السقف ({fmt(c.creditLimit)})
                        </span>
                      ) : c.outstandingBalance > 0 ? (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 w-fit">
                          ذمة معلقة
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          خالص الحساب
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/system/accountant/customers/${c.id}`}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          <span>كشف حساب</span>
                        </Link>

                        <RecordPaymentModal
                          companyId={companyId}
                          customerId={c.id}
                          customerName={c.name}
                          currency={currency}
                          defaultAmount={c.outstandingBalance > 0 ? c.outstandingBalance : undefined}
                        />
                      </div>
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
