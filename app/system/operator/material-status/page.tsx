import { requireRole, getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import { prisma } from "@/lib/prisma";

import { redirect } from "next/navigation";

export default async function MaterialStatusPage() {
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

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const dict = getDictionary(lang);

  const materials = await prisma.material.findMany({
    where: {
      companyId,
      status: "ACTIVE",
    },
  });

  return (
    <div className="glass-panel p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">
            {dict.operator.material_status}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {"مراقبة حية للمخازن والصوامع"}
          </p>
        </div>
        <div className="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg text-sm font-bold border border-blue-500/20">
          مزامنة حية
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {materials.map((material) => {
          const maxCapacity = 50000; // Simulated capacity
          const percentage = Math.min(
            (material.stock / maxCapacity) * 100,
            100,
          );
          const isLow = percentage < 25;

          return (
            <div
              key={material.id}
              className={`glass-panel p-6 border-l-4 ${isLow ? "border-amber-500" : "border-blue-500"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{material.name}</h3>
                  <p className="text-sm font-bold text-slate-500 font-mono uppercase">
                    {material.code || material.name.slice(0, 3)}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-sm font-bold ${
                    isLow
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  {isLow ? dict.operator.status_low : dict.operator.status_ok}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-black text-white font-mono">
                  {Math.round(material.stock).toLocaleString("en-US")}
                </span>
                <span className="text-slate-400 text-xs font-bold uppercase">
                  {material.unit}
                </span>
              </div>

              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div
                  className={`h-full transition-all duration-1000 ${isLow ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"}`}
                  style={{ width: `${percentage}%` } as React.CSSProperties}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-3 text-xs text-slate-400 font-bold">
                <span>
                  نسبة الامتلاء:{" "}
                  <span className="text-white font-mono">
                    {percentage.toFixed(1)}%
                  </span>
                </span>
                <span>
                  السعة الكلية:{" "}
                  <span className="text-slate-300 font-mono">
                    {maxCapacity.toLocaleString("en-US")} {material.unit}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
        {materials.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-slate-500 italic">
              {"لا توجد بيانات للمواد حالياً"}
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-center gap-4">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <span className="text-xl">🔊</span>
        </div>
        <div>
          <h4 className="font-bold text-sm text-blue-400">
            {"تنبيهات النظام"}
          </h4>
          <p className="text-slate-400 text-sm font-bold mt-1">
            {dict.operator.audio_alert_notice}
          </p>
        </div>
      </div>
    </div>
  );
}
