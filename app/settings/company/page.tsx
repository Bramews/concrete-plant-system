import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsSection, SettingInput } from "./components";
import { ImportExportButtons } from "./ImportExportButtons";

// We need to know if it's locked at the System level to display the Lock UI.
// The service layer `getCompanySetting` returns the effective value.
// Use helper to fetch metadata.

async function getSettingMeta(companyId: number, key: string) {
  // 1. Check System Lock
  const sys = await prisma.systemSetting.findUnique({ where: { key } });
  if (sys?.locked) return { value: sys.value, locked: true, source: "SYSTEM" };

  // 2. Check Company Value
  const comp = await prisma.companySetting.findUnique({
    where: { companyId_key: { companyId, key } },
  });

  return {
    value: comp?.value || "",
    locked: false,
    source: "COMPANY",
  };
}

export default async function CompanySettingsPage() {
  const user = await getCurrentUser();
  if (!user?.companyId) redirect("/login");

  // Auth (Company Admin)
  // Auth (Company Admin)
  if (user.role !== "COMPANY_ADMIN" && user.role !== "SYSTEM_OWNER") {
    return (
      <div className="p-8 text-red-600">
        Unauthorized: Company Admin access required.
      </div>
    );
  }

  const cid = user.companyId;

  // Fetch Settings Meta (Value + Lock Status)
  const meta = {
    TIMEZONE: await getSettingMeta(cid, "TIMEZONE"),
    LANGUAGE: await getSettingMeta(cid, "LANGUAGE"),
    CURRENCY: await getSettingMeta(cid, "CURRENCY"),
    BRAND_NAME: await getSettingMeta(cid, "BRAND_NAME"),
    BRAND_PRIMARY_COLOR: await getSettingMeta(cid, "BRAND_PRIMARY_COLOR"),
    ALLOW_USER_INVITES: await getSettingMeta(cid, "ALLOW_USER_INVITES"),
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">🏢 Company Settings</h1>
      <p className="text-gray-500 mb-8">
        Manage your organization&apos;s configuration. Some settings may be
        locked by the System Owner.
      </p>

      <SettingsSection title="Localization">
        <SettingInput
          label="Timezone"
          settingKey="TIMEZONE"
          initialValue={meta.TIMEZONE.value}
          locked={meta.TIMEZONE.locked}
        />
        <SettingInput
          label="Language"
          settingKey="LANGUAGE"
          initialValue={meta.LANGUAGE.value}
          locked={meta.LANGUAGE.locked}
        />
        <SettingInput
          label="Currency"
          settingKey="CURRENCY"
          initialValue={meta.CURRENCY.value}
          locked={meta.CURRENCY.locked}
        />
      </SettingsSection>

      <SettingsSection title="Branding">
        <SettingInput
          label="Brand Name"
          settingKey="BRAND_NAME"
          initialValue={meta.BRAND_NAME.value}
          locked={meta.BRAND_NAME.locked}
        />
        <SettingInput
          label="Primary Color"
          type="color"
          settingKey="BRAND_PRIMARY_COLOR"
          initialValue={meta.BRAND_PRIMARY_COLOR.value}
          locked={meta.BRAND_PRIMARY_COLOR.locked}
        />
      </SettingsSection>

      <SettingsSection title="Behavior">
        <SettingInput
          label="Allow User Invites (true/false)"
          settingKey="ALLOW_USER_INVITES"
          initialValue={meta.ALLOW_USER_INVITES.value}
          locked={meta.ALLOW_USER_INVITES.locked}
        />
      </SettingsSection>
    </div>
  );
}
