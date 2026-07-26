import "../../system-modules.css";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BatchForm from "./BatchForm";
import { cookies } from "next/headers";

import { redirect } from "next/navigation";

export default async function ProductionExecutionPage() {
  try {
    await requireRole([
      "OPERATOR",
      "MANAGER",
      "COMPANY_ADMIN",
      "DEPARTMENT_MANAGER",
      "SYSTEM_OWNER",
    ]);
  } catch (e) {
    redirect("/api/auth/session-cleanup");
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as "en" | "ar") || "en";

  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    redirect("/api/auth/session-cleanup");
  }
  const companyId = user.companyId as number;

  const recentCubeTests = await prisma.cubeTest.findMany({
    where: {
      companyId,
      order: { status: { in: ["PRODUCTION", "DELIVERED"] } },
    },
    include: { order: { select: { orderNumber: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const materials = await prisma.material.findMany({
    where: { companyId, status: "ACTIVE" },
  });

  // Ensure schema is synced: Order includes approval relation
  const orders = await prisma.order.findMany({
    where: {
      companyId,
      status: {
        in: ["LAB_APPROVED", "PRODUCTION"],
      },
    },
    include: {
      customer: true,
      project: true,
      mixDesign: true,
      labApproval: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedOrders = orders.map((o) => ({
    ...o,
    customer: o.customer,
    project: o.project,
    mixDesign: o.mixDesign,
    approval: o.labApproval,
  }));

  return (
    <div className="container py-6">
      <BatchForm orders={formattedOrders} materials={materials} lang={lang} />
      {recentCubeTests.length > 0 && (
        <div className="mt-8 glass-panel p-6 rounded-2xl border border-white/5 bg-slate-950/30">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            🔬 آخر نتائج التكسير
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {recentCubeTests.map((test) => (
              <div
                key={test.id}
                className={`rounded-xl p-3 border text-center ${
                  test.result === "PASS"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                <p className="text-xs text-slate-400 font-bold">
                  {test.order.orderNumber}
                </p>
                <p className="text-2xl font-black mt-1 text-white">
                  {test.mpa ?? "—"}
                </p>
                <p className="text-xs text-slate-500">MPa | {test.age} يوم</p>
                <p className="text-sm font-bold mt-1">
                  {test.result === "PASS" ? "ناجح ✓" : "فاشل ✗"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
