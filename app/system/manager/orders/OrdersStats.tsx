"use client";

import { Icons } from "@/components/ui/Icons";

interface OrderStatsProps {
  stats: {
    total: number;
    pending: number;
    today: number;
  };
  dict: any;
}

export default function OrderStats({ stats, dict }: OrderStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Orders */}
      <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium mb-1">
            {dict?.total || "Total Orders"}
          </p>
          <h3 className="text-2xl font-black text-white">{stats.total}</h3>
        </div>
        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
          <Icons.FileText className="w-5 h-5" />
        </div>
      </div>

      {/* Pending Approval */}
      <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium mb-1">
            {dict?.pending || "Pending Approval"}
          </p>
          <h3 className="text-2xl font-black text-amber-400">
            {stats.pending}
          </h3>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
          <Icons.Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Today's Orders */}
      <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium mb-1">
            {dict?.today || "New Today"}
          </p>
          <h3 className="text-2xl font-black text-emerald-400">
            {stats.today}
          </h3>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
          <Icons.Calendar className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
