"use client";

import { Icons } from "@/components/ui/Icons";
import { useDictionary } from "@/lib/dictionary";
import { usePreferences } from "@/context/PreferenceContext";
import { useEffect, useState } from "react";

export function DashboardHeader({
  toggleSidebar,
  user,
}: {
  toggleSidebar: () => void;
  user?: { name: string; role: string };
}) {
  const dictionary = useDictionary();
  const { preferences, updatePreference } = usePreferences();

  // Determine actual language and direction from preferences or fallback
  const isRtl = preferences.language === "ar";

  return (
    <header className="h-[64px] bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Left (or Right in RTL): Sidebar Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-all lg:hidden"
        >
          <Icons.Activity className="w-5 h-5" />{" "}
          {/* Using fallback for Menu if not in Icons */}
        </button>

        {/* Breadcrumb / Title Placeholder */}
        <h1 className="font-bold text-sm uppercase tracking-wider text-white hidden md:block">
          {dictionary.dashboard?.title || "Dashboard"}
        </h1>
      </div>

      {/* Center: Search (Optional) */}
      <div className="hidden md:flex items-center bg-white/5 rounded-2xl px-5 py-2 w-[350px] border border-white/5 focus-within:border-indigo-500/50 transition-all group shadow-inner">
        <Icons.Search className="w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
        <input
          type="text"
          placeholder={dictionary.common?.search || "Search..."}
          className="bg-transparent border-none outline-none text-sm font-semibold uppercase tracking-wider ml-3 w-full text-white placeholder:text-slate-600"
        />
      </div>

      {/* Right (or Left in RTL): Actions */}
      <div className="flex items-center gap-3">
        {/* System Update / Time Display */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            {dictionary.header?.system_update ||
              (isRtl ? "تحديث النظام" : "System Update")}
          </p>
          <p
            className="font-mono text-sm font-bold text-slate-600 dark:text-slate-300"
            dir="ltr"
          >
            <ClientClock />
          </p>
        </div>

        <div className="h-8 w-[1px] bg-white/5 mx-3 hidden sm:block"></div>
        <button
          aria-label="Notifications"
          className="relative p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-indigo-400 transition-all group"
        >
          <Icons.Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950 shadow-lg animate-pulse"></span>
        </button>

        <button
          onClick={() => updatePreference("language", isRtl ? "en" : "ar")}
          className="px-4 py-2 hover:bg-white/5 rounded-xl text-sm font-semibold uppercase text-slate-300 hover:text-white transition-all border border-white/5"
        >
          {isRtl ? "EN" : "عربي"}
        </button>

        <div className="flex items-center gap-3 bg-white/5 p-1.5 pr-4 rounded-2xl border border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white font-bold text-sm shadow-2xl shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-xs font-semibold text-white uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
              {user?.name}
            </p>
            <p className="text-xs text-slate-400 font-medium uppercase mt-0.5">
              {dictionary.common?.roles?.[
                user?.role as keyof typeof dictionary.common.roles
              ] || user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function ClientClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // Separate the initial setTime from the subscription to avoid synchronous setState inside effect
    const now = new Date().toLocaleTimeString();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(now);

    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <span className="opacity-0">00:00:00</span>;

  return <>{time}</>;
}
