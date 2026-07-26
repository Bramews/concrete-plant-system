import { requireRole } from "@/lib/auth";
import { AnalyticsDashboard } from "@/app/system/analytics/AnalyticsDashboard";
import { getDictionary } from "@/lib/dictionary";
import { getCurrentLanguage } from "@/lib/locale";
import { getPerformanceData } from "@/app/actions/intelligence";

export default async function PerformancePage() {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);
  const lang = await getCurrentLanguage();
  const dict = getDictionary(lang);
  const data = await getPerformanceData();

  return (
    <div className="p-6">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
          Intelligence / <span className="text-primary">Performance Hub</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          {lang === "ar"
            ? "تحليلات الأداء والذكاء الاصطناعي للمحطة"
            : "Plant performance analytics and AI-driven insights"}
        </p>
      </div>

      <AnalyticsDashboard data={data} />
    </div>
  );
}
