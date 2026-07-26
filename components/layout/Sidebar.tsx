"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { usePreferences } from "@/context/PreferenceContext";
import { dictionary } from "@/lib/dictionary";
import { DashboardConfig } from "@/lib/dashboard/engine";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  companyName?: string;
  dict?: any;
  settings?: Record<string, string>;
  config: DashboardConfig;
  lang?: string;
}

export function Sidebar({ companyName, settings, config, lang }: SidebarProps) {
  const { preferences, isMobileSidebarOpen, setMobileSidebarOpen } =
    usePreferences();
  const currentLang = lang || preferences.language;
  const isRtl = currentLang === "ar";

  const dict =
    dictionary[currentLang as "ar" | "en"]?.sidebar || dictionary["ar"].sidebar;

  const pathname = usePathname();

  const brandName = settings?.["system_name"] || companyName || "نيون المطور";
  const brandTagline = settings?.["system_tagline"] || "نظام الخرسانة المتكامل";
  const logoInitial = brandName.charAt(0).toUpperCase();

  const navItems = config?.navigation || [];

  const SidebarContent = (
    <div className="h-full bg-slate-950 flex flex-col border-white/5">
      {/* Premium Brand Header */}
      <div className="h-24 flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20" />
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="flex flex-col items-center text-center gap-2 relative z-10 p-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-xl shadow-lg ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-500">
            {logoInitial}
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xs font-black text-white tracking-[0.2em] uppercase leading-none">
              {brandName}
            </h1>
            <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest opacity-60">
              {brandTagline}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.length === 0 ? (
          <div className="text-center py-10 opacity-20">
            <Icons.Archive className="w-10 h-10 mx-auto mb-2" />
            <p className="text-[10px] font-bold uppercase">
              {dict.no_sections}
            </p>
          </div>
        ) : (
          navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/system" && pathname.startsWith(item.href));
            const Icon = Icons[item.icon as keyof typeof Icons] || Icons.Box;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${isActive ? "bg-indigo-500/10 text-indigo-400" : "bg-transparent text-slate-600 group-hover:text-slate-300"}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold tracking-wide">
                  {item.label}
                </span>
                {isActive && (
                  <div
                    className={`${isRtl ? "me-auto" : "ms-auto"} w-1 h-4 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]`}
                  />
                )}
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on lg and above) */}
      <aside
        className={`fixed inset-y-0 w-64 bg-slate-950 flex-col z-50 border-white/5 hidden lg:flex ${
          isRtl ? "right-0 border-l" : "left-0 border-r"
        }`}
      >
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer (visible below lg) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 z-[101] w-64 lg:hidden"
              style={{
                right: isRtl ? 0 : "auto",
                left: isRtl ? "auto" : 0,
              }}
            >
              <div className="h-full relative">
                {/* Close Button Inside Mobile Drawer */}
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} z-[102] p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white border border-white/10 active:scale-95 transition-all`}
                  title={isRtl ? "إغلاق" : "Close"}
                >
                  <Icons.X className="w-4 h-4" />
                </button>

                {SidebarContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
