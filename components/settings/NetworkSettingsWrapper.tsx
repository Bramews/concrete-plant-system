"use client";

import { Icons } from "@/components/ui/Icons";
import Link from "next/link";

interface NetworkSettingsWrapperProps {
  lang: "ar" | "en";
}

export function NetworkSettingsWrapper({ lang }: NetworkSettingsWrapperProps) {
  const t = {
    title:
      lang === "ar"
        ? "منظومة الشبكة والوصول الموحد"
        : "Network & Unified Access Hub",
    description:
      lang === "ar"
        ? "إدارة أجهزة الاتصال ومفاتيح تشغيل الشبكة والوصول المحلي والعالمي للمحطة."
        : "Manage connected devices, local/global access control, and network scheduling.",
    button: lang === "ar" ? "إدارة الشبكة والوصول" : "Manage Network Access",
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-start gap-3">
        <span className="p-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mt-1">
          <Icons.Shield className="w-6 h-6" />
        </span>
        <div>
          <h2 className="text-lg font-black text-white">{t.title}</h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            {t.description}
          </p>
        </div>
      </div>
      <Link
        href="/system/manager/network"
        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-2"
      >
        <Icons.Settings className="w-4 h-4" />
        {t.button}
      </Link>
    </div>
  );
}
