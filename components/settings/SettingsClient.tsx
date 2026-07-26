"use client";

import { Icons } from "@/components/ui/Icons";
import { usePreferences } from "@/context/PreferenceContext";
import { MaterialsSettings } from "./MaterialsSettings";

export function SettingsClient({
  dict,
  initialSettings,
  initialBackups,
}: {
  dict: any;
  initialSettings: any;
  initialBackups: any[];
}) {
  const { preferences, updatePreference } = usePreferences();

  const setTheme = (theme: string) => {
    updatePreference("theme", theme);
  };

  const setMode = (mode: "dark" | "light") => {
    // Current schema doesn't have mode, we could add it or use theme
    // For now, these buttons are placeholders for UI consistency
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">
          {dict.settings.title}
        </h1>
        <p className="text-muted-foreground">{dict.settings.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* APPEARANCE CARD */}
        <section className="soft-card p-8 space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
              <Icons.Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {dict.settings.appearance.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {dict.settings.appearance.desc}
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">
              {dict.settings.appearance.theme_mode}
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setMode("dark")}
                title={dict.settings.appearance.dark}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all border-cyan-500/50 bg-cyan-500/10 text-white`}
              >
                <Icons.Moon className="w-5 h-5" />
                <span>{dict.settings.appearance.dark}</span>
              </button>
              <button
                onClick={() => setMode("light")}
                title={dict.settings.appearance.light}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all border-white/10 bg-white/5 text-slate-400 opacity-50`}
              >
                <Icons.Sun className="w-5 h-5" />
                <span>{dict.settings.appearance.light}</span>
              </button>
            </div>
          </div>

          {/* Color Palette / Theme Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">
              {dict.settings.appearance.accent_color}
            </h3>
            <div className="flex gap-4">
              {[
                {
                  id: "neon",
                  color: "bg-green-500",
                  label: dict.settings.appearance.themes.neon,
                },
                {
                  id: "monolith",
                  color: "bg-black",
                  label: dict.settings.appearance.themes.monolith,
                },
                {
                  id: "executive",
                  color: "bg-purple-600",
                  label: dict.settings.appearance.themes.executive,
                },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`w-12 h-12 rounded-full ${theme.color} ring-offset-2 ring-offset-slate-900 transition-all hover:scale-110 flex items-center justify-center ${
                    preferences.theme === theme.id
                      ? "ring-2 ring-white scale-110"
                      : "scale-100"
                  }`}
                  title={theme.label}
                >
                  {preferences.theme === theme.id && (
                    <Icons.Check className="w-6 h-6 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* BACKUP CARD */}
        <section className="soft-card p-8 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Icons.Box className="w-32 h-32" />
          </div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Icons.Box className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {dict.settings.backup.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {dict.settings.backup.desc}
              </p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                {dict.settings.backup.path}
              </label>
              <input
                type="text"
                value="backups_"
                readOnly
                title={dict.settings.backup.path}
                className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-400 font-mono"
              />
            </div>

            <button className="soft-btn w-full justify-center">
              {dict.settings.backup.create_now}
            </button>
          </div>

          <div className="space-y-4 relative z-10 border-t border-white/5 pt-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {dict.settings.backup.recent}
            </h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <span className="text-sm font-bold">ZIP</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">
                    neon-lab_2025-12...
                  </span>
                  <span className="text-sm font-bold text-slate-500">
                    10 mins ago • 14MB
                  </span>
                </div>
              </div>
              <button className="text-sm font-bold text-cyan-400 hover:text-cyan-300 underline">
                {dict.settings.backup.download}
              </button>
            </div>
          </div>
        </section>

        {/* MATERIALS CARD */}
        <MaterialsSettings lang="ar" />
      </div>
    </div>
  );
}
