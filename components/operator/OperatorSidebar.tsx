"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MonitorDot, Factory, FileText, Database, Settings,
  Gauge, Wifi
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/system/operator/cockpit",    icon: MonitorDot, label: "قمرة القيادة والمراقبة",    desc: "مراقبة حية للمحطة" },
  { href: "/system/operator/production", icon: Factory,    label: "تنفيذ الإنتاج والخلط",  desc: "تشغيل دفعات الخلط" },
  { href: "/system/operator/tickets",    icon: FileText,   label: "سجل تذاكر التسليم",    desc: "الأسطول والشاحنات" },
  { href: "/system/operator/materials",  icon: Database,   label: "حالة الصوامع والمواد",  desc: "مستشعرات المخزون" },
  { href: "/system/operator/settings",   icon: Settings,   label: "إعدادات التشغيل",      desc: "أجهزة PLC والمعدات" },
];

export function OperatorSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 shrink-0 bg-[#0c1220] flex flex-col border-l border-white/5 h-full">
      {/* Header / Logo */}
      <div className="pt-6 pb-4 px-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
          <Gauge className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="font-black text-white text-lg tracking-wide">نظام التحكم</h1>
          <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">وحدة التحكم الصناعي</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative group
                ${isActive 
                  ? "bg-cyan-500/10 border border-cyan-500/30 text-white" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"}
              `}
            >
              {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-l-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              )}
              
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              
              <div className="flex flex-col">
                <span className={`text-sm font-bold ${isActive ? "text-white" : ""}`}>{item.label}</span>
                {isActive && (
                  <span className="text-xs text-slate-500">{item.desc}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
          <div className="relative">
            <Wifi className="w-5 h-5 text-emerald-400" />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 op-pulse ring-2 ring-[#0c1220]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">محطة A-01</span>
            <span className="text-[10px] text-emerald-500 font-mono">متصل بالشبكة</span>
          </div>
        </div>
        <p className="text-[10px] text-center text-slate-600 font-mono mt-3">نظام التحكم — الإصدار 3.1</p>
      </div>
    </div>
  );
}
