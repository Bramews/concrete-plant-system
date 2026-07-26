import { getSystemSettings } from "@/app/actions/system-settings";
import { getCurrentUser } from "@/lib/auth";
import { SystemSettingsClient } from "./SystemSettingsClient";
import { redirect } from "next/navigation";

interface Setting {
  key: string;
  value: string;
  locked: boolean;
}

export default async function SystemSettingsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "SYSTEM_OWNER") {
    redirect("/system/settings/profile");
  }

  const settingsMap = await getSystemSettings();
  const settings: Setting[] = Object.entries(settingsMap).map(
    ([key, data]) => ({
      key,
      value: data.value,
      locked: data.locked,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
        <div className="p-2 bg-red-500 text-white rounded-lg">
          {/* Using a generic icon if ShieldAlert not available, trying Shield */}
          <span className="font-black text-xl">!</span>
        </div>
        <div>
          <h3 className="font-bold text-red-700">System Owner Zone</h3>
          <p className="text-sm font-bold text-red-600/80">
            Settings changed here affect ALL tenants globally. Use with caution.
          </p>
        </div>
      </div>

      <SystemSettingsClient initialSettings={settings} />
    </div>
  );
}
