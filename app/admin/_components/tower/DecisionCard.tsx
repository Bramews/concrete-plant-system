"use client";

import { Icons } from "@/components/ui/Icons";
import { type ReactNode } from "react";

interface DecisionCardProps {
  title: string;
  reason: string;
  icon: keyof typeof Icons;
  iconColor?: string;
  actionLabel: string;
  onAction: () => void;
  children?: ReactNode;
  dict: any;
}

export function DecisionCard({
  title,
  reason,
  icon,
  iconColor = "text-primary",
  actionLabel,
  onAction,
  children,
  dict,
}: DecisionCardProps) {
  const Icon = Icons[icon];
  const t = dict?.admin?.tower ?? dict?.tower ?? {};

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col group hover:border-white/10 transition-all">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-full border border-white/5">
            {t.command_required}
          </span>
        </div>

        <h3 className="text-sm font-bold font-black text-white uppercase tracking-wider mb-2">
          {title}
        </h3>
        <p className="text-sm font-bold text-slate-500 font-bold leading-relaxed mb-4">
          {reason}
        </p>

        {children && <div className="mb-4">{children}</div>}
      </div>

      <div className="px-5 py-3 bg-white/5 border-t border-white/5">
        <button
          onClick={onAction}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold font-black uppercase tracking-widest transition-all active:scale-95"
        >
          {actionLabel}
          <Icons.ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
