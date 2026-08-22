import Link from "next/link";
import { requireRole, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Truck, DollarSign, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ManagerMachinesPage() {
  await requireRole(["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);
  const session = await getSession();
  const companyId = session?.companyId;

  const vehicles = await prisma.vehicle.findMany({
    where: companyId ? { companyId } : {},
    orderBy: { code: "asc" },
  });

  // Count tickets per truck / vehicle code
  const tickets = await prisma.deliveryTicket.findMany({
    where: companyId ? { companyId } : {},
    select: { truckNumber: true, driverName: true },
  });

  const truckStats: Record<string, { trips: number; lastDriver: string }> = {};
  for (const t of tickets) {
    const code = t.truckNumber.trim();
    if (!truckStats[code]) {
      truckStats[code] = { trips: 0, lastDriver: t.driverName || "غير محدد" };
    }
    truckStats[code].trips += 1;
    if (t.driverName) {
      truckStats[code].lastDriver = t.driverName;
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Truck className="w-6 h-6" />
            </div>
            إدارة أسطول الآليات والشاحنات
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-1">
            متابعة حالة الخلاطات، المضخات، السائقين المعينين، وإجمالي نقلات كل آلية
          </p>
        </div>

        <Link
          href="/system/accountant/drivers"
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
        >
          <DollarSign className="w-4 h-4" />
          <span>حسابات وأجور السائقين والوصولات</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  رمز الآلية
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  النوع
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  السائق الحالي / المخصص
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  عدد النقلات المنجزة
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  الحالة
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  الموقع
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic text-xs">
                    لا توجد آليات مسجلة
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => {
                  const stat = truckStats[v.code.trim()] || { trips: 0, lastDriver: v.name || "سائق غير مسجل" };
                  return (
                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        {v.code}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-bold text-xs">
                        {v.type === "MIXER" ? "شاحنة خلاطة (Mixer)" : v.type === "PUMP" ? "مضخة خرسانة (Pump)" : v.type}
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-bold text-xs">
                        {stat.lastDriver}
                      </td>
                      <td className="px-6 py-4 font-mono text-emerald-400 font-bold text-sm">
                        {stat.trips} وصل
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            v.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {v.status === "ACTIVE" ? "نشط بالخدمة" : "صيانة"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                        {v.location}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
