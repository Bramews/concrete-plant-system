"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { AppCard, ActionButton } from "@/components/ui/IndustrialComponents";
import { format } from "date-fns";
import Link from "next/link";
import { ar } from "date-fns/locale";

interface ReportsClientProps {
  initialData: any;
  dict: any;
  lang: string;
}

export function ReportsClient({ initialData, dict, lang }: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<"cubes" | "sieves" | "mixes">(
    "cubes",
  );
  const [search, setSearch] = useState("");

  const isRtl = lang === "ar";

  const getFilteredData = () => {
    const list = initialData[activeTab] || [];
    if (!search) return list;

    return list.filter((item: any) => {
      const searchStr = search.toLowerCase();
      if (activeTab === "cubes") {
        return (
          item.order?.orderNumber?.toLowerCase().includes(searchStr) ||
          item.order?.project?.name?.toLowerCase().includes(searchStr)
        );
      } else if (activeTab === "sieves") {
        return item.material?.name?.toLowerCase().includes(searchStr);
      } else {
        return (
          item.name?.toLowerCase().includes(searchStr) ||
          item.code?.toLowerCase().includes(searchStr)
        );
      }
    });
  };

  const currentList = getFilteredData();

  const tabs = [
    {
      id: "cubes",
      label: isRtl ? "نتائج المكعبات" : "Cube Results",
      icon: Icons.Activity,
    },
    {
      id: "sieves",
      label: isRtl ? "تحليل المناخل" : "Sieve Analysis",
      icon: Icons.Filter,
    },
    {
      id: "mixes",
      label: isRtl ? "تصاميم الخلطات" : "Mix Designs",
      icon: Icons.Beaker,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs Row */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/40 rounded-2xl border border-white/5 backdrop-blur-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-sm font-bold transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/40"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-indigo-400" />
          <input
            type="text"
            placeholder={
              isRtl
                ? "ابحث برقم الطلب، المشروع، أو الكود..."
                : "Search by order, project, or code..."
            }
            className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-12 py-3.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Results List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentList.length > 0 ? (
          currentList.map((item: any) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/30 p-6 hover:bg-slate-900/50 hover:border-white/10 transition-all duration-300 shadow-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-bold font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {isRtl ? "معتمد" : "APPROVED"}
                  </span>
                  <span className="text-sm font-bold text-slate-500">
                    {format(
                      new Date(
                        item.sampleDate || item.updatedAt || item.createdAt,
                      ),
                      "dd/MM/yyyy",
                      { locale: isRtl ? ar : undefined },
                    )}
                  </span>
                </div>

                <div className="flex-1 space-y-2 mb-6">
                  <h3 className="text-lg font-black text-white truncate">
                    {activeTab === "cubes"
                      ? `${isRtl ? "طلب رقم" : "Order"} ${item.order?.orderNumber}`
                      : activeTab === "sieves"
                        ? item.material?.name
                        : item.name}
                  </h3>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Icons.Project className="w-3 h-3 text-slate-600" />
                    {activeTab === "cubes"
                      ? item.order?.project?.name ||
                        (isRtl ? "بدون مشروع" : "No Project")
                      : activeTab === "mixes"
                        ? item.code
                        : isRtl
                          ? "فحص مختبري"
                          : "Lab Test"}
                  </p>
                </div>

                <Link
                  href={`/system/lab/reports/${activeTab === "cubes" ? "cube" : activeTab === "mixes" ? "mix" : "sieve"}/${item.id}`}
                  className="mt-auto w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-black text-sm font-bold shadow-lg shadow-indigo-900/40 transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
                >
                  <Icons.Printer className="w-4 h-4 transition-transform group-hover/btn:rotate-12" />
                  {isRtl ? "عرض التقرير" : "View Report"}
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="lg:col-span-3 py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto opacity-20">
              <Icons.Search className="w-8 h-8 text-white" />
            </div>
            <p className="text-slate-500 font-bold uppercase text-sm font-bold tracking-widest">
              {isRtl
                ? "لا توجد سجلات معتمدة لهذا البحث"
                : "No approved records found for this query"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
