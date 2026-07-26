"use client";

import React, { useState } from "react";
import { Icons } from "@/components/ui/Icons";

interface CockpitClientTabsProps {
  PlantMap: React.ReactNode;
  LiveGauges: React.ReactNode;
  DailyTimeline: React.ReactNode;
  ActiveOrdersKanban: React.ReactNode;
  DriverPwaSimulator: React.ReactNode;
  OneClickProduction: React.ReactNode;
}

const ICON_MAP = {
  Activity: Icons.Activity,
  Ticket: Icons.Ticket,
  User: Icons.User,
};

export default function CockpitClientTabs({
  PlantMap,
  LiveGauges,
  DailyTimeline,
  ActiveOrdersKanban,
  DriverPwaSimulator,
  OneClickProduction,
}: CockpitClientTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("cockpit");

  const tabs = [
    {
      id: "cockpit",
      label: "قمرة القيادة والخلط المباشر",
      iconName: "Activity" as const,
    },
    {
      id: "orders",
      label: "الطلبيات النشطة وطابور الخلط",
      iconName: "Ticket" as const,
    },
    {
      id: "driver",
      label: "محاكي السائقين والتوصيل (PWA)",
      iconName: "User" as const,
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Tab Switcher Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {tabs.map((tab) => {
          const Icon = ICON_MAP[tab.iconName] || Icons.Activity;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/10"
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="transition-all duration-300">
        {activeTab === "cockpit" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">{PlantMap}</div>
              <div className="lg:col-span-1">{LiveGauges}</div>
            </div>
            {DailyTimeline}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {ActiveOrdersKanban}
          </div>
        )}

        {activeTab === "driver" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {DriverPwaSimulator}
          </div>
        )}
      </div>

      {/* Floating One-Click Production widget */}
      {OneClickProduction}
    </div>
  );
}
