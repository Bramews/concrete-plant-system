"use client";

export enum GlobalSystemMode {
  NORMAL = "NORMAL",
  WARNING = "WARNING",
  RISK = "RISK",
  INVESTIGATION = "INVESTIGATION",
}

interface StateLayerProps {
  mode: GlobalSystemMode;
  confidence: number;
  lastDecision?: string;
}

export function StateLayer({
  mode,
  confidence,
  lastDecision,
}: StateLayerProps) {
  const modeColors: Record<GlobalSystemMode, string> = {
    [GlobalSystemMode.NORMAL]: "text-emerald-500",
    [GlobalSystemMode.WARNING]: "text-amber-500",
    [GlobalSystemMode.RISK]: "text-red-500 animate-pulse",
    [GlobalSystemMode.INVESTIGATION]: "text-cyan-400",
  };

  const modeText: Record<GlobalSystemMode, string> = {
    [GlobalSystemMode.NORMAL]: "SYSTEM NOMINAL",
    [GlobalSystemMode.WARNING]: "SYSTEM ALERT",
    [GlobalSystemMode.RISK]: "SYSTEM CRITICAL RISK",
    [GlobalSystemMode.INVESTIGATION]: "UNDER INVESTIGATION",
  };

  return (
    <div className="bg-black border-b border-[#333] p-2 flex flex-col font-mono">
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-12">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#444] font-black uppercase tracking-widest">
              System Status
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`font-black text-xl tracking-tighter ${modeColors[mode]}`}
              >
                {modeText[mode]}
              </span>
              <span className="text-sm font-bold text-[#666] font-bold">
                [{confidence}% AWARENESS]
              </span>
            </div>
          </div>

          <div className="flex flex-col border-l border-[#222] pl-6">
            <span className="text-sm font-bold text-[#444] font-black uppercase tracking-widest">
              Tactical Audit
            </span>
            <div className="text-[11px] text-[#888] font-bold">
              ID: {lastDecision || "IDLE_STATE"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <span className="text-sm font-bold text-[#444] font-black uppercase tracking-widest block">
              Authority
            </span>
            <span className="text-cyan-500 font-black text-sm tracking-widest">
              SOV.OWNER_V1.0
            </span>
          </div>
          <div className="w-8 h-8 border border-[#333] flex items-center justify-center font-black text-sm font-bold text-[#444]">
            [S]
          </div>
        </div>
      </div>
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#222] to-transparent mt-2" />
    </div>
  );
}
