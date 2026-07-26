"use client";

import React, { useState, useEffect } from "react";
import { BidiText } from "@/components/ui/BidiText";

interface SensorData {
  silo1: number; // Cement Silo 1 (tons)
  silo2: number; // Cement Silo 2 (tons)
  waterTank: number; // Water Level (%)
  mixerTemp: number; // Mixer Temp (°C)
  airPressure: number; // Air Pressure (bar)
  beltSpeed: number; // Belt Speed (m/s)
}

export default function PlantMap() {
  const [sensors, setSensors] = useState<SensorData>({
    silo1: 65.4,
    silo2: 42.1,
    waterTank: 85.0,
    mixerTemp: 28.4,
    airPressure: 6.8,
    beltSpeed: 0.0,
  });

  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [isProducing, setIsProducing] = useState(false);

  // Simulate real-time sensor updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) => {
        // If producing, fluctuate mixer temp and belt speed, decrease silo levels
        const producing = Math.random() > 0.3;
        setIsProducing(producing);
        return {
          silo1: Math.max(
            10,
            +(prev.silo1 + (producing ? -0.05 : 0.01) * Math.random()).toFixed(
              2,
            ),
          ),
          silo2: Math.max(
            5,
            +(prev.silo2 + (producing ? -0.03 : 0.02) * Math.random()).toFixed(
              2,
            ),
          ),
          waterTank: Math.max(
            20,
            Math.min(
              100,
              +(
                prev.waterTank +
                (producing ? -0.1 : 0.2) * Math.random()
              ).toFixed(1),
            ),
          ),
          mixerTemp: +(
            25 +
            (producing ? 8 : 2) * Math.random() +
            Math.sin(Date.now() / 5000) * 1.5
          ).toFixed(1),
          airPressure: +(6.5 + Math.sin(Date.now() / 10000) * 0.4).toFixed(2),
          beltSpeed: producing ? +(1.8 + Math.random() * 0.4).toFixed(2) : 0.0,
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const nodes = [
    {
      id: "silo1",
      label: "صومعة الإسمنت 1",
      value: `${sensors.silo1} طن`,
      x: 80,
      y: 110,
      color: "text-amber-400",
    },
    {
      id: "silo2",
      label: "صومعة الإسمنت 2",
      value: `${sensors.silo2} طن`,
      x: 200,
      y: 110,
      color: "text-amber-400",
    },
    {
      id: "water",
      label: "خزان المياه الرئيسي",
      value: `${sensors.waterTank} %`,
      x: 340,
      y: 120,
      color: "text-blue-400",
    },
    {
      id: "mixer",
      label: "الخلاط المركزي",
      value: `${sensors.mixerTemp} °م`,
      x: 480,
      y: 220,
      color: "text-red-400",
    },
    {
      id: "compressor",
      label: "مضخة الهواء",
      value: `${sensors.airPressure} بار`,
      x: 620,
      y: 140,
      color: "text-emerald-400",
    },
    {
      id: "belt",
      label: "سير ناقل الركام",
      value: `${sensors.beltSpeed} م/ث`,
      x: 300,
      y: 250,
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="bg-slate-900/60 border border-white/10 p-5 rounded-3xl relative overflow-hidden flex flex-col h-full min-h-[480px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            المخطط التفاعلي للمحطة
          </h3>
          <p className="text-slate-400 text-xs font-medium mt-0.5">
            تتبع حالة الحساسات وتدفق المواد بشكل حي
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${isProducing ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`}
          ></span>
          <span className="text-xs font-bold text-slate-300">
            {isProducing ? "خط الإنتاج نشط" : "قيد الانتظار"}
          </span>
        </div>
      </div>

      <div className="flex-1 bg-slate-950/80 border border-white/5 rounded-2xl relative p-4 flex items-center justify-center min-h-[300px]">
        {/* Render Interactive SVG Blueprint */}
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full max-h-[360px] select-none text-slate-300"
        >
          <defs>
            <linearGradient id="siloGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="activeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Connection Lines (Flows) */}
          <path
            d="M 80 180 L 80 230 L 440 230"
            fill="none"
            stroke={isProducing ? "#f59e0b" : "#334155"}
            strokeWidth="3"
            strokeDasharray={isProducing ? "8 4" : "none"}
            className={isProducing ? "animate-[dash_10s_linear_infinite]" : ""}
          />
          <path
            d="M 200 180 L 200 230 L 440 230"
            fill="none"
            stroke={isProducing ? "#f59e0b" : "#334155"}
            strokeWidth="3"
            strokeDasharray={isProducing ? "8 4" : "none"}
            className={isProducing ? "animate-[dash_10s_linear_infinite]" : ""}
          />
          <path
            d="M 340 180 L 340 215 L 440 215"
            fill="none"
            stroke={isProducing ? "#38bdf8" : "#334155"}
            strokeWidth="3"
            strokeDasharray={isProducing ? "6 3" : "none"}
            className={isProducing ? "animate-[dash_8s_linear_infinite]" : ""}
          />
          <path
            d="M 200 300 L 440 235"
            fill="none"
            stroke={isProducing ? "#22d3ee" : "#334155"}
            strokeWidth="6"
            strokeDasharray={isProducing ? "12 6" : "none"}
            className={isProducing ? "animate-[dash_5s_linear_infinite]" : ""}
          />

          {/* Silo 1 */}
          <g className="cursor-pointer" onClick={() => setActiveNode("silo1")}>
            <rect
              x="50"
              y="50"
              width="60"
              height="130"
              rx="6"
              fill="url(#siloGrad)"
              stroke="#475569"
              strokeWidth="2"
            />
            <polygon
              points="50,180 80,210 110,180"
              fill="#334155"
              stroke="#475569"
              strokeWidth="2"
            />
            <text
              x="80"
              y="35"
              textAnchor="middle"
              fill="#94a3b8"
              className="text-sm font-bold"
            >
              صومعة 1
            </text>
            {/* Cement Level indicator inside Silo 1 */}
            <rect
              x="55"
              y={180 - (sensors.silo1 / 100) * 110}
              width="50"
              height={(sensors.silo1 / 100) * 110}
              fill="#d97706"
              opacity="0.3"
              rx="2"
            />
          </g>

          {/* Silo 2 */}
          <g className="cursor-pointer" onClick={() => setActiveNode("silo2")}>
            <rect
              x="170"
              y="50"
              width="60"
              height="130"
              rx="6"
              fill="url(#siloGrad)"
              stroke="#475569"
              strokeWidth="2"
            />
            <polygon
              points="170,180 200,210 230,180"
              fill="#334155"
              stroke="#475569"
              strokeWidth="2"
            />
            <text
              x="200"
              y="35"
              textAnchor="middle"
              fill="#94a3b8"
              className="text-sm font-bold"
            >
              صومعة 2
            </text>
            {/* Level indicator inside Silo 2 */}
            <rect
              x="175"
              y={180 - (sensors.silo2 / 100) * 110}
              width="50"
              height={(sensors.silo2 / 100) * 110}
              fill="#d97706"
              opacity="0.3"
              rx="2"
            />
          </g>

          {/* Water Tank */}
          <g className="cursor-pointer" onClick={() => setActiveNode("water")}>
            <rect
              x="300"
              y="60"
              width="80"
              height="120"
              rx="10"
              fill="url(#siloGrad)"
              stroke="#475569"
              strokeWidth="2"
            />
            <rect
              x="305"
              y={180 - (sensors.waterTank / 100) * 110}
              width="70"
              height={(sensors.waterTank / 100) * 110}
              fill="url(#waterGrad)"
              opacity="0.4"
              rx="5"
            />
            <text
              x="340"
              y="45"
              textAnchor="middle"
              fill="#94a3b8"
              className="text-sm font-bold"
            >
              خزان المياه
            </text>
          </g>

          {/* Aggregate Belt */}
          <g className="cursor-pointer" onClick={() => setActiveNode("belt")}>
            <line
              x1="150"
              y1="310"
              x2="430"
              y2="245"
              stroke="#1e293b"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <line
              x1="150"
              y1="310"
              x2="430"
              y2="245"
              stroke="#475569"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle
              cx="150"
              cy="310"
              r="8"
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="2"
            />
            <circle
              cx="430"
              cy="245"
              r="8"
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="2"
            />
            <text
              x="280"
              y="330"
              textAnchor="middle"
              fill="#94a3b8"
              className="text-sm font-bold"
            >
              سير ناقل الركام
            </text>
          </g>

          {/* Central Mixer */}
          <g className="cursor-pointer" onClick={() => setActiveNode("mixer")}>
            <rect
              x="440"
              y="180"
              width="100"
              height="80"
              rx="8"
              fill="url(#siloGrad)"
              stroke={isProducing ? "#f43f5e" : "#475569"}
              strokeWidth="2"
            />
            <circle
              cx="490"
              cy="220"
              r="22"
              fill="#0f172a"
              stroke={isProducing ? "#f43f5e" : "#475569"}
              strokeWidth="3"
              className={
                isProducing
                  ? "animate-[spin_4s_linear_infinite] origin-[490px_220px]"
                  : ""
              }
            />
            <path
              d="M 475 220 L 505 220 M 490 205 L 490 235"
              stroke={isProducing ? "#f43f5e" : "#475569"}
              strokeWidth="2"
            />
            <text
              x="490"
              y="165"
              textAnchor="middle"
              fill="#94a3b8"
              className="text-sm font-bold"
            >
              الخلاط المركزي
            </text>
          </g>

          {/* Air Compressor */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveNode("compressor")}
          >
            <circle
              cx="650"
              cy="120"
              r="30"
              fill="url(#siloGrad)"
              stroke="#475569"
              strokeWidth="2"
            />
            <path
              d="M 635 120 A 15 15 0 0 1 665 120"
              fill="none"
              stroke="#64748b"
              strokeWidth="3"
            />
            <rect
              x="625"
              y="150"
              width="50"
              height="15"
              fill="#334155"
              rx="3"
            />
            <text
              x="650"
              y="80"
              textAnchor="middle"
              fill="#94a3b8"
              className="text-sm font-bold"
            >
              المكبس الهوائي
            </text>
          </g>

          {/* Truck Discharge Area */}
          <path
            d="M 490 260 L 490 320"
            fill="none"
            stroke="#475569"
            strokeWidth="4"
          />
          <path
            d="M 470 320 L 510 320 L 510 370 L 470 370 Z"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="2"
          />
          <circle cx="480" cy="370" r="6" fill="#475569" />
          <circle cx="500" cy="370" r="6" fill="#475569" />
          <text
            x="490"
            y="390"
            textAnchor="middle"
            fill="#94a3b8"
            className="text-sm font-bold"
          >
            شحن الخلاطات
          </text>

          {/* Glowing Status Dots */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="6"
                className="fill-cyan-500 animate-ping opacity-75"
              />
              <circle cx={node.x} cy={node.y} r="4" className="fill-cyan-400" />
            </g>
          ))}
        </svg>

        {/* Selected Sensor Node Details Modal overlay */}
        {activeNode && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col justify-center items-center p-6 animate-in fade-in zoom-in-95 duration-200">
            {(() => {
              const node = nodes.find((n) => n.id === activeNode);
              if (!node) return null;
              return (
                <div className="text-center max-w-sm">
                  <span
                    className={`inline-block px-3 py-1 bg-cyan-950 text-cyan-400 text-sm font-bold rounded-full mb-3 border border-cyan-900`}
                  >
                    حساس نشط
                  </span>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {node.label}
                  </h4>
                  <div className="my-4">
                    <span className="text-3xl font-black text-white block">
                      <BidiText>{node.value}</BidiText>
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm font-medium mb-6">
                    تعمل وحدة التحكم المنطقية على قراءة هذه القيمة كل 3 ثوانٍ
                    وهي مطابقة لبيانات المعايرة القياسية للمصنع.
                  </p>
                  <button
                    onClick={() => setActiveNode(null)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
                  >
                    عودة للمخطط
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Legend / Quick status */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
        {nodes.map((node) => (
          <div
            key={node.id}
            onClick={() => setActiveNode(node.id)}
            className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 hover:border-cyan-500/30 transition-all"
          >
            <span className="text-slate-400 text-sm font-medium">
              {node.label}
            </span>
            <span className={`text-sm font-bold ${node.color}`}>
              <BidiText>{node.value}</BidiText>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
