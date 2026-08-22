"use client";

import { useState } from "react";
import Link from "next/link";
import { StatementItem } from "@/app/actions/finance";
import { RecordPaymentModal } from "@/components/accountant/RecordPaymentModal";
import {
  ArrowRight,
  Printer,
  FileText,
  Building2,
  Phone,
  Mail,
  MapPin,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";

interface Props {
  companyId: number;
  customer: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  projects: { id: number; name: string }[];
  items: StatementItem[];
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    currentBalance: number;
    currency: string;
  };
}

export function CustomerStatementView({
  companyId,
  customer,
  projects,
  items,
  summary,
}: Props) {
  const [selectedProject, setSelectedProject] = useState<string>("ALL");

  const fmt = (n: number) =>
    `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} ${summary.currency}`;

  const filteredItems = items.filter((item) => {
    if (selectedProject === "ALL") return true;
    return item.projectName === selectedProject;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 md:p-6 animate-fade-in">
      {/* Back and Actions Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Link
          href="/system/accountant/customers"
          className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة كشوفات العملاء</span>
        </Link>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl px-5 py-2.5 text-xs font-black transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>طباعة كشف الحساب (PDF)</span>
          </button>

          <RecordPaymentModal
            companyId={companyId}
            customerId={customer.id}
            customerName={customer.name}
            currency={summary.currency}
            defaultAmount={summary.currentBalance > 0 ? summary.currentBalance : undefined}
          />
        </div>
      </div>

      {/* Printable Statement Document */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 print:text-black">
        {/* Customer Header Info */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl md:text-3xl font-black text-white print:text-black">
                {customer.name}
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-1 print:text-gray-600">
              كشف حساب تفصيلي لحركات التوريد والسداد المالي
            </p>
          </div>

          <div className="text-right text-xs space-y-1 text-slate-300 print:text-gray-700 font-mono">
            {customer.phone && (
              <div className="flex items-center gap-1.5 justify-end">
                <span>{customer.phone}</span>
                <Phone className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-1.5 justify-end">
                <span>{customer.address}</span>
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}
            <div className="text-slate-400 print:text-gray-500">
              تاريخ استخراج الكشف: {new Date().toLocaleDateString("ar-SA")}
            </div>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 print:bg-gray-100 p-4 rounded-2xl border border-white/5 print:border-gray-300">
            <span className="text-xs text-slate-400 print:text-gray-600 font-bold block">إجمالي المسحوبات (مدين)</span>
            <span className="text-xl font-black font-mono text-white print:text-black mt-1 block">
              {fmt(summary.totalInvoiced)}
            </span>
          </div>

          <div className="bg-emerald-500/10 print:bg-emerald-50 p-4 rounded-2xl border border-emerald-500/20 print:border-emerald-200">
            <span className="text-xs text-emerald-400 print:text-emerald-700 font-bold block">إجمالي المسدد (دائن)</span>
            <span className="text-xl font-black font-mono text-emerald-400 print:text-emerald-800 mt-1 block">
              {fmt(summary.totalPaid)}
            </span>
          </div>

          <div className="bg-rose-500/10 print:bg-rose-50 p-4 rounded-2xl border border-rose-500/20 print:border-rose-200">
            <span className="text-xs text-rose-400 print:text-rose-700 font-bold block">الرصيد القائم المستحق</span>
            <span className="text-xl font-black font-mono text-rose-400 print:text-rose-800 mt-1 block">
              {fmt(summary.currentBalance)}
            </span>
          </div>
        </div>

        {/* Project Filter (Hidden in Print) */}
        {projects.length > 0 && (
          <div className="flex items-center gap-2 pt-2 print:hidden">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-400">تصفية حسب المشروع:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:ring-2 ring-blue-500/20"
            >
              <option value="ALL" className="bg-slate-900 text-white">
                جميع المشاريع ({projects.length})
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.name} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Statement Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.02] print:bg-gray-100 border-y border-white/10 print:border-gray-300">
                <th className="px-4 py-3.5 text-xs font-black text-slate-400 print:text-black uppercase">
                  التاريخ
                </th>
                <th className="px-4 py-3.5 text-xs font-black text-slate-400 print:text-black uppercase">
                  المرجع
                </th>
                <th className="px-4 py-3.5 text-xs font-black text-slate-400 print:text-black uppercase">
                  البيان والمشروع
                </th>
                <th className="px-4 py-3.5 text-xs font-black text-slate-400 print:text-black uppercase">
                  الخلطة / الكمية
                </th>
                <th className="px-4 py-3.5 text-xs font-black text-slate-400 print:text-black uppercase">
                  مدين (فاتورة)
                </th>
                <th className="px-4 py-3.5 text-xs font-black text-slate-400 print:text-black uppercase">
                  دائن (دفعة)
                </th>
                <th className="px-4 py-3.5 text-xs font-black text-slate-400 print:text-black uppercase">
                  الرصيد
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-gray-200 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-slate-500 print:text-gray-500 italic"
                  >
                    لا توجد حركات مسجلة لهذا الحساب
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] print:hover:bg-transparent"
                  >
                    <td className="px-4 py-3.5 font-mono text-slate-400 print:text-gray-700">
                      {new Date(item.date).toLocaleDateString("ar-SA")}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-blue-400 print:text-blue-700">
                      {item.reference}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white print:text-black">
                        {item.description}
                      </div>
                      <div className="text-[10px] text-slate-400 print:text-gray-600">
                        مشروع: {item.projectName}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono">
                      {item.quantity > 0 ? (
                        <span>
                          {item.quantity} م³ ({item.mixCode})
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-slate-200 print:text-black">
                      {item.debit > 0 ? fmt(item.debit) : "—"}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-400 print:text-emerald-700">
                      {item.credit > 0 ? fmt(item.credit) : "—"}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-black text-white print:text-black">
                      {fmt(item.balance)}
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
