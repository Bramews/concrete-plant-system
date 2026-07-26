import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import EquipmentHub from "@/components/operator/EquipmentHub";
import SmartFaultLog from "@/components/operator/SmartFaultLog";
import SparePartsTracker from "@/components/operator/SparePartsTracker";
import { getPlcSettings } from "@/app/actions/plc";

export default async function OperatorSettingsPage() {
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

  // Fetch equipment from database
  const DBEquipment = await prisma.equipment.findMany({
    where: { companyId },
    include: {
      maintenanceLogs: {
        orderBy: { date: "desc" },
        take: 3,
      },
    },
    orderBy: { name: "asc" },
  });

  const formattedEquipment = DBEquipment.map((eq) => ({
    id: eq.id,
    name: eq.name,
    type: eq.type,
    status: eq.status,
    hoursRun: eq.hoursRun,
    lastMaintenance: eq.lastMaintenance
      ? eq.lastMaintenance.toISOString().split("T")[0]
      : null,
    nextMaintenance: eq.nextMaintenance
      ? eq.nextMaintenance.toISOString().split("T")[0]
      : null,
    serialNumber: eq.serialNumber,
    maintenanceLogs: eq.maintenanceLogs.map((l) => ({
      id: l.id,
      description: l.description,
      type: l.type,
      cost: l.cost,
      date: l.date.toISOString().split("T")[0],
      technician: l.technician,
    })),
  }));

  // Fetch fault logs
  const DBFaults = await prisma.faultLog.findMany({
    where: { companyId },
    include: {
      equipment: {
        select: { name: true },
      },
    },
    orderBy: { reportedAt: "desc" },
    take: 10,
  });

  const formattedFaults = DBFaults.map((f) => ({
    id: f.id,
    equipmentId: f.equipmentId,
    equipmentName: f.equipment?.name || "معدة غير معروفة",
    title: f.title,
    description: f.description,
    severity: f.severity,
    reportedBy: f.reportedBy,
    reportedAt: f.reportedAt.toISOString().replace("T", " ").substring(0, 16),
    status: f.status,
    resolvedAt: f.resolvedAt
      ? f.resolvedAt.toISOString().replace("T", " ").substring(0, 16)
      : null,
    solution: f.solution,
    cost: f.cost,
  }));

  // Fetch spare parts
  const DBSpareParts = await prisma.sparePart.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  const formattedSpareParts = DBSpareParts.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    quantity: p.quantity,
    reorderPoint: p.reorderPoint,
    unit: p.unit,
    price: p.price,
    supplier: p.supplier,
    supplierPhone: p.supplierPhone,
  }));

  const equipmentOptions = DBEquipment.map((eq) => ({
    id: eq.id,
    name: eq.name,
  }));

  const plcSetting = await getPlcSettings();

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-white/5 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Icons.Settings className="w-7 h-7 text-emerald-400" />
            <span>إعدادات التشغيل ومعدات المحطة</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">
            إدارة صيانة الخلاطات، البلاغات الذكية، قطع الغيار، وإعدادات ربط الـ
            PLC
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-slate-300">
            عنوان الـ PLC:{" "}
            <span className="font-mono text-cyan-400">
              {plcSetting?.ipAddress || "192.168.1.100"}
            </span>
          </span>
        </div>
      </div>

      {/* Equipment Maintenance Hub */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
          <span>🔧 مركز صيانة المعدات والأجهزة</span>
        </h3>
        <EquipmentHub initialEquipment={formattedEquipment} />
      </div>

      {/* Smart Fault Log */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
          <span>🚨 سجل الأعطال والبلاغات الذكية</span>
        </h3>
        <SmartFaultLog
          initialFaults={formattedFaults}
          equipmentOptions={equipmentOptions}
        />
      </div>

      {/* Spare Parts Inventory */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
          <span>📦 مخزن قطع الغيار وقطع الصيانة</span>
        </h3>
        <SparePartsTracker initialParts={formattedSpareParts} />
      </div>
    </div>
  );
}
