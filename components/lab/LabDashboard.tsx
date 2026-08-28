"use client";

import { Icons } from "@/components/ui/Icons";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { DictionaryType } from "@/lib/dictionary";

const data = [
  { name: "Sat", strength: 28, target: 30 },
  { name: "Sun", strength: 32, target: 30 },
  { name: "Mon", strength: 31, target: 30 },
  { name: "Tue", strength: 34, target: 30 },
  { name: "Wed", strength: 29, target: 30 },
  { name: "Thu", strength: 33, target: 30 },
  { name: "Fri", strength: 35, target: 30 },
];

interface LabDashboardProps {
  dict: DictionaryType["lab"];
  stats: {
    mixCount: number;
    pendingCubes: number;
    avgStrength7d: number;
    sieveCount: number;
    recentTests: {
      id: string | number;
      status: string;
      age: number;
      order?: {
        orderNumber?: string;
        project?: { name?: string } | null;
        mixDesign?: { strengthClass?: string | null; name?: string } | null;
      } | null;
    }[];
  };
  isRtl?: boolean;
}

export default function LabDashboard({
  dict,
  stats,
  isRtl = false,
}: LabDashboardProps) {
  const safeStats = {
    mixCount: stats?.mixCount ?? 0,
    pendingCubes: stats?.pendingCubes ?? 0,
    avgStrength7d: stats?.avgStrength7d ?? 0,
    sieveCount: stats?.sieveCount ?? 0,
    recentTests: stats?.recentTests ?? [],
  };

  const kpiData = [
    {
      label: dict.dashboard.kpi.sieve_tests,
      value: safeStats.sieveCount.toString(),
      icon: Icons.Filter,
      color: "from-blue-500 to-indigo-500",
      trend: `${dict.dashboard.kpi.total}`,
    },
    {
      label: dict.dashboard.kpi.avg_strength,
      value: `${safeStats.avgStrength7d.toFixed(1)} MPa`,
      sub: `${dict.dashboard.kpi.target}: 30 MPa`,
      icon: Icons.TrendingUp,
      color: "from-emerald-500 to-teal-500",
      trend: dict.dashboard.kpi.total,
    },
    {
      label: dict.dashboard.kpi.pending_cubes,
      value: safeStats.pendingCubes.toString(),
      sub: `${dict.dashboard.kpi.due_today}`,
      icon: Icons.Activity,
      color: "from-amber-500 to-orange-500",
      trend: isRtl ? "مطلوب إجراء" : "Action Required",
    },
    {
      label: dict.dashboard.kpi.active_mix_designs,
      value: safeStats.mixCount.toString(),
      sub: `${dict.dashboard.kpi.this_month}`,
      icon: Icons.Beaker,
      color: "from-purple-500 to-pink-500",
      trend: isRtl ? "تم التحقق" : "Verified",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-2">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-card/30 border border-white/5 p-10 shadow-2xl backdrop-blur-3xl animate-slide-up">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
              {dict.dashboard.title}
            </h1>
            <p className="text-slate-400 text-lg font-medium">
              {dict.dashboard.subtitle}
            </p>
          </div>
          <div className="flex gap-4"></div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-[2.5rem] bg-card/40 hover:bg-card/80 border border-white/5 hover:border-white/20 p-8 transition-all duration-500"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
            />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-3 rounded-2xl bg-gradient-to-br ${kpi.color} shadow-lg shadow-indigo-900/20`}
                >
                  <kpi.icon className="w-6 h-6 text-white" />
                </div>
                {kpi.sub && (
                  <span className="text-sm font-bold px-2 py-1 rounded-full bg-white/5 text-slate-400 border border-white/5">
                    {kpi.sub}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-3xl font-black text-white tracking-tight">
                  {kpi.value}
                </h3>
                <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                  {kpi.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-3xl bg-slate-900/50 border border-white/5 p-8 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {dict.dashboard.sections.quality_trend}
              </h3>
              <p className="text-sm text-slate-400">
                {dict.dashboard.sections.quality_sub}
              </p>
            </div>
            <select
              aria-label="Filter by grade"
              className="bg-background/50 border border-white/10 rounded-xl text-sm font-bold font-black uppercase text-slate-400 px-4 py-2 outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option>{isRtl ? "C35 (الكل)" : "C35 (All)"}</option>
              <option>C40</option>
            </select>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient
                    id="colorStrength"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[20, 40]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="strength"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorStrength)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900/50 border border-white/5 p-8 backdrop-blur-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">
              {dict.dashboard.sections.due_today}
            </h3>
            <Icons.Clock className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="flex-1 space-y-4">
            {safeStats.recentTests.length > 0 ? (
              safeStats.recentTests.map((test) => (
                <div
                  key={test.id}
                  className="flex p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer"
                >
                  <div
                    className={`w-1 rounded-full ${test.status === "APPROVED" ? "bg-emerald-500" : "bg-amber-500"} mr-4`}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-white">
                        {test.order?.orderNumber || "N/A"}
                      </span>
                      <span
                        className={`text-sm font-bold px-2 py-0.5 rounded ${test.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
                      >
                        {test.status === "APPROVED"
                          ? dict.tests.status.completed
                          : dict.tests.status.pending}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 mb-2">
                      {test.order?.project?.name || "بدون مشروع"} •{" "}
                      {test.order?.mixDesign?.strengthClass ||
                        test.order?.mixDesign?.name ||
                        "C30"}
                    </p>
                    <div className="text-sm font-bold text-slate-500">
                      {dict.dashboard.kpi.pending_review} ({test.age} يوم)
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-slate-500">
                <Icons.Activity className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm font-bold">{dict.dashboard.subtitle}</p>
              </div>
            )}
          </div>

          <button className="w-full mt-6 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition-all">
            {dict.dashboard.actions.view_all}
          </button>
        </div>
      </div>
    </div>
  );
}
