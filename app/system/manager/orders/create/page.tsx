import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import CreateOrderForm from "@/components/sales/CreateOrderForm";
import Link from "next/link";

export default async function CreateOrderPage() {
  await requireRole([
    "SALES",
    "SALES_REP",
    "MANAGER",
    "COMPANY_ADMIN",
    "DEPARTMENT_MANAGER",
  ]);

  const mixDesigns = await prisma.mixDesign.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { code: "asc" },
    select: { id: true, name: true, code: true, strengthClass: true },
  });

  const adaptedMixes = mixDesigns.map((m) => ({
    id: m.id,
    name: m.name,
    code: m.code,
    strength: parseFloat(m.strengthClass?.replace(/\D/g, "") || "0"),
    strengthClass: m.strengthClass || "",
  }));

  return (
    <div
      className="min-h-screen text-slate-200 font-sans"
      style={{
        background:
          "radial-gradient(ellipse at top right, #1a0a2e 0%, #080b14 50%, #0a0f1a 100%)",
      }}
      dir="rtl"
    >
      <div className="fixed top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-4 py-10 space-y-6">
        <Link
          href="/system/manager/orders"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm font-medium group"
        >
          <span className="group-hover:translate-x-1 transition-transform">
            →
          </span>
          العودة للطلبات
        </Link>

        <div className="text-center space-y-3 py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-2xl shadow-violet-500/40 mx-auto mb-2 text-2xl">
            📦
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            طلب خرسانة جديد
          </h1>
          <p className="text-slate-500 text-sm">
            أتمم الخطوات لإنشاء طلبك في ثوانٍ
          </p>
        </div>

        <div className="relative rounded-3xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-7 shadow-2xl">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative">
            <CreateOrderForm
              customers={[]}
              projects={[]}
              mixDesigns={adaptedMixes}
              approvedPrices={{}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
