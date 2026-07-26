"use client";
/* eslint-disable react/no-unknown-property */

import { Icons } from "@/components/ui/Icons";
import Link from "next/link";

interface SieveDashboardProps {
  stats: {
    totalTests: number;
    pendingTests: number;
    lastFM: string;
  };
}

export default function SieveDashboard({ stats }: SieveDashboardProps) {
  const actions = [
    {
      id: "add",
      label: "إضافة نتيجة جديدة",
      desc: "تسجيل فحص منخلي جديد للعينة الحالية",
      icon: Icons.Plus,
      href: "/system/lab/sieve-analysis?view=add",
      color: "from-indigo-600 to-blue-600",
      shadow: "shadow-indigo-500/20",
    },
    {
      id: "archive",
      label: "أرشيف النتائج",
      desc: "استعراض وتدقيق كافة الفحوصات السابقة",
      icon: Icons.Archive,
      href: "/system/lab/sieve-analysis?view=archive",
      color: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/20",
    },
    {
      id: "settings",
      label: "إعدادات المواصفات",
      desc: "إدارة حدود المناخل والمعايير العالمية",
      icon: Icons.Settings,
      href: "/system/lab/sieve-analysis?view=settings",
      color: "from-slate-600 to-slate-800",
      shadow: "shadow-slate-500/20",
    },
  ];

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-8 animate-in fade-in duration-700">
      {/* Header section with Stats */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1a1f2e]/40 border border-white/5 p-10 backdrop-blur-3xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              تحليل المناخل
            </h1>
            <p className="text-slate-400 font-medium">
              نطام إدارة ورقابة جودة التدرج الحبيبي للمواد الأولية
            </p>
          </div>

          <div className="flex gap-10">
            <div className="text-center group">
              <span className="text-sm font-bold font-black tracking-widest text-slate-500 block uppercase mb-1">
                إجمالي الفحوصات
              </span>
              <span className="text-3xl font-black text-indigo-400 western-nums tabular-nums group-hover:drop-shadow-glow-indigo transition-all">
                {stats.totalTests}
              </span>
            </div>
            <div className="w-px h-12 bg-white/5" />
            <div className="text-center group">
              <span className="text-sm font-bold font-black tracking-widest text-slate-500 block uppercase mb-1">
                آخر FM تم تسجيله
              </span>
              <span className="text-3xl font-black text-emerald-400 western-nums tabular-nums group-hover:drop-shadow-glow-emerald transition-all">
                {stats.lastFM}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actions.map((action, i) => (
          <Link
            key={action.id}
            href={action.href}
            className={`group relative overflow-hidden rounded-[2.5rem] bg-[#1a1f2e]/30 border border-white/5 hover:border-white/10 p-8 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] ${action.shadow}`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
            />

            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div
                className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${action.color} flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:rotate-6`}
              >
                <action.icon className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">
                  {action.label}
                </h3>
                <p className="text-sm font-bold text-slate-500 font-medium leading-relaxed px-4">
                  {action.desc}
                </p>
              </div>

              <div className="pt-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold font-black text-white uppercase tracking-widest">
                  دخول الآن
                  <Icons.ArrowLeft className="w-3 h-3" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Decorative background accent */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] opacity-20" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] opacity-10" />
      </div>

      <style jsx global>{`
        .drop-shadow-glow-indigo {
          filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.5));
        }
        .drop-shadow-glow-emerald {
          filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.5));
        }
        .western-nums {
          font-family: "Inter", system-ui, sans-serif !important;
          direction: ltr !important;
        }
      `}</style>
    </div>
  );
}
