"use client";
// ⚠️ ملف غير مستخدم حالياً — تم استبداله بـ OperatorSidebar + OperatorHeader

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { FullscreenToggle, LiveClock } from "@/components/operator/OperatorControls";

const ICON_MAP = {
  Activity: Icons.Activity,
  Factory: Icons.Factory,
  Ticket: Icons.Ticket,
  Box: Icons.Box,
  Settings: Icons.Settings,
};

export interface Tab {
  href: string;
  label: string;
  iconName: keyof typeof ICON_MAP;
}

export function OperatorNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 border border-white/10 p-3 rounded-2xl shadow-xl backdrop-blur-xl" dir="rtl">
      <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = ICON_MAP[tab.iconName] || Icons.Activity;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2.5 group whitespace-nowrap text-xs font-bold ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10"
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? "text-cyan-400"
                    : "text-slate-500 group-hover:text-cyan-400"
                }`}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
        <LiveClock />
        <FullscreenToggle />
      </div>
    </div>
  );
}
