import { requireRole } from "@/lib/auth";
import { FleetMonitor } from "@/app/system/logistics/FleetMonitor";
import { getDictionary } from "@/lib/dictionary";
import { getCurrentLanguage } from "@/lib/locale";
import { getFleetStatus } from "@/app/actions/intelligence";

export default async function LogisticsMonitorPage() {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);
  const lang = await getCurrentLanguage();
  const dict = getDictionary(lang);
  const trucks = await getFleetStatus();

  return (
    <div className="p-6">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
          إدارة <span className="text-primary">الأسطول والتوصيل</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          {lang === "ar"
            ? "رصد الأسطول والتحرك في الوقت الفعلي"
            : "رصد حركة الشاحنات في الوقت الفعلي"}
        </p>
      </div>

      <FleetMonitor initialTrucks={trucks} />
    </div>
  );
}
