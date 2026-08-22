import { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { OperatorSidebar } from "@/components/operator/OperatorSidebar";
import { OperatorHeader } from "@/components/operator/OperatorHeader";
import "./operator.css";

export default async function OperatorLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const userName = user?.name || "المشغّل";
  
  return (
    <div className="flex h-screen bg-[#060a12] overflow-hidden" dir="rtl">
      {/* الشريط الجانبي الثابت */}
      <OperatorSidebar />
      
      {/* المنطقة الرئيسية */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* الشريط العلوي */}
        <OperatorHeader userName={userName} />
        
        {/* محتوى الصفحة */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        
        {/* شريط الحالة السفلي */}
        <footer className="shrink-0 flex items-center justify-between px-6 py-2 bg-[#0c1220] border-t border-white/5 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 op-pulse" />
              وحدة التحكم v2.4 — متصل
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              الموازين — مكيّلة ومعايَرة
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              وضع التشغيل: تلقائي
            </span>
          </div>
          <span>نظام المحطة الخرسانية — الإصدار 3.1 © نظام المشغّل</span>
        </footer>
      </div>
    </div>
  );
}
