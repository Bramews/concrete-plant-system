"use client";

import { Icons } from "@/components/ui/Icons";
import { KpiCard } from "../KpiCard";
import Link from "next/link";

interface LaboratorySectionProps {
  data: Record<string, any>; // Not used currently as we are mirroring LabDashboard mock logic for now
  lang: string;
}

export function LaboratorySection({ data, lang }: LaboratorySectionProps) {
  const isRtl = lang === "ar";

  // Mirroring LabDashboard Data Logic
  // In a real scenario, this should come from a shared 'useLabStats' hook

  const kpis = [
    {
      title: isRtl ? "تصاميم الخلطات النشطة" : "Active Mix Designs",
      value: "12",
      icon: "Beaker" as keyof typeof Icons,
      status: "neutral" as const,
      trend: isRtl ? "+2 هذا الشهر" : "+2 This Month",
    },
    {
      title: isRtl ? "مكعبات قيد الفحص" : "Pending Cubes",
      value: "8",
      icon: "Activity" as keyof typeof Icons,
      status: "warning" as const,
      trend: isRtl ? "3 مستحق اليوم" : "3 Due Today",
    },
    {
      title: isRtl ? "متوسط قوة 7 أيام" : "Avg Strength (7 Days)",
      value: "32.5",
      subValue: isRtl ? "ميجا باسكال" : "MPa",
      icon: "TrendingUp" as keyof typeof Icons,
      status: "success" as const,
      trend: isRtl ? "الهدف: 30" : "Target: 30",
    },
    {
      title: isRtl ? "فحوصات مناخل" : "Sieve Tests",
      value: "5",
      icon: "Filter" as keyof typeof Icons,
      status: "neutral" as const,
      trend: isRtl ? "قيد المراجعة" : "Pending Review",
    },
  ];

  const upcomingTests = [
    {
      id: 1,
      sample: "SMP-2024-001",
      type: isRtl ? "فحص مكعبات (7 أيام)" : "Cube Test (7 Days)",
      date: isRtl ? "مستحق اليوم" : "Due Today",
      status: "DUE",
      project: "Al-Amal Hospital",
    },
    {
      id: 2,
      sample: "SMP-2024-002",
      type: isRtl ? "فحص مكعبات (7 أيام)" : "Cube Test (7 Days)",
      date: isRtl ? "مستحق اليوم" : "Due Today",
      status: "DUE",
      project: "City Center Mall",
    },
    {
      id: 3,
      sample: "SMP-2024-003",
      type: isRtl ? "تحليل مناخل" : "Sieve Analysis",
      date: isRtl ? "غداً" : "Tomorrow",
      status: "PENDING",
      project: "Road A1",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Icons.Beaker className="w-5 h-5" />
          </div>
          {isRtl ? "نظرة عامة على المختبر" : "Laboratory Overview"}
        </h2>
        <Link
          href="/system/lab"
          className="text-sm font-bold font-black bg-white/5 text-slate-400 px-4 py-2 rounded-xl hover:bg-indigo-500 hover:text-white transition-all uppercase tracking-widest ring-1 ring-white/10"
        >
          {isRtl ? "الذهاب للمختبر" : "OPEN LAB SYSTEM"}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <KpiCard
            key={idx}
            dir={isRtl ? "rtl" : "ltr"}
            title={kpi.title}
            value={kpi.value}
            subValue={kpi.subValue}
            icon={kpi.icon}
            status={kpi.status}
            trend={kpi.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks List (Mirrors LabDashboard) */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <h3 className="text-sm font-bold font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Icons.Clock className="w-4 h-4 text-indigo-400" />
            {isRtl ? "المهام المستحقة" : "URGENT TEST TASKS"}
          </h3>

          <div className="space-y-3">
            {upcomingTests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-1 h-10 rounded-full ${
                      test.status === "DUE"
                        ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                        : "bg-amber-500"
                    }`}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {test.sample}
                    </h3>
                    <p className="text-sm font-bold font-medium text-slate-400 mt-0.5">
                      {test.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    {test.project}
                  </span>
                  <div className="px-3 py-1 rounded-lg bg-white/5 text-sm font-bold font-black text-slate-300">
                    {test.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
