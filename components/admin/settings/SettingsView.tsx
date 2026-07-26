"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { usePreferences } from "@/context/PreferenceContext";
import { Icons } from "@/components/ui/Icons";
import { SystemIdentityForm } from "@/components/admin/settings/SystemIdentityForm";

interface SettingsViewProps {
  initialSettings: Record<string, string>;
}

export function SettingsView({ initialSettings }: SettingsViewProps) {
  const { t } = usePreferences();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Icons.Settings className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t.settings.title}
          </h1>
          <p className="text-muted-foreground">{t.settings.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Identity Section (New) */}
        <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Icons.Factory className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {t.settings.system.general.title || "System Identity"}
              </h2>
              <p className="text-sm font-bold text-muted-foreground">
                {t.settings.system.general.desc ||
                  "Customize your system branding"}
              </p>
            </div>
          </div>
          <SystemIdentityForm initialSettings={initialSettings} />
        </div>

        {/* Appearance Section */}
        <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <Icons.Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">{t.settings.appearance.title}</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
              <div className="space-y-1">
                <div className="font-medium">
                  {t.settings.appearance.theme_mode}
                </div>
                <div className="text-sm font-bold text-muted-foreground">
                  {t.settings.appearance.toggle_mode}
                </div>
              </div>
              <ThemeSwitcher />
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <Icons.Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">{t.settings.language.title}</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
              <div className="space-y-1">
                <div className="font-medium">{t.settings.language.title}</div>
                <div className="text-sm font-bold text-muted-foreground">
                  {t.settings.language.desc}
                </div>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* System Info Section */}
        <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <Icons.Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">{t.sidebar.system_title}</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
              <div className="space-y-1">
                <div className="font-medium">
                  {t.sidebar.status || "Status"}
                </div>
                <div className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t.sidebar.connected || "Connected"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
              <div className="space-y-1">
                <div className="font-medium">
                  {t.sidebar.version || "Version"}
                </div>
                <div className="text-sm font-bold text-muted-foreground font-mono">
                  v3.0 — Modern Glass
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
