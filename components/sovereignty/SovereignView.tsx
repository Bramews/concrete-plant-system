"use client";

import { useState } from "react";
import { getSovereignData } from "@/app/actions/sovereignty";
import { SovereignConstitution } from "./SovereignConstitution";
import { SovereignVersioning } from "./SovereignVersioning";
import { SovereignCompliance } from "./SovereignCompliance";
import { AppendixA } from "./AppendixA";
import { AppendixB } from "./AppendixB";
import { SystemIntelligence } from "./SystemIntelligence";
import { usePreferences } from "@/context/PreferenceContext";

interface SovereignViewProps {
  data: {
    policies: any[];
    seals: any[];
    changeRequests: any[];
    violations: any[];
    health: any[];
    auditLogs: any[];
  };
}

export function SovereignView({ data }: SovereignViewProps) {
  const { t } = usePreferences();
  const [activeTab, setActiveTab] = useState<
    | "APPENDIX_A"
    | "APPENDIX_B"
    | "CONSTITUTION"
    | "VERSIONING"
    | "COMPLIANCE"
    | "SYSTEM_INTEL"
  >("APPENDIX_A");

  const [localData, setLocalData] = useState(data);

  const refresh = async () => {
    const fresh = await getSovereignData();
    setLocalData(fresh);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in text-white">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
            <span className="bg-white text-black px-3 py-1 rounded-lg">SV</span>
            {t.sovereignty.title}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {t.sovereignty.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("APPENDIX_A")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === "APPENDIX_A" ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-white/5 hover:bg-white/10"}`}
          >
            {t.sovereignty.tabs.system}
          </button>
          <button
            onClick={() => setActiveTab("APPENDIX_B")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === "APPENDIX_B" ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-white/5 hover:bg-white/10"}`}
          >
            {t.sovereignty.tabs.users}
          </button>
          <button
            onClick={() => setActiveTab("CONSTITUTION")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === "CONSTITUTION" ? "bg-cyan-500 text-white" : "bg-white/5 hover:bg-white/10"}`}
          >
            {t.sovereignty.tabs.constitution}
          </button>
          <button
            onClick={() => setActiveTab("VERSIONING")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === "VERSIONING" ? "bg-emerald-500 text-white" : "bg-white/5 hover:bg-white/10"}`}
          >
            {t.sovereignty.tabs.evolution}
          </button>
          <button
            onClick={() => setActiveTab("COMPLIANCE")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === "COMPLIANCE" ? "bg-rose-500 text-white" : "bg-white/5 hover:bg-white/10"}`}
          >
            {t.sovereignty.tabs.compliance}
          </button>
          <button
            onClick={() => setActiveTab("SYSTEM_INTEL")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === "SYSTEM_INTEL" ? "bg-amber-500 text-white" : "bg-white/5 hover:bg-white/10"}`}
          >
            {t.sovereignty.tabs.system_intel}
          </button>
        </div>
      </div>

      <div className="h-px bg-white/10 w-full" />

      {/* CONTENT AREA */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "APPENDIX_A" && (
          <AppendixA data={localData} refresh={refresh} />
        )}

        {activeTab === "APPENDIX_B" && (
          <AppendixB data={localData} refresh={refresh} />
        )}

        {activeTab === "CONSTITUTION" && <SovereignConstitution />}
        {activeTab === "VERSIONING" && (
          <SovereignVersioning requests={localData.changeRequests} />
        )}
        {activeTab === "COMPLIANCE" && (
          <SovereignCompliance violations={localData.violations} />
        )}
        {activeTab === "SYSTEM_INTEL" && (
          <SystemIntelligence
            changeRequests={localData.changeRequests}
            auditLogs={localData.auditLogs}
          />
        )}
      </div>
    </div>
  );
}
