"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface BatchCurvePoint {
  time: string;
  cement: number;
  aggregates: number;
  water: number;
  admixture: number;
}

interface LiveBatchCurveChartProps {
  data: BatchCurvePoint[];
  isSimulated?: boolean;
}

export function LiveBatchCurveChart({
  data,
  isSimulated,
}: LiveBatchCurveChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 w-full bg-slate-950/60 border border-white/5 rounded-2xl flex items-center justify-between px-6 text-slate-500 text-xs font-bold">
        <span>
          بانتظار بدء دورة الخلط لعرض الكيرف اللحظي (Live Batch Curve)...
        </span>
        {isSimulated && (
          <span className="text-amber-400 font-mono text-[10px]">
            🧪 نمط المحاكاة والتدريب
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-950/80 border border-white/10 p-4 rounded-3xl space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          مخطط كيرف أوزان الخلط اللحظي (Live Batch Dosing Curve)
        </span>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="text-blue-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> الأسمنت
          </span>
          <span className="text-amber-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> الحصى
          </span>
          <span className="text-cyan-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> الماء
          </span>
          <span className="text-purple-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> الإضافات
          </span>
          {isSimulated && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-mono">
              🧪 محاكاة تدريبية
            </span>
          )}
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradCement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradAggregates" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff10"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
            />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "12px",
                fontSize: "11px",
                color: "#fff",
              }}
            />
            <Area
              type="monotone"
              dataKey="aggregates"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#gradAggregates)"
              strokeWidth={2}
              name="الحصى (كغم)"
            />
            <Area
              type="monotone"
              dataKey="cement"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#gradCement)"
              strokeWidth={2}
              name="الأسمنت (كغم)"
            />
            <Area
              type="monotone"
              dataKey="water"
              stroke="#06b6d4"
              fillOpacity={1}
              fill="url(#gradWater)"
              strokeWidth={2}
              name="الماء (لتر)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
