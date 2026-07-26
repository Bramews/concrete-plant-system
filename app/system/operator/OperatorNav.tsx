"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/Icons";

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
    <nav className="flex items-center gap-2 overflow-x-auto pb-2" dir="rtl">
      {tabs.map((tab) => {
        const Icon = ICON_MAP[tab.iconName] || Icons.Activity;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 group min-w-fit ${
              isActive
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5"
                : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon
              className={`w-4 h-4 transition-colors ${
                isActive
                  ? "text-emerald-400"
                  : "text-slate-500 group-hover:text-emerald-400"
              }`}
            />
            <span className="text-sm font-bold">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
