import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/auth";
import CreateOrderForm from "@/components/sales/CreateOrderForm";
import fs from "fs/promises";
import path from "path";
import { FileText, Beaker } from "lucide-react";

export default async function CreateOrderPage() {
  await requireRole(["SALES", "SALES_REP", "SALES_MANAGER", "COMPANY_ADMIN"]);

  const user = await getCurrentUser();
  const companyId = user?.companyId || 1;

  // Fetch data for the form with tenant isolation
  const [customers, projects, mixDesigns] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.project.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.mixDesign.findMany({
      where: {
        companyId,
        status: "APPROVED",
        isCurrent: true,
        isFrozen: false,
      },
      orderBy: { code: "asc" },
      select: { id: true, name: true, code: true, strengthClass: true },
    }),
  ]);

  // Read approved prices list
  let approvedPrices: Record<string, number> = {
    C20: 65000,
    C25: 68000,
    C30: 72000,
    C40: 80000,
  };
  try {
    const pricesPath = path.join(process.cwd(), "data", "approved-prices.json");
    const data = await fs.readFile(pricesPath, "utf-8");
    approvedPrices = JSON.parse(data);
  } catch (err) {
    console.error("Failed to read approved-prices.json, using defaults:", err);
  }

  return (
    <div
      className="max-w-3xl mx-auto space-y-4 animate-in fade-in duration-500"
      dir="rtl"
    >
      {/* Premium Glassmorphic Header */}
      <div className="relative overflow-hidden rounded-2xl bg-card/30 border border-white/5 p-6 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1 text-right">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
              طلب جديد
            </div>
            <h1 className="text-base font-black text-white">
              تسجيل وتأكيد طلبية عميل جديد
            </h1>
            <p className="text-[10px] text-slate-500 font-bold">
              تعبئة البيانات اللوجستية وتحديد الرتبة الخرسانية لحساب التكلفة
              واعتماد الطلب من الإدارة.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Form container */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-sm p-6">
        <CreateOrderForm
          customers={customers}
          projects={projects}
          mixDesigns={mixDesigns}
          approvedPrices={approvedPrices}
        />
      </div>
    </div>
  );
}
