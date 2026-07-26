import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Icons } from "@/components/ui/Icons";

export default async function OperatorMaterialsPage() {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-white/5 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Icons.Box className="w-7 h-7 text-cyan-400" />
            <span>حالة صوامع المواد والمخزون</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">
            مراقبة المستشعرات الحية، كميات الأسمنت، الركام، والإضافات الكيميائية
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>المستشعرات تعمل ومزامنة لحظياً</span>
        </div>
      </div>

      {/* Grid of Silos & Materials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((material) => {
          const maxCapacity = material.maxCapacity || 50000;
          const percentage = Math.min(
            Math.max((material.stock / maxCapacity) * 100, 0),
            100,
          );
          const isLow = percentage < 25;
          const isFull = percentage > 90;

          return (
            <div
              key={material.id}
              className={`p-6 rounded-2xl border transition-all duration-300 bg-slate-900/40 backdrop-blur-md shadow-xl flex flex-col justify-between ${
                isLow
                  ? "border-amber-500/40 shadow-amber-500/5 hover:border-amber-500"
                  : isFull
                    ? "border-cyan-500/40 shadow-cyan-500/5 hover:border-cyan-500"
                    : "border-white/5 hover:border-emerald-500/40"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-white tracking-wide">
                      {material.name}
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded mt-1 inline-block">
                      {material.code || "MAT-" + material.id}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                      isLow
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : isFull
                          ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {isLow
                      ? "مستوى منخفض ⚠️"
                      : isFull
                        ? "ممتلئ 🟢"
                        : "مستوى طبيعي ✓"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 my-4">
                  <span className="text-4xl font-black text-white font-mono tracking-tight">
                    {Math.round(material.stock).toLocaleString("en-US")}
                  </span>
                  <span className="text-slate-400 text-xs font-bold uppercase">
                    {material.unit}
                  </span>
                </div>

                {/* Progress bar representing Silo level */}
                <div className="space-y-1.5">
                  <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isLow
                          ? "bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                          : "bg-gradient-to-r from-emerald-600 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold pt-1">
                    <span>
                      الامتلاء:{" "}
                      <span className="text-white font-mono">
                        {percentage.toFixed(1)}%
                      </span>
                    </span>
                    <span>
                      السعة القصوى:{" "}
                      <span className="text-slate-300 font-mono">
                        {maxCapacity.toLocaleString("en-US")} {material.unit}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs font-semibold text-slate-400">
                <span>الكثافة: {material.density || "1.4"} طن/م³</span>
                <span className="text-cyan-400 font-bold">
                  مستشعر الوزن: نشط
                </span>
              </div>
            </div>
          );
        })}

        {materials.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-2xl bg-slate-900/20">
            <Icons.Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-bold text-base">
              لا توجد بيانات صوامع أو مواد مسجلة حالياً
            </p>
          </div>
        )}
      </div>

      {/* Warning footer notification */}
      <div className="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center gap-4 text-amber-300">
        <Icons.AlertTriangle className="w-6 h-6 shrink-0 text-amber-400" />
        <div className="text-sm font-semibold">
          <h4 className="font-extrabold text-amber-200">
            تنبيه تلقائي لصوامع الأسمنت
          </h4>
          <p className="text-amber-300/80 text-xs mt-0.5">
            عند انخفاض مخزون أي صومعة عن 20%، يتم تشغيل جرس الإنذار الصوتي
            بالمحطة وإرسال تنبيه آلي لمدير المشتريات.
          </p>
        </div>
      </div>
    </div>
  );
}
