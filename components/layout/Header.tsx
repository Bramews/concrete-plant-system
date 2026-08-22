"use client";

import { Icons } from "@/components/ui/Icons";
import { SystemOwnerControls } from "@/components/system/SystemOwnerControls";
import { usePreferences } from "@/context/PreferenceContext";
import { SunlightModeToggle } from "@/components/ui/SunlightModeToggle";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  user: {
    name: string | null;
    role: string;
    email: string;
    companyName?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const { preferences, updatePreference, t, setMobileSidebarOpen } =
    usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "Escape") setIsOpen(false);

      if (isOpen) {
        if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          setIsOpen(false);
          router.push("/system/profile");
        }
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          setIsOpen(false);
          router.push("/admin/settings");
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, router]);

  const lang = preferences.language;
  const isRtl = lang === "ar";

  const getPageTitle = useCallback(() => {
    if (!t) return user.companyName;

    const titles: Record<string, string> = {
      invoices: t.accounting?.invoices,
      expenses: t.accounting?.expenses,
      payroll: t.accounting?.payroll,
      reports: t.accounting?.reports,
      "mix-designs": t.sidebar?.mix_designs,
      "cube-results": t.sidebar?.cube_results,
      "sieve-analysis": isRtl
        ? searchParams.get("view") === "add"
          ? "إضافة تحليل منخلي"
          : "تحليل المناخل"
        : searchParams.get("view") === "add"
          ? "Add Sieve Analysis"
          : "Sieve Analysis",
      "fresh-concrete": isRtl ? "الخرسانة الطازجة" : "Fresh Concrete",
      "aggregate-tests": isRtl ? "فحوصات الركام" : "Aggregate Tests",
      standards: t.sidebar?.standards,
      archive: t.sidebar?.lab_archive,
      production: t.sidebar?.production,
      tickets: t.sidebar?.tickets,
      "material-status": t.sidebar?.material_status,
      profile: t.account?.profile,
      settings: t.sidebar?.settings,
      companies: t.sidebar?.companies,
      plans: t.sidebar?.plans,
      rbac: isRtl ? "إدارة الصلاحيات" : "Access Control",
      billing: t.accounting?.billing,
      notifications: t.sidebar?.alerts,
      dashboard: t.sidebar?.dashboard,
    };

    if (pathname.includes("/admin/rbac"))
      return isRtl ? "نظام إدارة الصلاحيات (RBAC)" : "RBAC Management";

    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    return titles[lastSegment] || (isRtl ? "لوحة التحكم" : "Dashboard");
  }, [t, pathname, isRtl, user.companyName]);

  const getBreadcrumb = useCallback(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 2) return null;

    const sectionMap: Record<string, string> = {
      lab: isRtl ? "المختبر" : "Lab",
      orders: isRtl ? "الطلبات" : "Orders",
      admin: isRtl ? "الإدارة" : "Admin",
      accountant: isRtl ? "المحاسبة" : "Finance",
      production: isRtl ? "الإنتاج" : "Production",
    };

    return segments.length > 1 ? sectionMap[segments[1]] || null : null;
  }, [pathname, isRtl]);

  const getRoleLabel = (role: string) => {
    return t.roles?.[role as keyof typeof t.roles] || role;
  };

  const formatTime = () => {
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    if (isRtl) {
      return timeStr.replace("AM", "ص").replace("PM", "م");
    }
    return timeStr;
  };

  const pageTitle = getPageTitle();
  const breadcrumb = getBreadcrumb();

  if (!mounted) return <header className="h-[52px] bg-[#0a0e1a]" />;

  return (
    <header className="sticky top-0 z-40 select-none">
      {/* ━━━ Floating Glass Bar ━━━ */}
      <div className="mx-3 mt-2 mb-0">
        <div className="h-[44px] px-3 sm:px-4 flex items-center justify-between rounded-2xl bg-[#0d1220]/75 backdrop-blur-3xl border border-white/[0.05] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.03)] relative group">
          {/* ── Background Effects (Contained) ── */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-40">
              <motion.div
                animate={{
                  x: [0, 20, 0],
                  y: [0, -10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[40px]"
              />
              <motion.div
                animate={{
                  x: [0, -20, 0],
                  y: [0, 10, 0],
                  scale: [1.2, 1, 1.2],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-[40px]"
              />
            </div>

            {/* Holographic shimmer/border on group hover */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* ── Right: Page Context ── */}
          <motion.div
            initial={{ opacity: 0, x: isRtl ? 12 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-2 relative z-10"
          >
            {/* Hamburger Menu (Mobile Only) */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              title={isRtl ? "القائمة" : "Menu"}
              aria-label="Open sidebar"
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors active:scale-95"
            >
              <Icons.Menu className="w-5 h-5" />
            </button>

            {/* Accent dot with glow (Hidden on mobile) */}
            <div className="hidden sm:flex relative items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <div className="absolute w-2 h-2 rounded-full bg-indigo-500 animate-ping opacity-40" />
            </div>

            {/* Title Stack */}
            <div className="flex items-center gap-2">
              {breadcrumb && (
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-[9px] font-black text-indigo-400/50 uppercase tracking-[0.2em]">
                    {breadcrumb}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.span
                  key={pageTitle}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[12px] sm:text-[14px] font-black text-white/95 tracking-tight truncate max-w-[120px] sm:max-w-none"
                >
                  {pageTitle}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Middle: Search/Command Command K Mockup ── */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center z-10">
            <motion.div
              whileHover={{
                scale: 1.02,
                backgroundColor: "rgba(255,255,255,0.04)",
              }}
              className="px-3 py-1 rounded-lg border border-white/[0.03] bg-white/[0.02] flex items-center gap-2 cursor-pointer transition-all border-dashed"
            >
              <Icons.Search className="w-3 h-3 text-slate-600" />
              <span className="text-sm font-bold text-slate-600 font-medium">
                {isRtl ? "بحث سريع..." : "Quick Search..."}
              </span>
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-white/[0.05] border border-white/5">
                <span className="text-[8px] text-slate-500 font-mono">⌘</span>
                <span className="text-[8px] text-slate-500 font-mono">
                  {isRtl ? "ب" : "K"}
                </span>
              </div>
            </motion.div>
          </div>

          {/* ── Left: Controls ── */}
          <motion.div
            initial={{ opacity: 0, x: isRtl ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
            className="flex items-center gap-1.5 sm:gap-2 z-10 shrink-0"
          >
            {/* Clock */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold font-mono text-slate-400 tabular-nums">
              <Icons.Clock className="w-3 h-3" />
              {formatTime()}
            </div>

            {/* ── Quick Controls ── */}
            <div className="flex items-center gap-1.5">
              <SunlightModeToggle variant="compact" />
              <button
                onClick={() =>
                  updatePreference("language", isRtl ? "en" : "ar")
                }
                title={isRtl ? "Switch to English" : "التبديل للعربية"}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/10 text-indigo-200/70 hover:text-white transition-all shadow-sm shrink-0"
              >
                <span className="text-[11px] font-black uppercase leading-none mt-[1px]">
                  {isRtl ? "EN" : "ع"}
                </span>
              </button>
            </div>

            {/* ── System Control (Owner Only) ── */}
            <div className="scale-90 sm:scale-100 shrink-0">
              <SystemOwnerControls userRole={user.role} isRtl={isRtl} />
            </div>

            {/* Separator (Hidden on mobile) */}
            <div className="hidden sm:block h-4 w-px bg-white/[0.05] mx-0.5 shrink-0" />

            {/* ── User Pill ── */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <div
                className={`flex items-center gap-2 py-1 px-2 rounded-xl transition-all duration-300 relative group/avatar ${
                  isOpen
                    ? "bg-indigo-500/[0.1] ring-1 ring-indigo-500/30"
                    : "bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.02] hover:border-white/[0.05]"
                }`}
              >
                {/* Avatar Button (Isolated click for Photo) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPhotoOpen(true);
                  }}
                  className="relative group/photo active:scale-95 transition-transform shrink-0"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute -inset-[3px] rounded-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                    style={{
                      background:
                        "conic-gradient(from 0deg, #6366f1, transparent, #8b5cf6, transparent, #6366f1)",
                      filter: "blur(4px)",
                    }}
                  />
                  <div className="relative w-7 h-7 rounded-[10px] bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 flex items-center justify-center text-indigo-400 text-[12px] font-black group-hover/photo:text-white transition-colors">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  {/* Status dot */}
                  <div
                    className={`absolute -bottom-0.5 ${isRtl ? "-left-0.5" : "-right-0.5"} w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0d1220] shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
                  />
                </button>

                {/* Name & Menu Trigger */}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  title={isRtl ? "قائمة المستخدم" : "User Menu"}
                  aria-label="User menu"
                  className="flex items-center gap-1.5 outline-none"
                >
                  <div className="hidden xl:flex flex-col items-start leading-none gap-0.5 max-w-[120px] overflow-hidden">
                    <span className="text-xs font-black text-white/90 tracking-tight truncate w-full">
                      {user.name}
                    </span>
                    <span className="text-[8px] font-bold text-indigo-400/60 uppercase tracking-tighter truncate w-full">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>

                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Icons.ChevronDown
                      className={`w-3 h-3 ${isOpen ? "text-indigo-400" : "text-slate-600"}`}
                    />
                  </motion.div>
                </button>
              </div>

              {/* ━━━ COMMAND-PALETTE DROPDOWN ━━━ */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{
                      type: "spring",
                      stiffness: 600,
                      damping: 35,
                      mass: 0.6,
                    }}
                    className={`absolute top-[calc(100%+10px)] end-0 w-[280px] z-50`}
                  >
                    <div className="rounded-2xl bg-[#0c1121]/95 backdrop-blur-3xl border border-white/[0.06] shadow-[0_25px_50px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.02)] overflow-hidden">
                      {/* ── User Card ── */}
                      <div className="p-4 relative">
                        {/* Background mesh */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-violet-500/[0.04]" />
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.08] rounded-full blur-2xl" />

                        <div className="relative flex items-center gap-3">
                          {/* Big Avatar */}
                          <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-base font-black shadow-xl shadow-indigo-500/25 ring-1 ring-white/10">
                              {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div
                              className={`absolute -bottom-0.5 ${isRtl ? "-left-0.5" : "-right-0.5"} w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0c1121] shadow-[0_0_6px_rgba(52,211,153,0.5)]`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate">
                              {user.name}
                            </p>
                            <p className="text-sm font-bold text-slate-500 truncate mt-0.5">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Role Badge */}
                        <div className="mt-3 flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/[0.08] border border-indigo-500/[0.12]">
                            <div className="w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_4px_rgba(99,102,241,0.6)]" />
                            <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">
                              {getRoleLabel(user.role)}
                            </span>
                          </div>
                          {user.companyName && (
                            <span className="text-[9px] text-slate-600 truncate">
                              {user.companyName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ── Divider ── */}
                      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

                      {/* ── Actions ── */}
                      <div className="p-1.5">
                        <Link
                          href="/system/profile"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all duration-150 group/item"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/[0.03] group-hover/item:bg-indigo-500/10 flex items-center justify-center transition-colors border border-white/[0.02] group-hover/item:border-indigo-500/20">
                            <Icons.User className="w-4 h-4 group-hover/item:text-indigo-400 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold leading-tight">
                              {t.header?.profile ||
                                (isRtl ? "الملف الشخصي" : "Profile")}
                            </p>
                            <p className="text-[9px] text-slate-600 leading-tight mt-0.5">
                              {isRtl ? "إدارة حسابك" : "Manage account"}
                            </p>
                          </div>
                          <kbd className="hidden md:block px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] text-[8px] text-slate-700 font-mono group-hover/item:text-slate-500 transition-colors uppercase">
                            P
                          </kbd>
                        </Link>

                        <Link
                          href="/admin/settings"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all duration-150 group/item"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/[0.03] group-hover/item:bg-violet-500/10 flex items-center justify-center transition-colors border border-white/[0.02] group-hover/item:border-violet-500/20">
                            <Icons.Settings className="w-4 h-4 group-hover/item:text-violet-400 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold leading-tight">
                              {isRtl ? "الإعدادات" : "Settings"}
                            </p>
                            <p className="text-[9px] text-slate-600 leading-tight mt-0.5">
                              {isRtl ? "تفضيلات النظام" : "System preferences"}
                            </p>
                          </div>
                          <kbd className="hidden md:block px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] text-[8px] text-slate-700 font-mono group-hover/item:text-slate-500 transition-colors uppercase">
                            S
                          </kbd>
                        </Link>
                      </div>

                      {/* ── Divider ── */}
                      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

                      {/* ── Toggle Row ── */}
                      <div className="p-2 flex gap-1.5">
                        <button
                          onClick={() =>
                            updatePreference(
                              "mode",
                              preferences.mode === "light" ? "dark" : "light",
                            )
                          }
                          title={isRtl ? "تبديل المظهر" : "Toggle Theme"}
                          aria-label="Toggle Theme"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-white/[0.06] text-slate-600 hover:text-white transition-all text-sm font-bold"
                        >
                          {preferences.mode === "light" ? (
                            <Icons.Moon className="w-3 h-3" />
                          ) : (
                            <Icons.Sun className="w-3 h-3" />
                          )}
                          {preferences.mode === "light"
                            ? isRtl
                              ? "داكن"
                              : "Dark"
                            : isRtl
                              ? "فاتح"
                              : "Light"}
                        </button>

                        <button
                          onClick={() =>
                            updatePreference("language", isRtl ? "en" : "ar")
                          }
                          title={
                            isRtl ? "Switch to English" : "التبديل للعربية"
                          }
                          aria-label="Switch Language"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-white/[0.06] text-slate-600 hover:text-white transition-all text-sm font-bold"
                        >
                          <Icons.Globe className="w-3 h-3" />
                          {isRtl ? "English" : "عربي"}
                        </button>
                      </div>

                      {/* ── Logout ── */}
                      <div className="p-1.5 pt-0">
                        <button
                          onClick={async () => {
                            const { logout } = await import(
                              "@/app/actions/auth"
                            );
                            await logout();
                            window.location.href = "/login";
                          }}
                          title={isRtl ? "تسجيل الخروج" : "Logout"}
                          aria-label="Logout"
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all duration-150 group/logout"
                        >
                          <div className="w-7 h-7 rounded-lg bg-rose-500/[0.05] group-hover/logout:bg-rose-500/10 flex items-center justify-center transition-colors">
                            <Icons.LogOut className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[11px] font-semibold">
                            {t.header?.logout ||
                              (isRtl ? "تسجيل الخروج" : "Logout")}
                          </span>
                        </button>
                      </div>

                      {/* ── Footer ── */}
                      <div className="px-4 py-2 border-t border-white/[0.03] flex items-center justify-between">
                        <span className="text-[8px] text-slate-800 font-mono">
                          {isRtl ? "إصدار 1.3.0" : "v1.3.0"}
                        </span>
                        <span className="text-[8px] text-slate-800 font-mono">
                          ESC {isRtl ? "للإغلاق" : "to close"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
      {/* ━━━ PHOTO VIEWER OVERLAY ━━━ */}
      <AnimatePresence>
        {isPhotoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPhotoOpen(false)}
            className="fixed inset-0 z-[100] bg-[#020617]/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              {/* Photo Card */}
              <div className="relative p-2 rounded-[40px] bg-white/[0.03] border border-white/10 shadow-2xl overflow-hidden group">
                <div className="relative w-[320px] aspect-square rounded-[32px] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-[120px] font-black shadow-inner">
                  {user.name?.[0]?.toUpperCase()}

                  {/* Aesthetic light streak */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-50" />
                </div>

                {/* Info Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20">
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {user.name}
                  </h3>
                  <p className="text-sm text-slate-400 font-medium opacity-80">
                    {user.email}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setIsPhotoOpen(false)}
                  title={isRtl ? "إغلاق" : "Close"}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                >
                  <Icons.ChevronLeft className="w-5 h-5 rotate-90 md:rotate-0" />
                </button>
              </div>

              {/* Decorative rings */}
              <div className="absolute -inset-4 rounded-[48px] border border-indigo-500/20 animate-pulse pointer-events-none" />
              <div className="absolute -inset-8 rounded-[56px] border border-violet-500/10 animate-pulse delay-700 pointer-events-none" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
