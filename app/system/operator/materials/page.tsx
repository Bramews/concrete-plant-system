import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { ScadaSiloSVG } from "@/components/operator/ScadaSiloSVG";
import { BidiText } from "@/components/ui/BidiText";

export default async function OperatorMaterialsPage() {
  try {
    await requireRole([
      "OPERATOR",
      "MANAGER",
      "COMPANY_ADMIN",
      "DEPARTMENT_MANAGER",
      "SYSTEM_OWNER",
    ]);
  } catch {
    redirect("/api/auth/session-cleanup");
  }

  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    redirect("/api/auth/session-cleanup");
  }
  const companyId = user.companyId as number;

  const materials = await prisma.material.findMany({
    where: {
      companyId,
      status: "ACTIVE",
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0c1220] p-6 rounded-2xl border border-white/5 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Icons.Box className="w-7 h-7 text-cyan-400" />
            <span>حالة صوامع المواد والمخزون الحي</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">
            مراقبة المستشعرات الحية، كميات الأسمنت، الركام، والإضافات الكيميائية
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 op-pulse"></span>
          <span>المستشعرات تعمل ومزامنة لحظياً</span>
        </div>
      </div>

      {/* Section الأول: عرض SVG الصوامع */}
      <div className="op-card p-6">
        <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 op-pulse" />
          مستشعرات الصوامع — مراقبة لحظية
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center">
          {materials.map(m => {
            const maxCap = (m as unknown as { maxCapacity?: number }).maxCapacity || 50000;
            return (
              <ScadaSiloSVG
                key={m.id}
                id={m.id}
                name={m.name}
                stock={m.stock}
                maxCapacity={maxCap}
                unit={m.unit}
              />
            );
          })}
        </div>
        {materials.length === 0 && (
          <div className="py-12 text-center text-slate-500 italic text-sm font-bold">
            لا توجد بيانات صوامع مسجلة حالياً
          </div>
        )}
      </div>

      {/* Section الثاني: جدول تفصيلي */}
      <div className="op-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {["المادة", "الرمز", "المخزون", "السعة القصوى", "الامتلاء", "الحالة"].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {materials.map(m => {
                const max = (m as unknown as { maxCapacity?: number }).maxCapacity || 50000;
                const capacity = Math.max(1, max);
                const pct = Math.min(100, Math.max(0, (m.stock / capacity) * 100));
                const isCrit = pct < 20;
                const isWarn = pct < 40;

                return (
                  <tr key={m.id} className={`hover:bg-white/5 transition-colors ${isCrit ? "bg-red-950/20" : ""}`}>
                    <td className="px-4 py-3 font-bold text-white">{m.name}</td>
                    <td className="px-4 py-3 font-mono text-cyan-400 text-xs">{m.code || `MAT-${m.id}`}</td>
                    <td className="px-4 py-3 font-mono font-black text-white">
                      <BidiText>{Math.round(m.stock).toLocaleString("en-US")}</BidiText> <span className="text-xs text-slate-500">{m.unit}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      <BidiText>{Math.round(max).toLocaleString("en-US")}</BidiText> <span className="text-xs text-slate-500">{m.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className={`h-full rounded-full transition-all ${isCrit ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-black font-mono ${isCrit ? "text-red-400" : isWarn ? "text-amber-400" : "text-emerald-400"}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-black ${isCrit ? "bg-red-500/15 text-red-400 op-glow-crit" : isWarn ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                        {isCrit ? "⚠ حرج" : isWarn ? "منخفض" : "طبيعي"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
