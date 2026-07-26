"use client";

import { useMemo } from "react";
import { Icons } from "@/components/ui/Icons";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";
import { format } from "date-fns";

export function AnalyticsDashboard({ data = {} }: { data: any }) {
  const chartData = useMemo(() => {
    if (!data?.cubeResults) return [];
    return data.cubeResults.map((c: any) => ({
      date: c.sampleDate ? format(new Date(c.sampleDate), "dd/MM") : "---",
      mpa: c.mpa || 0,
      target: parseInt(
        c.order?.mixDesign?.strengthClass?.match(/\d+/)?.[0] || "30",
      ),
    }));
  }, [data?.cubeResults]);

  const wastageChart = useMemo(() => {
    if (!data?.wastageData) return [];
    return data.wastageData.map((d: any) => ({
      id: d.id,
      actual: d.actual || 0,
      target: d.target || 0,
      diff: Number((d.diff || 0).toFixed(2)),
    }));
  }, [data?.wastageData]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="إجمالي الفحوصات"
          value={data.totalCubes}
          icon={<Icons.Activity className="w-5 h-5" />}
          trend="+12%"
          color="text-indigo-400"
        />
        <KPICard
          title="الانحراف المعياري"
          value={data.stdDev + " MPa"}
          icon={<Icons.TrendingUp className="w-5 h-5" />}
          trend={data.stdDev < 3 ? "GOOD" : "AVR"}
          color="text-emerald-400"
        />
        <KPICard
          title="متوسط المقاومة"
          value={data.mean + " MPa"}
          icon={<Icons.Beaker className="w-5 h-5" />}
          trend="Stable"
          color="text-amber-400"
        />
        <KPICard
          title="الحمولات المراقبة"
          value={data.totalBatches}
          icon={<Icons.Truck className="w-5 h-5" />}
          trend="Production Ready"
          color="text-purple-400"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Stability Chart */}
        <div className="bg-slate-900 shadow-2xl p-6 rounded-3xl border border-white/5">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Icons.Activity className="w-4 h-4 text-indigo-400" />
            </div>
            استقرار الجودة (المقاومة الفعلية vs المستهدفة)
          </h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mpa"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorMpa)"
                />
                <Line
                  type="stepAfter"
                  dataKey="target"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Material Wastage Chart */}
        <div className="bg-slate-900 shadow-2xl p-6 rounded-3xl border border-white/5">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Icons.TrendingDown className="w-4 h-4 text-emerald-400" />
            </div>
            تحليل الهدر (الكميات الفعلية vs المجدولة)
          </h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wastageChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="id" stroke="#64748b" fontSize={8} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="target"
                  fill="#64748b"
                  fillOpacity={0.2}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced Performance Scatter Plot */}
      <div className="bg-slate-900 shadow-2xl p-6 rounded-3xl border border-white/5">
        <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Icons.Search className="w-4 h-4 text-amber-400" />
          </div>
          توزيع النتائج (Scatter Plot) - تحليل الانحراف
        </h3>
        <div className="h-[350px] w-full min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid stroke="#1e293b" strokeDasharray="5 5" />
              <XAxis
                type="category"
                dataKey="date"
                name="Date"
                stroke="#64748b"
                fontSize={10}
              />
              <YAxis
                type="number"
                dataKey="mpa"
                name="Strength"
                stroke="#64748b"
                fontSize={10}
                unit="MPa"
              />
              <ZAxis type="number" dataKey="target" range={[50, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                }}
              />
              <Scatter name="Tests" data={chartData} fill="#6366f1">
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.mpa >= entry.target ? "#10b981" : "#ef4444"}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex gap-4 text-sm font-bold items-center justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> مطابقة
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" /> دون المواصفة
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, trend, color }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-slate-900 border border-white/5 p-5 rounded-3xl shadow-xl overflow-hidden relative group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-500 font-black uppercase tracking-widest mb-1">
        {title}
      </p>
      <h4 className={`text-2xl font-black ${color} mb-2`}>{value}</h4>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-bold px-2 py-0.5 rounded-full bg-white/5 ${
            trend === "GOOD" ? "text-emerald-400" : "text-indigo-400"
          }`}
        >
          {trend}
        </span>
      </div>
    </motion.div>
  );
}
