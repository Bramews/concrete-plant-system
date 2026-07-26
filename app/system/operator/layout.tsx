import { ReactNode } from "react";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import { Icons } from "@/components/ui/Icons";
import { OperatorNav } from "./OperatorNav";

export default async function OperatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";

  const tabs = [
    {
      href: "/system/operator/cockpit",
      label: "قمرة القيادة الحية",
      iconName: "Activity" as const,
    },
    {
      href: "/system/operator/production",
      label: "تنفيذ الإنتاج والخلط",
      iconName: "Factory" as const,
    },
    {
      href: "/system/operator/tickets",
      label: "تذاكر التوصيل والأسطول",
      iconName: "Ticket" as const,
    },
    {
      href: "/system/operator/materials",
      label: "حالة المواد والصوامع",
      iconName: "Box" as const,
    },
    {
      href: "/system/operator/settings",
      label: "إعدادات التشغيل والمعدات",
      iconName: "Settings" as const,
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Icons.Activity className="w-8 h-8 text-emerald-400" />
            <span>التحكم بالإنتاج وقمرة القيادة</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            إدارة خطوط الخلط المباشر، الصوامع، التذاكر، وإعدادات المعدات
          </p>
        </div>
      </div>

      <OperatorNav tabs={tabs} />

      <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 min-h-[550px] shadow-2xl backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}
