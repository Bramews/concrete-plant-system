"use client";

import { useState } from "react";
import { ConcreteCRM } from "./ConcreteCRM";
import { SalesQuotesManager } from "./SalesQuotesManager";
import { Icons } from "@/components/ui/Icons";
import { FileText, Briefcase, ListCollapse } from "lucide-react";

interface SalesTabsProps {
  children: React.ReactNode; // The default orders list
}

export function SalesTabs({ children }: SalesTabsProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "crm" | "quotes">(
    "orders",
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/40 border border-white/5 rounded-2xl backdrop-blur-xl">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 ${
            activeTab === "orders"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ListCollapse className="w-4 h-4" />
          طلبيات المبيعات
        </button>

        <button
          onClick={() => setActiveTab("crm")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 ${
            activeTab === "crm"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          إدارة علاقات العملاء (CRM)
        </button>

        <button
          onClick={() => setActiveTab("quotes")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 ${
            activeTab === "quotes"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          عروض الأسعار
        </button>
      </div>

      {/* Tab Panels */}
      <div className="animate-in fade-in duration-300">
        {activeTab === "orders" && children}
        {activeTab === "crm" && <ConcreteCRM />}
        {activeTab === "quotes" && <SalesQuotesManager />}
      </div>
    </div>
  );
}
