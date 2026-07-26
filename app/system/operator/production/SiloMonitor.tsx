"use client";

import { motion } from "framer-motion";
import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

interface Material {
  id: number;
  name: string;
  stock: number;
  unit: string;
}

interface SiloMonitorProps {
  materials: Material[];
}

export function SiloMonitor({ materials }: SiloMonitorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 p-8 bg-slate-900/40 border border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full" />
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full" />

      {materials.map((m) => (
        <SiloItem key={m.id} material={m} />
      ))}

      {materials.length === 0 && (
        <div className="col-span-full py-12 text-center opacity-30 italic text-sm">
          بانتظار مزامنة بيانات الموازين...
        </div>
      )}
    </div>
  );
}

function SiloItem({ material }: { material: Material }) {
  const maxStock = 50000; // Standard silo capacity
  const percentage = Math.min((material.stock / maxStock) * 100, 100);

  const isLow = percentage < 20;
  const isCritical = percentage < 10;

  const barColor = isCritical
    ? "bg-rose-500"
    : isLow
      ? "bg-amber-500"
      : "bg-indigo-500";
  const shadowColor = isCritical
    ? "shadow-rose-500/40"
    : isLow
      ? "shadow-amber-500/40"
      : "shadow-indigo-500/40";

  return (
    <div className="flex flex-col items-center gap-4 group">
      <div className="relative w-20 h-48 bg-slate-950 border border-white/10 rounded-t-[2.5rem] rounded-b-xl overflow-hidden shadow-inner group-hover:border-white/20 transition-all">
        {/* Liquid Grid Effect */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "10px 10px",
          }}
        />

        {/* Filling Level */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={cn(
            "absolute bottom-0 w-full transition-colors duration-1000",
            barColor,
            shadowColor,
            "shadow-[0_-5px_15px]",
          )}
        >
          {/* Wave Effect top */}
          <div className="absolute -top-1 left-0 w-full h-2 bg-white/20 blur-[1px]" />
        </motion.div>

        {/* Scale Markers */}
        <div className="absolute inset-0 flex flex-col justify-between py-6 px-1.5 pointer-events-none">
          {[80, 60, 40, 20].map((v) => (
            <div
              key={v}
              className="w-full flex items-center justify-between opacity-20"
            >
              <div className="w-2 h-[1px] bg-white" />
              <span className="text-[6px] font-black western-nums text-white">
                {v}%
              </span>
              <div className="w-2 h-[1px] bg-white" />
            </div>
          ))}
        </div>
      </div>

      <div className="text-center space-y-1">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">
          {material.name}
        </h4>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-lg font-black text-white western-nums">
            {Math.round(material.stock).toLocaleString("en-US")}
          </span>
          <span className="text-[8px] font-bold text-slate-500 uppercase">
            {material.unit}
          </span>
        </div>
        {isLow && (
          <div
            className={cn(
              "text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full inline-block mt-1",
              isCritical
                ? "bg-rose-500/10 text-rose-500"
                : "bg-amber-500/10 text-amber-500",
            )}
          >
            {isCritical ? "مستوى حرج" : "مخزون منخفض"}
          </div>
        )}
      </div>
    </div>
  );
}
