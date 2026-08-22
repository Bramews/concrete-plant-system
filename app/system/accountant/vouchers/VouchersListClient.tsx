"use client";

import { useState } from "react";
import { DollarSign, Printer, Search, ArrowDownLeft } from "lucide-react";

interface Voucher {
  id: number;
  type: string;
  amount: number;
  description: string;
  date: Date;
  currency: string;
}

interface Props {
  vouchers: Voucher[];
  currency: string;
}

export function VouchersListClient({ vouchers, currency }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const fmt = (n: number) =>
    `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} ${currency}`;

  const filteredVouchers = vouchers.filter((v) =>
    v.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-4 md:p-6 border border-white/5 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث في سندات القبض والدفع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pr-11 pl-4 py-3 text-xs font-bold text-white placeholder-slate-500 outline-none focus:ring-2 ring-emerald-500/20"
          />
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl px-5 py-2.5 text-xs font-black transition-all flex items-center gap-2 print:hidden shrink-0"
        >
          <Printer className="w-4 h-4 text-blue-400" />
          <span>طباعة سجل السندات</span>
        </button>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  رقم السند
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  التاريخ
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  النوع
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  البيان والتفاصيل
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                  المبلغ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-20 text-center text-slate-500 italic text-sm"
                  >
                    لا توجد سندات مسجلة حالياً
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-white/[0.03] transition-all group border-b border-white/5"
                  >
                    <td className="px-6 py-6 font-mono font-bold text-blue-400">
                      #VOUCHER-{v.id}
                    </td>

                    <td className="px-6 py-6 font-mono text-slate-400 text-xs">
                      {new Date(v.date).toLocaleDateString("ar-SA")}
                    </td>

                    <td className="px-6 py-6">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 w-fit">
                        <ArrowDownLeft className="w-3 h-3" />
                        سند قبض
                      </span>
                    </td>

                    <td className="px-6 py-6 text-white font-bold text-xs max-w-md">
                      {v.description}
                    </td>

                    <td className="px-6 py-6 font-mono font-black text-emerald-400 text-base">
                      {fmt(v.amount)}
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
