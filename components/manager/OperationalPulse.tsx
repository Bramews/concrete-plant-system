"use client";

import { Icons } from "@/components/ui/Icons";
import {
  OperationalPulseStrict,
  ProductionStatus,
  MaterialsStatus,
  LabStatus,
} from "@/app/actions/manager";
import { motion } from "framer-motion";

interface OperationalPulseProps {
  initialData: OperationalPulseStrict;
}

export function OperationalPulse({ initialData }: OperationalPulseProps) {
  const getProductionConfig = (s: ProductionStatus) => {
    switch (s) {
      case "stable":
        return {
          color: "text-emerald-400",
          dot: "bg-emerald-400",
          glow: "shadow-[0_0_10px_rgba(52,211,153,0.6)]",
          bg: "bg-emerald-400/10 border-emerald-400/20",
          icon: Icons.Activity,
          labelAr: "الإنتاج مستقر",
          labelEn: "PRODUCTION",
          status: "STABLE",
        };
      case "warning":
        return {
          color: "text-amber-400",
          dot: "bg-amber-400",
          glow: "shadow-[0_0_10px_rgba(251,191,36,0.6)]",
          bg: "bg-amber-400/10 border-amber-400/20",
          icon: Icons.AlertTriangle,
          labelAr: "الإنتاج متذبذب",
          labelEn: "PRODUCTION",
          status: "WARNING",
        };
      case "stopped":
        return {
          color: "text-rose-400",
          dot: "bg-rose-400",
          glow: "shadow-[0_0_10px_rgba(251,113,133,0.6)]",
          bg: "bg-rose-400/10 border-rose-400/20",
          icon: Icons.XCircle,
          labelAr: "الإنتاج متوقف",
          labelEn: "PRODUCTION",
          status: "STOPPED",
        };
    }
  };

  const getMaterialsConfig = (s: MaterialsStatus) => {
    switch (s) {
      case "ok":
        return {
          color: "text-cyan-400",
          dot: "bg-cyan-400",
          glow: "shadow-[0_0_10px_rgba(34,211,238,0.6)]",
          bg: "bg-cyan-400/10 border-cyan-400/20",
          icon: Icons.Box,
          labelAr: "المواد كافية",
          labelEn: "MATERIALS",
          status: "OK",
        };
      case "low":
        return {
          color: "text-amber-400",
          dot: "bg-amber-400",
          glow: "shadow-[0_0_10px_rgba(251,191,36,0.6)]",
          bg: "bg-amber-400/10 border-amber-400/20",
          icon: Icons.AlertOctagon,
          labelAr: "المواد منخفضة",
          labelEn: "MATERIALS",
          status: "LOW",
        };
      case "critical":
        return {
          color: "text-rose-400",
          dot: "bg-rose-400",
          glow: "shadow-[0_0_10px_rgba(251,113,133,0.6)]",
          bg: "bg-rose-400/10 border-rose-400/20",
          icon: Icons.AlertTriangle,
          labelAr: "مواد حرجة!",
          labelEn: "MATERIALS",
          status: "CRITICAL",
        };
    }
  };

  const getLabConfig = (s: LabStatus) => {
    switch (s) {
      case "clear":
        return {
          color: "text-violet-400",
          dot: "bg-violet-400",
          glow: "shadow-[0_0_10px_rgba(167,139,250,0.6)]",
          bg: "bg-violet-400/10 border-violet-400/20",
          icon: Icons.CheckCircle,
          labelAr: "المختبر سليم",
          labelEn: "LAB",
          status: "CLEAR",
        };
      case "rejection_pending":
        return {
          color: "text-rose-400",
          dot: "bg-rose-400",
          glow: "shadow-[0_0_10px_rgba(251,113,133,0.6)]",
          bg: "bg-rose-400/10 border-rose-400/20",
          icon: Icons.FileText,
          labelAr: "تنبيه رفض",
          labelEn: "LAB",
          status: "ALERT",
        };
    }
  };

  const configs = [
    getProductionConfig(initialData.production),
    getMaterialsConfig(initialData.materials),
    getLabConfig(initialData.lab),
  ];

  return (
    <div className="w-full bg-[#06080f] border-b border-white/[0.04] flex items-center justify-between px-6 py-3 z-50 backdrop-blur-xl">
      {/* Status Pills */}
      <div className="flex items-center gap-3">
        {configs.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className={`flex items-center gap-2.5 border rounded-full px-4 py-2 ${item.bg} transition-all`}
          >
            {/* Dot */}
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.dot} opacity-60`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${item.dot} ${item.glow}`}
              />
            </span>
            <div className="flex flex-col leading-none">
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${item.color} opacity-60`}
              >
                {item.labelEn}
              </span>
              <span className={`text-[11px] font-black ${item.color}`}>
                {item.labelAr}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Feed Badge */}
      <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-full px-4 py-2">
        <Icons.Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
        <span className="text-sm font-bold font-black text-blue-400/80 uppercase tracking-widest">
          Live Feed
        </span>
      </div>
    </div>
  );
}
