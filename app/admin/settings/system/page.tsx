import { getSystemSettings } from "@/app/actions/system-settings";
import { getServerDictionary } from "@/lib/dictionary.server";
import { SettingsTabs } from "./_components/SettingsTabs";

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  const dict = await getServerDictionary();
  const settings = await getSystemSettings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight">
            {dict.settings.system.title}
          </h1>
          <p className="text-slate-400 text-sm">
            {dict.settings.system.subtitle}
          </p>
        </div>

        {/* Tabs Component */}
        <SettingsTabs dict={dict} initialSettings={settings} />
      </div>
    </div>
  );
}
