import Link from "next/link";
import dynamic from "next/dynamic";
const MixTable = dynamic(() => import("@/components/lab/MixTable"), {
  loading: () => <p>Loading Mix Table...</p>,
});
import { getMixDesigns, getArchivedMixDesigns } from "@/app/actions/lab";
import { Icons } from "@/components/ui/Icons";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionary";

import { getCurrentLanguage } from "@/lib/locale";
import MixSettingsWrapper from "./MixSettingsWrapper";
import {
  getLabSettings,
  getCompanyLabStandards,
} from "@/app/actions/lab-settings";
import { MixDesignCalculator } from "@/components/lab/MixDesignCalculator";

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function MixDesignsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const isArchive = searchParams.view === "archive";

  // Decide which data to fetch based on view
  const mixes = isArchive
    ? await getArchivedMixDesigns()
    : await getMixDesigns();

  const user = await getCurrentUser();
  // Safe permission check
  const canCreate = [
    "LAB_ENGINEER",
    "LAB_MANAGER",
    "SYSTEM_OWNER",
    "COMPANY_ADMIN",
  ].some((role) => user?.role === role);

  const lang = await getCurrentLanguage();
  const dict = getDictionary(lang);

  const isSettings = searchParams.view === "settings";

  if (isSettings) {
    if (user?.role === "LAB_TECH" || user?.role === "LAB_TECHNICIAN") {
      return (
        <div className="p-6 text-red-500 font-bold text-center">
          غير مصرح بالوصول إلى إعدادات المختبر
        </div>
      );
    }
    const [settingsRes, standardsRes] = await Promise.all([
      getLabSettings(),
      getCompanyLabStandards(),
    ]);
    return (
      <MixSettingsWrapper
        initialSettings={settingsRes.data || {}}
        standards={standardsRes.data || []}
      />
    );
  }

  const isCalculator = searchParams.view === "calculator";
  if (isCalculator) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="mb-4">
          <Link
            href="/system/lab/mix-designs"
            className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <Icons.ArrowRight className="w-4 h-4" />
            العودة للخلطات
          </Link>
        </div>
        <MixDesignCalculator />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {dict.lab.mix_designs.title}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isArchive
              ? dict.lab.mix_designs.archived
              : `${mixes.length} خلطة متاحة`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isArchive ? (
            <Link
              href="/system/lab/mix-designs"
              prefetch={false}
              className="group bg-slate-800 text-white border border-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-700 hover:border-slate-500 active:scale-95 transition-all duration-300 shadow-lg"
            >
              <Icons.FlaskConical className="w-4 h-4 text-emerald-400" />
              {dict.lab.mix_designs.active}
            </Link>
          ) : (
            <>
              <Link
                href="?view=calculator"
                className="group bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-600 hover:text-white active:scale-95 transition-all duration-300 shadow-sm"
              >
                <Icons.FlaskConical className="w-4 h-4" />
                حاسبة التصميم
              </Link>
              <Link
                href="?view=archive"
                prefetch={false}
                className="group bg-amber-500/15 text-amber-400 border border-amber-500/30 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-amber-500 hover:text-white hover:border-amber-500 active:scale-95 transition-all duration-300 shadow-sm"
              >
                <Icons.Archive className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                {dict.lab.mix_designs.archive}
              </Link>
            </>
          )}

          {canCreate && !isArchive && (
            <Link
              href="/system/lab/mix-designs/create"
              className="group relative bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] border border-primary/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <Icons.Plus className="w-4 h-4 z-10 relative" />
              <span className="z-10 relative">
                {dict.lab.mix_designs.create_btn}
              </span>
            </Link>
          )}

          <Link
            href="?view=settings"
            className="p-2.5 rounded-xl bg-slate-800 border border-white/5 text-slate-400 hover:text-white hover:border-white/10 transition-all active:scale-95 shadow-lg"
            title="إعدادات الخلطات"
          >
            <Icons.Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <MixTable
        mixes={mixes as any}
        dict={dict.lab.mix_designs}
        lang={lang}
        isArchive={isArchive}
        userRole={user?.role}
      />
    </div>
  );
}
