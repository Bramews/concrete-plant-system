"use client";

import { Icons } from "@/components/ui/Icons";
import { useState } from "react";

interface OrderSidebarProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  stats: {
    totalVolume: number;
    pendingCount: number;
    inProduction: number;
  };
  onNewOrder: () => void;
}

export function OrderSidebar({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  stats,
  onNewOrder,
}: OrderSidebarProps) {
  return (
    <aside
      className="w-[360px] bg-[#0b0f17] border-l border-white/5 flex flex-col overflow-hidden shadow-2xl z-20"
      dir="rtl"
    >
      {/* Search Header */}
      <div className="p-8 border-b border-white/5 bg-slate-900/40">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Icons.Box className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-none tracking-tight">
              إدارة الطلبيات
            </h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 western-nums">
              Logistics Control 3.0
            </p>
          </div>
        </div>

        <button
          onClick={onNewOrder}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 mb-10 group"
        >
          <Icons.Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          إنشاء طلب جديد
        </button>

        {/* Advanced Search & Filtering */}
        <div className="space-y-6">
          <div className="relative group">
            <Icons.Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="بحث عن عميل، مشروع، خلطة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:bg-white/10 transition-all focus:border-indigo-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
            {["ALL", "PENDING", "PRODUCTION", "DELIVERED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`
                      py-2.5 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest
                      ${filterStatus === status ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-white hover:bg-white/5"}
                    `}
              >
                {status === "ALL"
                  ? "الكل"
                  : status === "PENDING"
                    ? "قيد الانتظار"
                    : status === "PRODUCTION"
                      ? "إنتاج"
                      : "تم التسليم"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-24">
        {/* Logistics Highlights */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold font-black text-slate-500 uppercase tracking-widest px-1 border-r-2 border-indigo-500 mb-4 ">
            التدفق اللوجستي اليومي
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between group hover:bg-indigo-500/10 transition-all">
              <div>
                <p className="text-[8px] font-black text-slate-500 mb-1 uppercase tracking-tighter">
                  إجمالي الحجم المجدول
                </p>
                <p className="text-2xl font-black text-white western-nums tabular-nums">
                  {stats.totalVolume}{" "}
                  <span className="text-sm font-bold text-slate-600">m³</span>
                </p>
              </div>
              <Icons.Activity className="w-8 h-8 text-indigo-500 opacity-30 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-[1.5rem] text-right">
                <p className="text-[8px] font-black text-amber-500 mb-1 uppercase tracking-tighter">
                  طلبات قيد الانتظار
                </p>
                <p className="text-xl font-black text-amber-500 western-nums tabular-nums">
                  {stats.pendingCount}
                </p>
              </div>
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-[1.5rem] text-right">
                <p className="text-[8px] font-black text-emerald-500 mb-1 uppercase tracking-tighter">
                  قيد الإنتاج الفعلي
                </p>
                <p className="text-xl font-black text-emerald-500 western-nums tabular-nums">
                  {stats.inProduction}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Summary Card */}
        <div className="p-6 bg-gradient-to-br from-indigo-900/20 to-transparent border border-indigo-500/10 rounded-[2.5rem] space-y-4 relative overflow-hidden group">
          <div className="absolute -left-4 -top-4 w-20 h-20 bg-indigo-500/10 blur-2xl rounded-full" />
          <div className="flex items-center gap-3 relative z-10">
            <Icons.Truck className="w-5 h-5 text-indigo-400" />
            <p className="text-sm font-bold font-black text-indigo-400 uppercase tracking-widest leading-none">
              جاهزية الأسطول
            </p>
          </div>
          <div className="space-y-3 relative z-10">
            <div className="flex justify-between items-center text-sm font-bold">
              <p className="text-white font-bold">شاحنات متاحة</p>
              <span className="western-nums bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-sm font-bold font-black">
                12/15
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[80%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
