"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Building2,
  DollarSign,
  TrendingDown,
  Users,
  BarChart3,
  Settings,
  Share2,
  Truck,
  Lock,
  ShieldCheck,
} from "lucide-react";

export function AccountantNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/system/accountant/invoices",
      label: "الفواتير والذمم",
      icon: FileText,
      active: pathname.startsWith("/system/accountant/invoices"),
    },
    {
      href: "/system/accountant/customers",
      label: "كشوفات العملاء",
      icon: Building2,
      active: pathname.startsWith("/system/accountant/customers"),
    },
    {
      href: "/system/accountant/vouchers",
      label: "سندات القبض",
      icon: DollarSign,
      active: pathname.startsWith("/system/accountant/vouchers"),
    },
    {
      href: "/system/accountant/expenses",
      label: "المصروفات التشغيلية",
      icon: TrendingDown,
      active: pathname.startsWith("/system/accountant/expenses"),
    },
    {
      href: "/system/accountant/payroll",
      label: "رواتب الموظفين",
      icon: Users,
      active: pathname.startsWith("/system/accountant/payroll"),
    },
    {
      href: "/system/accountant/drivers",
      label: "أجور ونشاط السائقين",
      icon: Truck,
      active: pathname.startsWith("/system/accountant/drivers"),
    },
    {
      href: "/system/accountant/periods",
      label: "إقفال الفترات المالية",
      icon: Lock,
      active: pathname.startsWith("/system/accountant/periods"),
    },
    {
      href: "/system/accountant/audit",
      label: "سجل الرقابة المالي",
      icon: ShieldCheck,
      active: pathname.startsWith("/system/accountant/audit"),
    },
    {
      href: "/system/accountant/reports",
      label: "التقارير والأرباح",
      icon: BarChart3,
      active: pathname.startsWith("/system/accountant/reports"),
    },
    {
      href: "/system/accountant/settings",
      label: "إعدادات العملات",
      icon: Settings,
      active: pathname.startsWith("/system/accountant/settings"),
    },
    {
      href: "/system/accountant/share",
      label: "مشاركة الملفات",
      icon: Share2,
      active: pathname.startsWith("/system/accountant/share"),
    },
  ];

  return (
    <div className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-2 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                item.active
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
