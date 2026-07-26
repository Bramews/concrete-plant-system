export const dynamic = "force-dynamic";

import { OperationalPulse } from "@/components/manager/OperationalPulse";
import { ActionableItems } from "@/components/manager/ActionableItems";
import { QuickSimulator } from "@/components/manager/QuickSimulator";
import { CommandNav } from "@/components/manager/CommandNav";
import { getOperationalPulse, getAttentionItems } from "@/app/actions/manager";
import { getServerDictionary } from "@/lib/dictionary.server";
import Link from "next/link";

const quickLinks = [
  {
    href: "/system/orders/create",
    label: "طلب جديد",
    sub: "New Order",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
    color: "from-violet-600 to-indigo-600",
    glow: "shadow-violet-500/25",
    border: "border-violet-500/30 hover:border-violet-400/60",
  },
  {
    href: "/system/orders",
    label: "الطلبات",
    sub: "Orders",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="2" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
    color: "from-cyan-600 to-blue-600",
    glow: "shadow-cyan-500/25",
    border: "border-cyan-500/30 hover:border-cyan-400/60",
  },
  {
    href: "/system/manager/materials",
    label: "المواد",
    sub: "Materials",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    color: "from-emerald-600 to-teal-600",
    glow: "shadow-emerald-500/25",
    border: "border-emerald-500/30 hover:border-emerald-400/60",
  },
  {
    href: "/system/manager/users",
    label: "المستخدمون",
    sub: "Users",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: "from-rose-600 to-pink-600",
    glow: "shadow-rose-500/25",
    border: "border-rose-500/30 hover:border-rose-400/60",
  },
  {
    href: "/system/manager/machines",
    label: "الآليات",
    sub: "Machines",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M19.07 19.07l-1.41-1.41" />
        <path d="M4.93 19.07l1.41-1.41" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
      </svg>
    ),
    color: "from-amber-600 to-orange-600",
    glow: "shadow-amber-500/25",
    border: "border-amber-500/30 hover:border-amber-400/60",
  },
  {
    href: "/system/manager/maintenance",
    label: "صيانة المعدات",
    sub: "Maintenance",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    color: "from-blue-600 to-indigo-600",
    glow: "shadow-blue-500/25",
    border: "border-blue-500/30 hover:border-blue-400/60",
  },
  {
    href: "/system/manager/logs",
    label: "السجلات",
    sub: "Logs",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
      </svg>
    ),
    color: "from-slate-500 to-slate-600",
    glow: "shadow-slate-500/25",
    border: "border-slate-500/30 hover:border-slate-400/60",
  },
  {
    href: "/system/manager/network",
    label: "بث رسالة",
    sub: "Broadcast",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
      </svg>
    ),
    color: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/25",
    border: "border-amber-500/30 hover:border-amber-400/60",
  },
];

export default async function ManagerDashboardPage() {
  const [pulseData, attentionItems, dict] = await Promise.all([
    getOperationalPulse(),
    getAttentionItems(),
    getServerDictionary(),
  ]);

  return (
    <div
      className="min-h-screen bg-[#080b14] text-slate-200 font-sans"
      dir="rtl"
    >
      {/* Zone 1: Operational Pulse Bar */}
      <OperationalPulse initialData={pulseData} />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* HERO SECTION */}
        <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0a0f1c] p-8">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMXYxaC0xek0xIDFoMXYxSDF6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-40" />
          </div>

          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-[11px] font-bold text-violet-300 uppercase tracking-widest">
                  لوحة التحكم المركزية
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                {dict.dashboard?.title || "لوحة تحكم المدير"}
              </h1>
              <p className="text-slate-400 text-sm mt-2 font-medium">
                {dict.dashboard?.welcome_message ||
                  "مرحباً بك. النظام جاهز لقراراتك."}
              </p>
            </div>
            <CommandNav />
          </div>
        </div>

        {/* QUICK LINKS GRID */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">
            الوصول السريع
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative rounded-2xl border ${link.border} bg-white/[0.02] p-4 flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${link.glow} hover:bg-white/[0.04]`}
              >
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${link.color} text-white shadow-lg`}
                >
                  {link.icon}
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-white">{link.label}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {link.sub}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Notifications - Center Stage */}
          <div className="lg:col-span-8">
            <div className="h-full rounded-2xl border border-white/[0.06] bg-[#0d1117] overflow-hidden shadow-2xl">
              <ActionableItems initialItems={attentionItems} dict={dict} />
            </div>
          </div>

          {/* Sidebar Tools */}
          <div className="lg:col-span-4 space-y-4">
            {/* Simulator */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117] p-6 shadow-xl">
              <QuickSimulator dict={dict} />
            </div>

            {/* Efficiency Card */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest mb-3">
                كفاءة اليوم
              </p>
              <div className="flex items-end justify-between">
                <span className="text-5xl font-black text-white">
                  92<span className="text-2xl text-slate-500">%</span>
                </span>
                <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                  ▲ +4%
                </span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                  style={{ width: "92%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
