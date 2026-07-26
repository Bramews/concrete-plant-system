import { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, ClipboardList, TrendingUp, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Ensure user has the PORTAL_USER role (which we'll implement in auth too)
  const session = (await requireRole([
    "CUSTOMER",
    "COMPANY_ADMIN",
    "MANAGER",
  ])) as any;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
      {/* Top Banner (Branded) */}
      <header className="h-20 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-500/20 font-mono">
            CP
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">
              بوابة الزبائن
            </h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-none">
              نظام المحطة الخرسانية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-400">
            <Link href="/portal" className="hover:text-white transition-colors">
              الرئيسية
            </Link>
            <Link
              href="/portal/orders"
              className="hover:text-white transition-colors"
            >
              طلباتي
            </Link>
            <Link
              href="/portal/lab"
              className="hover:text-white transition-colors"
            >
              نتائج الفحص
            </Link>
          </nav>
          <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold font-black">
                {session.user.name}
              </p>
              <p className="text-[9px] text-blue-400 font-bold uppercase">
                الزبون المعتمد
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 animate-fade-in">
        {children}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-white/5 py-10 mt-20 text-center">
        <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} نظام إدارة المحطة
          الخرسانية
        </p>
      </footer>
    </div>
  );
}
