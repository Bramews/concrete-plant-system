"use client";

import { DictionaryType } from "@/lib/dictionary.base";

interface AccessControlTabProps {
  dict: DictionaryType;
  settings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
  onUpdate: (key: string, value: string) => void;
}

export function AccessControlTab({
  dict,
  settings,
  onUpdate,
}: AccessControlTabProps) {
  return (
    <div className="space-y-8">
      {/* Feature Flags */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.access.features}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              key: "enable_ai_module",
              label: dict.settings.system.access.enable_ai_module,
            },
            {
              key: "enable_analytics",
              label: dict.settings.system.access.enable_analytics,
            },
            {
              key: "enable_reports",
              label: dict.settings.system.access.enable_reports,
            },
            {
              key: "enable_exports",
              label: dict.settings.system.access.enable_exports,
            },
            {
              key: "enable_api_access",
              label: dict.settings.system.access.enable_api_access,
            },
          ].map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-300">
                {label}
              </span>
              <input
                type="checkbox"
                checked={settings[key]?.value === "true"}
                onChange={(e) => {
                  onUpdate(key, e.target.checked.toString());
                }}
                disabled={settings[key]?.locked}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
          ))}
        </div>
      </div>

      {/* API Settings */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.access.api}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.access.api_rate_limit}
            </label>
            <input
              type="number"
              value={settings.api_rate_limit?.value || "60"}
              onChange={(e) => onUpdate("api_rate_limit", e.target.value)}
              min={1}
              disabled={settings.api_rate_limit?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.access.api_max_requests_per_day}
            </label>
            <input
              type="number"
              value={settings.api_max_requests_per_day?.value || "1000"}
              onChange={(e) =>
                onUpdate("api_max_requests_per_day", e.target.value)
              }
              min={1}
              disabled={settings.api_max_requests_per_day?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
