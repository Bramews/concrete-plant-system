import { requireRole, getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import ThemeManager from "@/components/settings/ThemeManager";
import { prisma } from "@/lib/prisma";
import MixesPricingManager from "@/components/manager/MixesPricingManager";
import CongestionManager from "@/components/settings/CongestionManager";
import { getUserPreferences } from "@/app/actions/preferences";
import { NetworkSettingsWrapper } from "@/components/settings/NetworkSettingsWrapper";

export default async function ManagerSettingsPage() {
  await requireRole(["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value ||
    cookieStore.get("NEXT_LOCALE")?.value ||
    "ar") as Locale;
  const t = dictionary[lang];

  const user = await getCurrentUser();
  const mixes = user?.companyId
    ? await prisma.mixDesign.findMany({
        where: { companyId: user.companyId, isCurrent: true, deletedAt: null },
        orderBy: { code: "asc" },
      })
    : [];

  const preferences = await getUserPreferences();

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ["congestion_min", "congestion_max"] } },
  });
  const settingsMap = settings.reduce(
    (acc, s) => {
      acc[s.key] = s.value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const congestionMin = parseInt(settingsMap["congestion_min"] || "300");
  const congestionMax = parseInt(settingsMap["congestion_max"] || "800");

  return (
    <div style={{ maxWidth: "1200px" }}>
      <h1 className="page-title">{t.sidebar?.settings || "Settings"}</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Theme Management Section */}
        <ThemeManager initialPrefs={preferences} lang={lang} />

        {/* Congestion Ratios Section */}
        <CongestionManager
          initialMin={congestionMin}
          initialMax={congestionMax}
          lang={lang}
        />

        {/* Mixes Pricing Section */}
        <MixesPricingManager initialMixes={mixes} isRtl={lang === "ar"} />

        {/* Network & Access Control Section */}
        <NetworkSettingsWrapper lang={lang} />
      </div>
    </div>
  );
}
