"use client";

import { Icons } from "@/components/ui/Icons";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Batch {
  id: number;
  quantity: number;
  createdAt: Date;
  order?: {
    customer?: { name: string };
    project?: { name: string };
    mixDesign?: { code: string };
  };
}

interface ProductionFeedProps {
  batches: Batch[];
}

export function ProductionFeed({ batches }: ProductionFeedProps) {
  const totalVolume = batches.reduce((acc, b) => acc + b.quantity, 0);

  return (
    <div
      className="w-[380px] bg-[#0b0f17] border-l border-white/5 flex flex-col overflow-hidden shadow-2xl z-20"
      dir="rtl"
    >
      {/* Shift Overview Header */}
      <div className="p-8 border-b border-white/5 bg-slate-900/40">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Icons.Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-none tracking-tight">
              نبض الإنتاج
            </h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 western-nums">
              السجل الحي للإنتاج
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] text-center relative overflow-hidden group">
            <div className="absolute -left-4 -top-4 w-16 h-16 bg-indigo-500/20 blur-2xl rounded-full" />
            <p className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">
              إجمالي إنتاج المناوبة
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-black text-white western-nums tracking-tighter">
                {totalVolume.toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-400 font-bold uppercase">
                م³
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: totalVolume > 0 ? "100%" : "0%" }}
                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-24">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1 border-r-2 border-indigo-500 mb-6">
          آخر العمليات المنفذة (سجل حي)
        </h3>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {batches.map((batch, i) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.1 }}
                className="p-5 bg-white/5 border border-white/5 rounded-[2rem] space-y-3 hover:bg-white/[0.08] transition-all group relative overflow-hidden"
              >
                {/* Time & Volume Bubble */}
                <div className="flex items-center justify-between">
                  <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black western-nums text-slate-500 group-hover:text-white transition-colors">
                    {format(new Date(batch.createdAt), "HH:mm:ss")}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white western-nums tracking-tighter">
                      {batch.quantity}
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">
                      م³
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-1">
                  <h4 className="text-[11px] font-black text-indigo-400 group-hover:text-indigo-300 transition-colors uppercase truncate">
                    {batch.order?.project?.name || "مشروع عام"}
                  </h4>
                  <div className="flex items-center gap-2 opacity-50">
                    <Icons.User className="w-3 h-3 text-slate-500" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                      {batch.order?.customer?.name}
                    </p>
                  </div>
                </div>

                {/* Mix Tag */}
                <div className="pt-2 flex justify-end">
                  <span className="text-[8px] font-black px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 western-nums shadow-lg shadow-indigo-500/5 transition-transform group-hover:scale-105">
                    {batch.order?.mixDesign?.code}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {batches.length === 0 && (
            <div className="text-center py-20 opacity-20">
              <Icons.Inbox className="w-12 h-12 mx-auto mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">
                لا توجد عمليات إنتاج مسجلة حالياً
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
