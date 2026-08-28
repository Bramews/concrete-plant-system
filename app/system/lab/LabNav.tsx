"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/ui/Icons";
import { DictionaryType } from "@/lib/dictionary";

interface LabNavProps {
  dict: DictionaryType["lab"]["tabs"];
}

export function LabNav({ dict }: LabNavProps) {
  const pathname = usePathname();

  const TABS = [
    { name: dict.mix_designs, href: "/system/lab/mix-designs", icon: "Beaker" },
    {
      name: dict.cube_results,
      href: "/system/lab/cube-results",
      icon: "Activity",
    },
    { name: dict.standards, href: "/system/lab/standards", icon: "Scale" },
    {
      name: dict.sieve_analysis,
      href: "/system/lab/sieve-analysis",
      icon: "Filter",
    },
    { name: dict.archive, href: "/system/lab/archive", icon: "Archive" },
  ];

  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-2">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const Icon = Icons[tab.icon as keyof typeof Icons];
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 whitespace-nowrap min-w-fit font-bold text-sm",
              isActive
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-sm"
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 transition-colors",
                isActive ? "text-indigo-400" : "text-slate-500",
              )}
            />
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
