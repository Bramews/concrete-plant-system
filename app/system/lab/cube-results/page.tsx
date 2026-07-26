import { getCubeTests, getActiveOrders } from "@/app/actions/lab";
import {
  getLabStandards,
  getLabPreferences,
} from "@/app/actions/lab/standards";
import { getCurrentUser } from "@/lib/auth";
import CubeSettingsWrapper from "./CubeSettingsWrapper";
import {
  getLabSettings,
  getCompanyLabStandards,
} from "@/app/actions/lab-settings";
import { CubeResultClient } from "./CubeResultClient";

import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CubeResultsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  const companyId = user?.companyId;

  if (!user || !user.companyId) return <div>Unauthorized</div>;

  const role = (
    typeof user?.role === "string"
      ? user?.role
      : (user?.role as { name?: string })?.name
  ) as string;

  const isSettings = searchParams.view === "settings";

  if (isSettings) {
    if (role === "LAB_TECH" || role === "LAB_TECHNICIAN") {
      return (
        <div className="p-6 text-red-500 font-bold text-center">
          غير مصرح بالوصول إلى إعدادات الفحوصات
        </div>
      );
    }
    const [settingsRes, standardsRes] = await Promise.all([
      getLabSettings(),
      getCompanyLabStandards(),
    ]);
    return (
      <CubeSettingsWrapper
        initialSettings={settingsRes.data || {}}
        standards={standardsRes.data || []}
      />
    );
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Locale) || "ar";
  const dict = getDictionary(lang);

  const [tests, orders, standards, preferences, settingsRes] =
    await Promise.all([
      getCubeTests(),
      getActiveOrders(),
      getLabStandards(),
      companyId ? getLabPreferences(companyId) : Promise.resolve({}),
      getLabSettings(),
    ]);

  return (
    <div>
      <CubeResultClient
        tests={tests}
        orders={orders}
        userRole={role}
        standards={standards}
        preferences={preferences}
        initialSettings={settingsRes.data || {}}
        dict={dict.lab}
      />
    </div>
  );
}
