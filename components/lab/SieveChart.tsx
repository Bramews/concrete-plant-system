"use client";

import React from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface SieveChartProps {
  data: {
    size: number;
    passing: number;
    min?: number;
    max?: number;
  }[];
  standards?: {
    name: string;
    sieves: { size: number; min: number; max: number }[];
  }[];
  isPrintMode?: boolean;
}

export default function SieveChart({ data, standards }: SieveChartProps) {
  const allSizes = Array.from(
    new Set([
      ...data.map((d) => d.size),
      ...(standards?.flatMap((s) => s.sieves.map((sv) => sv.size)) || []),
    ]),
  ).sort((a, b) => b - a);

  const chartData = allSizes.map((size) => {
    const reading = data.find((d) => d.size === size);
    const result: any = { size };

    if (reading) {
      result.passing = reading.passing;
    }

    standards?.forEach((std, idx) => {
      const stdSieve = std.sieves.find((s) => s.size === size);
      if (stdSieve) {
        result[`min${idx}`] = stdSieve.min;
        result[`max${idx}`] = stdSieve.max;
      }
    });

    return result;
  });

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 15, right: 20, left: 5, bottom: 20 }}
        >
          <defs>
            {/* Gradient fill for the passing area */}
            <linearGradient id="passingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
              <stop offset="50%" stopColor="#6366f1" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            {/* Glow filter for the main line */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.03)"
            vertical={false}
          />

          <XAxis
            dataKey="size"
            type="number"
            domain={["auto", "auto"]}
            reversed
            stroke="#334155"
            fontSize={9}
            fontWeight="bold"
            tickFormatter={(val) => val.toString()}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            label={{
              value: "حجم المنخل (ملم)",
              position: "insideBottom",
              offset: -10,
              fill: "#475569",
              fontSize: 9,
              fontWeight: "bold",
            }}
          />

          <YAxis
            domain={[0, 100]}
            stroke="#334155"
            fontSize={9}
            fontWeight="bold"
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            label={{
              value: "النسبة المئوية للمار ٪",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: "#475569",
              fontSize: 9,
              fontWeight: "bold",
            }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#0c1121",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: "12px",
              fontSize: "10px",
              textAlign: "right",
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              backdropFilter: "blur(20px)",
              padding: "10px 14px",
            }}
            itemStyle={{ fontWeight: "bold", color: "#e2e8f0" }}
            formatter={(value: any, name?: string) => [
              `${value}٪`,
              (name || "") === "passing"
                ? "المار الفعلي"
                : (name || "").startsWith("min")
                  ? "الحد الأدنى"
                  : "الحد الأقصى",
            ]}
            labelFormatter={(label) => `حجم المنخل: ${label} ملم`}
            labelStyle={{
              color: "#94a3b8",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
            cursor={{ stroke: "rgba(99,102,241,0.2)", strokeWidth: 1 }}
          />

          {/* Sample Data Area (Gradient Fill) */}
          <Area
            type="monotone"
            dataKey="passing"
            name="منحنى العينة"
            stroke="#0ea5e9"
            strokeWidth={3}
            fill="url(#passingGradient)"
            dot={{ r: 4, fill: "#0ea5e9", strokeWidth: 2, stroke: "#070a10" }}
            activeDot={{
              r: 6,
              fill: "#0ea5e9",
              stroke: "#070a10",
              strokeWidth: 2,
            }}
            connectNulls
            animationDuration={1500}
            filter="url(#glow)"
          />

          {/* Standards Lines */}
          {standards?.map((std, idx) => (
            <React.Fragment key={std.name}>
              <Area
                type="monotone"
                dataKey={`min${idx}`}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                fill="none"
                dot={false}
                connectNulls
                animationDuration={1800}
              />
              <Area
                type="monotone"
                dataKey={`max${idx}`}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                fill="none"
                dot={false}
                connectNulls
                animationDuration={1800}
              />
            </React.Fragment>
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
