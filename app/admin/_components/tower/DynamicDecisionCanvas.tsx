"use client";

import React from "react";
import { Icons } from "@/components/ui/Icons";
import { Button } from "@/components/ui/button";

interface Action {
  id: string;
  label: string;
  onExecute: () => void;
  type?: "critical" | "standard";
}

interface Item {
  id: string;
  title: string;
  description: string;
  severity: "stable" | "attention" | "risk";
  action?: Action;
}

interface DynamicDecisionCanvasProps {
  item: Item;
}

export function DynamicDecisionCanvas({ item }: DynamicDecisionCanvasProps) {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center p-8 md:p-20 ml-16 md:ml-20 lg:ml-24">
      <div className="max-w-2xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        {/* Visual Focus */}
        <div className="relative flex justify-center py-10">
          {item.severity === "stable" && (
            <div className="h-40 w-40 rounded-full border border-white/5 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full border border-emerald-500/20 animate-ping absolute" />
              <Icons.ShieldCheck className="w-12 h-12 text-emerald-500/40" />
            </div>
          )}
          {item.severity === "attention" && (
            <div className="h-40 w-40 rounded-full border border-white/5 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full border border-amber-500/20 animate-pulse absolute" />
              <Icons.AlertTriangle className="w-12 h-12 text-amber-500" />
            </div>
          )}
          {item.severity === "risk" && (
            <div className="h-48 w-48 rounded-full border-2 border-red-500/30 flex items-center justify-center shadow-[0_0_100px_rgba(239,68,68,0.1)]">
              <div className="h-32 w-32 rounded-full border-t-2 border-red-500 animate-[spin_3s_linear_infinite] absolute" />
              <Icons.ShieldAlert className="w-16 h-16 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-center space-y-6">
          <h1
            className={`text-3xl md:text-5xl font-black tracking-tighter uppercase ${
              item.severity === "risk" ? "text-red-500" : "text-white"
            }`}
          >
            {item.title}
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl mx-auto">
            {item.description}
          </p>
        </div>

        {/* Action Button */}
        {item.action && (
          <div className="flex justify-center pt-8">
            <button
              onClick={item.action.onExecute}
              className={`
                 relative px-12 py-5 rounded-none font-black uppercase tracking-[0.3em] transition-all duration-300
                 ${
                   item.action.type === "critical"
                     ? "bg-red-500 text-black hover:bg-white hover:text-black shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
                     : "border border-white/20 text-white hover:bg-white hover:text-black"
                 }
               `}
            >
              {item.action.label}
            </button>
          </div>
        )}

        {item.severity === "stable" && (
          <div className="text-center pt-12">
            <span className="text-sm font-bold font-black text-white/20 uppercase tracking-[0.5em]">
              All protocols active and verified
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
