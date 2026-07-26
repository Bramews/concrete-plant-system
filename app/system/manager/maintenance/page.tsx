import React from "react";
import { requireRole, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resetMaintenanceAction } from "@/app/actions/maintenance";
import { BidiText } from "@/components/ui/BidiText";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  PenTool,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MaintenanceDashboardPage() {
  await requireRole(["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);

  const session = await getSession();
  const companyId = session?.companyId;

  if (!companyId) {
    return (
      <div className="p-8 text-center text-red-500 font-bold" dir="rtl">
        خطأ: لم يتم العثور على جلسة عمل نشطة للشركة.
      </div>
    );
  }

  // Fetch equipment with maintenance records
  const equipmentList = await prisma.equipment.findMany({
    where: { companyId },
    include: {
      predictiveMaintenance: true,
    },
    orderBy: { name: "asc" },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
          progress: "bg-emerald-500",
          badge:
            "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
          label: "سليم",
        };
      case "WARNING":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
          progress: "bg-amber-500",
          badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
          label: "تحذير",
        };
      case "CRITICAL":
        return {
          bg: "bg-orange-500/10 border-orange-500/20 text-orange-400",
          progress: "bg-orange-500",
          badge: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
          label: "حرج",
        };
      case "OVERDUE":
        return {
          bg: "bg-red-500/10 border-red-500/20 text-red-400",
          progress: "bg-red-500",
          badge: "bg-red-500/20 text-red-400 border border-red-500/30",
          label: "متجاوز الصيانة",
        };
      default:
        return {
          bg: "bg-slate-500/10 border-white/5 text-slate-400",
          progress: "bg-slate-500",
          badge: "bg-slate-500/20 text-slate-400 border border-white/10",
          label: "غير معروف",
        };
    }
  };

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case "KM":
        return "كيلومتر";
      case "MILES":
        return "ميل";
      case "HOURS":
        return "ساعة عمل";
      case "BATCHES":
      default:
        return "دفعة خلط";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-6" dir="rtl">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
          الذكاء التنبؤي للأعطال والصيانة
        </h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mt-1 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-primary/30"></span>
          نظام التنبؤ بصحة الآلات والمعدات (دفعات الخلط / كم / ميل / ساعات
          العمل)
        </p>
      </div>

      {/* Grid of Equipment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipmentList.map((eq) => {
          const m = eq.predictiveMaintenance;
          const count = m?.batchCount ?? 0;
          const threshold = m?.maintenanceThreshold ?? 1000;
          const unit = m?.trackingUnit || "BATCHES";
          const unitLabel = getUnitLabel(unit);
          const percentage = Math.min(
            100,
            Math.round((count / threshold) * 100),
          );
          const status = m?.status || "HEALTHY";
          const colors = getStatusColor(status);

          return (
            <div
              key={eq.id}
              className={`bg-slate-900 border ${colors.bg} rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all hover:scale-[1.01] hover:border-white/10 shadow-2xl`}
            >
              {/* Card Title & Status Badge */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white leading-tight">
                    {eq.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">
                    {eq.type}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full ${colors.badge}`}
                >
                  {colors.label}
                </span>
              </div>

              {/* Progress Bar & Counter */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">
                    نسبة الاستهلاك
                  </span>
                  <BidiText className="text-white font-black">
                    {percentage}%
                  </BidiText>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors.progress}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 pt-1">
                  <span>
                    الاستخدام الحالي:{" "}
                    <BidiText className="text-slate-300 font-bold">
                      {count}
                    </BidiText>{" "}
                    {unitLabel}
                  </span>
                  <span>
                    الحد الأقصى:{" "}
                    <BidiText className="text-slate-300 font-bold">
                      {threshold}
                    </BidiText>{" "}
                    {unitLabel}
                  </span>
                </div>
              </div>

              {/* Timing Metadata */}
              <div className="border-t border-white/5 pt-4 grid grid-cols-2 gap-4 text-xs text-slate-500">
                <div>
                  <span className="block text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-0.5">
                    آخر صيانة
                  </span>
                  <span className="text-slate-300 font-semibold">
                    {m?.lastMaintenanceDate
                      ? new Date(m.lastMaintenanceDate).toLocaleDateString(
                          "ar-IQ",
                        )
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-0.5">
                    وحدة التتبع
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {unitLabel}
                  </span>
                </div>
              </div>

              {/* Reset Maintenance Form Action */}
              <form
                action={async () => {
                  "use server";
                  await resetMaintenanceAction(eq.id);
                }}
                className="pt-2"
              >
                <button
                  type="submit"
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <PenTool className="w-4 h-4 text-slate-400" />
                  تسجيل صيانة وإعادة تهيئة العداد
                </button>
              </form>
            </div>
          );
        })}

        {equipmentList.length === 0 && (
          <div className="col-span-full py-16 bg-slate-900 border border-white/5 rounded-3xl text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-500 text-sm">
              لا توجد معدات مسجلة في هذا المصنع.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
