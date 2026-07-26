"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { SmartAlertCenter } from "./SmartAlertCenter";
import { CostIntelligencePanel } from "./CostIntelligencePanel";
import { OKRManager } from "./OKRManager";
import { AlertTriangle, DollarSign, Target, Activity } from "lucide-react";

interface ManagerTabsProps {
  children: React.ReactNode; // The default dashboard view
}

export function ManagerTabs({ children }: ManagerTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "alerts" | "costs" | "okrs"
  >("dashboard");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/40 border border-white/5 rounded-2xl backdrop-blur-xl">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 ${
            activeTab === "dashboard"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="w-4 h-4" />
          النبض العام للإنتاج
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 ${
            activeTab === "alerts"
              ? "bg-rose-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          مركز الإنذار الذكي
        </button>

        <button
          onClick={() => setActiveTab("costs")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 ${
            activeTab === "costs"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          ذكاء التكاليف والأرباح
        </button>

        <button
          onClick={() => setActiveTab("okrs")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 ${
            activeTab === "okrs"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Target className="w-4 h-4" />
          الأهداف والـ OKRs
        </button>
      </div>

      {/* Tab Panels */}
      <div className="animate-in fade-in duration-300">
        {activeTab === "dashboard" && children}
        {activeTab === "alerts" && <SmartAlertCenter />}
        {activeTab === "costs" && <CostIntelligencePanel />}
        {activeTab === "okrs" && <OKRManager />}
      </div>
    </div>
  );
}
