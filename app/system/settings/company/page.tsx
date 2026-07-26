import { getCompanySettings } from "@/app/actions/companies";
import { getCurrentUser } from "@/lib/auth";
import { CompanySettingsClient } from "./CompanySettingsClient";
import { redirect } from "next/navigation";

export default async function CompanySettingsPage() {
  const user = await getCurrentUser();
  if (!user?.companyId) redirect("/system/settings/profile");

  const { companySettings, systemSettings } = await getCompanySettings();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Company Configuration</h2>
        <p className="text-muted-foreground text-sm">
          Manage branding, localization, and business rules.
        </p>
      </div>
      <CompanySettingsClient
        companySettings={companySettings}
        systemSettings={systemSettings}
      />
    </div>
  );
}
