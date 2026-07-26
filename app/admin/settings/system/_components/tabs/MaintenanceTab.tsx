"use client";

import { DictionaryType } from "@/lib/dictionary.base";

interface MaintenanceTabProps {
  dict: DictionaryType;
  settings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
  onUpdate: (key: string, value: string) => void;
}

export function MaintenanceTab({
  dict,
  settings,
  onUpdate,
}: MaintenanceTabProps) {
  return (
    <div className="space-y-8">
      {/* Maintenance Mode */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.maintenance.mode}
        </h2>
        <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <span className="text-sm font-semibold text-slate-300">
            {dict.settings.system.maintenance.maintenance_mode_enabled}
          </span>
          <input
            type="checkbox"
            checked={settings.maintenance_mode_enabled?.value === "true"}
            onChange={(e) => {
              onUpdate("maintenance_mode_enabled", e.target.checked.toString());
            }}
            disabled={settings.maintenance_mode_enabled?.locked}
            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            {dict.settings.system.maintenance.maintenance_message}
          </label>
          <textarea
            value={settings.maintenance_message?.value || ""}
            onChange={(e) => onUpdate("maintenance_message", e.target.value)}
            placeholder="نحن نعمل على تحسين النظام. سنعود قريباً..."
            rows={3}
            disabled={settings.maintenance_message?.locked}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
        </div>
      </div>

      {/* System Updates */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.maintenance.updates}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.maintenance.auto_update_enabled}
            </span>
            <input
              type="checkbox"
              checked={settings.auto_update_enabled?.value === "true"}
              onChange={(e) => {
                onUpdate("auto_update_enabled", e.target.checked.toString());
              }}
              disabled={settings.auto_update_enabled?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.maintenance.update_channel}
            </label>
            <select
              value={settings.update_channel?.value || "stable"}
              onChange={(e) => {
                onUpdate("update_channel", e.target.value);
              }}
              disabled={settings.update_channel?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="stable">Stable</option>
              <option value="beta">Beta</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
