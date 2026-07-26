"use client";

import { useState } from "react";

import { SuspensionLevel } from "@/lib/types";

interface MatrixItem {
  id: number;
  name: string;
  domain: string;
  suspensionLevel: SuspensionLevel;
  healthScore: number;
  impactPreview: number;
}

interface GovernanceMatrixProps {
  initialCompanies: MatrixItem[];
}

export function GovernanceMatrix({ initialCompanies }: GovernanceMatrixProps) {
  const [companies] = useState(initialCompanies);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const getLevelStyle = (lvl: SuspensionLevel) => {
    switch (lvl) {
      case "NONE":
        return "border-emerald-900/50 text-emerald-500 bg-emerald-500/5";
      case "FULL_SUSPENSION":
        return "border-red-900 text-red-600 bg-red-950/20 animate-pulse";
      default:
        return "border-amber-900/50 text-amber-500 bg-amber-500/5";
    }
  };

  return (
    <div className="bg-black border border-[#222] h-full flex flex-col font-mono select-none overflow-hidden relative">
      <div className="p-3 bg-[#0a0a0a] border-b border-[#222] flex justify-between items-center">
        <div className="flex flex-col">
          <h3 className="font-black text-sm font-bold uppercase tracking-[0.2em] text-[#555]">
            Tenant_Governance_Surface
          </h3>
          <div className="h-[1px] w-12 bg-cyan-900 mt-1" />
        </div>
        <div className="flex gap-4">
          <span className="text-[9px] text-[#333] font-black">
            SCAN_LEVEL: NOMINAL
          </span>
          <span className="text-[9px] text-[#444] font-black">
            ENTITIES: {companies.length}
          </span>
        </div>
      </div>

      <div className="flex-1 p-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 overflow-y-auto content-start scrollbar-hide">
        {companies.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`border p-3 flex flex-col justify-between h-28 transition-all cursor-pointer group ${
              selectedId === c.id
                ? "bg-[#0c0c0c] border-cyan-500 shadow-[0_0_15px_rgba(0,243,255,0.05)]"
                : "bg-black border-[#111] hover:border-[#333]"
            }`}
          >
            <div className="relative">
              <div className="text-[7px] text-[#333] font-black uppercase tracking-widest truncate">
                {c.domain}
              </div>
              <div
                className={`font-black text-sm font-bold leading-tight mt-1 truncate transition-colors ${selectedId === c.id ? "text-white" : "text-[#666] group-hover:text-[#888]"}`}
              >
                {c.name}
              </div>
              <div className="h-[1px] w-4 bg-[#222] mt-2" />
            </div>

            <div className="mt-4 flex flex-col gap-1">
              <div
                className={`text-[7px] font-black px-1 py-0.5 border w-fit ${getLevelStyle(c.suspensionLevel)}`}
              >
                {c.suspensionLevel}
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="flex gap-0.5 h-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-full ${i <= c.healthScore / 20 ? "bg-cyan-500" : "bg-[#111]"}`}
                    />
                  ))}
                </div>
                <span
                  className={`text-[9px] font-black ${c.healthScore > 90 ? "text-cyan-900" : "text-[#333]"}`}
                >
                  {c.healthScore}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SHARP TACTICAL MODAL */}
      {selectedId && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in zoom-in-95">
          <div className="w-full max-w-lg bg-black border border-[#333] p-0 flex flex-col shadow-[0_40px_100px_rgba(0,0,0,1)]">
            <div className="p-4 bg-[#0a0a0a] border-b border-[#222] flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#444] font-black uppercase tracking-widest">
                  Signal_Target
                </span>
                <div className="text-sm font-black text-white uppercase">
                  {companies.find((c) => c.id === selectedId)?.name}
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-[#444] hover:text-white font-black text-sm font-bold"
              >
                [X]
              </button>
            </div>

            <div className="p-6 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[#444] font-black uppercase tracking-widest mb-1">
                      State_ID
                    </span>
                    <div className="text-sm font-bold text-[#888] font-bold border-l-2 border-[#222] pl-3">
                      {
                        companies.find((c) => c.id === selectedId)
                          ?.suspensionLevel
                      }
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-amber-600 font-black uppercase tracking-widest mb-1">
                      Impact_Forecast
                    </span>
                    <div className="text-sm font-bold text-white font-bold border-l-2 border-amber-900/50 pl-3">
                      {
                        companies.find((c) => c.id === selectedId)
                          ?.impactPreview
                      }{" "}
                      ACTIVE_USERS
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <span className="text-[9px] text-cyan-500 font-black uppercase tracking-widest">
                    Authority_Shift
                  </span>
                  <div className="flex flex-col border border-[#1a1a1a] bg-[#050505] p-2">
                    {[
                      "NONE",
                      "READ_ONLY",
                      "FREEZE_ORDERS",
                      "FREEZE_FINANCIALS",
                      "FULL_SUSPENSION",
                    ].map((lvl) => (
                      <button
                        key={lvl}
                        className={`text-left text-[9px] font-black p-1 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors uppercase ${
                          companies.find((c) => c.id === selectedId)
                            ?.suspensionLevel === lvl
                            ? "text-cyan-500 font-black"
                            : "text-[#444]"
                        }`}
                      >
                        {lvl ===
                        companies.find((c) => c.id === selectedId)
                          ?.suspensionLevel
                          ? `> ${lvl}`
                          : `  ${lvl}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] text-[#444] font-black uppercase tracking-widest mb-2">
                  Shift_Justification_Buffer [MANDATORY]
                </span>
                <textarea
                  className="w-full bg-[#050505] border border-[#222] p-3 text-[11px] text-[#888] outline-none focus:border-cyan-900 h-20 resize-none font-bold"
                  placeholder="ENTER_SHIFT_REASON..."
                />
              </div>

              <button className="w-full bg-cyan-600 border border-cyan-500 text-black text-sm font-bold font-black py-4 hover:bg-cyan-500 transition-all uppercase tracking-[0.3em] active:scale-[0.98]">
                Execute_Authority_Commit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
