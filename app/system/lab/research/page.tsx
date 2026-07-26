"use client";

import { motion } from "framer-motion";
import { Icons } from "@/components/ui/Icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const researchData = [
  { name: "Mix A (C30)", strength: 32, cost: 80 },
  { name: "Mix B (C35)", strength: 38, cost: 95 },
  { name: "Mix C (C40)", strength: 45, cost: 110 },
  { name: "Exp. Mix X1", strength: 28, cost: 75 },
  { name: "Exp. Mix X2", strength: 42, cost: 105 },
];

export default function LabResearchPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 tracking-tight">
              البحث والتطوير (R&D)
            </h1>
            <p className="text-slate-400 mt-2 font-medium">
              تحليل الخلطات التجريبية وتطوير المنتجات الجديدة
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-500/30">
            <Icons.Plus className="w-5 h-5" />
            <span>تجربة جديدة</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "خلطات تجريبية نشطة",
            value: "3",
            icon: Icons.Beaker,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
          {
            label: "أبحاث مكتملة (2024)",
            value: "12",
            icon: Icons.CheckCircle,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "كفاءة التكلفة",
            value: "+15%",
            icon: Icons.TrendingUp,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-purple-500/30 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-bold mb-1">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-black text-white">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Icons.BarChart className="w-5 h-5 text-purple-400" />
          مقارنة الأداء والتكلفة
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={researchData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#fff" }}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="strength"
                name="Strength (MPa)"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="cost"
                name="Cost ($/m3)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
