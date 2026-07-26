"use client";

interface FinancialStats {
  mrr: number;
  trend: "UP" | "DOWN" | "FLAT";
  riskExposure: number;
  planDistribution: { plan: string; count: number; revenue: number }[];
}

export function FinancialSovereignty({ stats }: { stats: FinancialStats }) {
  return (
    <div className="bg-black border border-[#222] flex flex-col h-full font-mono select-none overflow-hidden">
      <div className="p-3 bg-[#0a0a0a] border-b border-[#222] flex justify-between items-center">
        <div className="flex flex-col">
          <h3 className="font-black text-sm font-bold uppercase tracking-[0.2em] text-[#555]">
            Capital_Sovereignty_Feed
          </h3>
          <div className="h-[1px] w-12 bg-cyan-900 mt-1" />
        </div>
        <span className="text-[9px] text-cyan-900 font-bold">
          STREAMING_REAL_TIME
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        {/* TOP: CORE METRICS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[8px] text-[#444] font-black uppercase tracking-widest block mb-1">
              AGGREGATED_MRR
            </span>
            <div className="text-2xl font-black text-white leading-none">
              ${(stats.mrr / 1000).toFixed(1)}K
            </div>
            <div
              className={`text-[8px] font-black mt-1 ${stats.trend === "UP" ? "text-cyan-500" : "text-red-500"}`}
            >
              {stats.trend === "UP" ? "↗" : "↘"} 12%_DELTA_CYCLE
            </div>
          </div>
          <div className="text-right">
            <span className="text-[8px] text-[#444] font-black uppercase tracking-widest block mb-1">
              RISK_EXPOSURE
            </span>
            <div className="text-2xl font-black text-red-600 leading-none">
              ${(stats.riskExposure / 1000).toFixed(1)}K
            </div>
            <div className="text-[8px] text-red-900 font-black mt-1 uppercase">
              Attention_Required
            </div>
          </div>
        </div>

        {/* MIDDLE: RISK BAR */}
        <div className="py-4 border-y border-[#111]">
          <span className="text-[8px] text-[#444] font-black uppercase tracking-widest block mb-1 underline underline-offset-4 decoration-[#111]">
            Exposure_Ratio
          </span>
          <div className="w-full bg-[#050505] border border-[#111] h-2">
            <div
              className="bg-red-900 h-full border-r border-red-500 transition-all duration-500"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              style={
                {
                  "--exposure-width": `${Math.min((stats.riskExposure / stats.mrr) * 100, 100)}%`,
                } as any
              }
            >
              <div className="h-full w-[var(--exposure-width)]" />
            </div>
          </div>
        </div>

        {/* BOTTOM: PLAN DISTRIBUTION */}
        <div className="space-y-3">
          <span className="text-[8px] text-[#444] font-black uppercase tracking-widest block mb-1">
            Revenue_By_Plan
          </span>
          {stats.planDistribution.map((pd) => (
            <div key={pd.plan} className="flex items-center gap-3">
              <span className="text-[9px] font-black text-[#444] w-20 truncate">
                {pd.plan}
              </span>
              <div className="flex-1 bg-[#050505] border border-[#111] h-1.5 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-cyan-900 transition-all duration-700"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  style={
                    {
                      "--plan-width": `${(pd.revenue / stats.mrr) * 100}%`,
                    } as any
                  }
                >
                  <div className="h-full w-[var(--plan-width)]" />
                </div>
              </div>
              <span className="text-[9px] font-black text-white w-10 text-right">
                ${(pd.revenue / 1000).toFixed(0)}K
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-2 bg-[#050505] border-t border-[#111] flex justify-between text-[7px] text-[#222] font-black uppercase">
        <span>CCY: USD</span>
        <span>AUTH: FED_TRANS_LOG</span>
      </div>
    </div>
  );
}
