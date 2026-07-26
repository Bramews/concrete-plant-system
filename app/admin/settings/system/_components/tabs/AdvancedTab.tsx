"use client";

import { DictionaryType } from "@/lib/dictionary.base";

interface AdvancedTabProps {
  dict: DictionaryType;
  settings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
  onUpdate: (key: string, value: string) => void;
}

export function AdvancedTab({ dict, settings, onUpdate }: AdvancedTabProps) {
  return (
    <div className="space-y-8">
      {/* Debug & Logging */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.advanced.debug}
        </h2>
        <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
          <span className="text-sm font-semibold text-slate-300">
            {dict.settings.system.advanced.debug_mode}
          </span>
          <input
            type="checkbox"
            checked={settings.debug_mode?.value === "true"}
            onChange={(e) => {
              onUpdate("debug_mode", e.target.checked.toString());
            }}
            disabled={settings.debug_mode?.locked}
            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="log_level"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.advanced.log_level}
            </label>
            <select
              id="log_level"
              value={settings.log_level?.value || "ERROR"}
              onChange={(e) => {
                onUpdate("log_level", e.target.value);
              }}
              disabled={settings.log_level?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="log_retention_days"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.advanced.log_retention_days}
            </label>
            <input
              id="log_retention_days"
              type="number"
              value={settings.log_retention_days?.value || "30"}
              onChange={(e) => onUpdate("log_retention_days", e.target.value)}
              min={1}
              disabled={settings.log_retention_days?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Audit */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.advanced.audit}
        </h2>
        <div>
          <label
            htmlFor="audit_log_retention_days"
            className="block text-sm font-semibold text-slate-300 mb-2"
          >
            {dict.settings.system.advanced.audit_log_retention_days}
          </label>
          <input
            id="audit_log_retention_days"
            type="number"
            value={settings.audit_log_retention_days?.value || "90"}
            onChange={(e) =>
              onUpdate("audit_log_retention_days", e.target.value)
            }
            min={1}
            disabled={settings.audit_log_retention_days?.locked}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Health Checks */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.advanced.health}
        </h2>
        <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
          <span className="text-sm font-semibold text-slate-300">
            {dict.settings.system.advanced.enable_health_checks}
          </span>
          <input
            type="checkbox"
            checked={settings.enable_health_checks?.value === "true"}
            onChange={(e) => {
              onUpdate("enable_health_checks", e.target.checked.toString());
            }}
            disabled={settings.enable_health_checks?.locked}
            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
        {settings.enable_health_checks?.value === "true" && (
          <div>
            <label
              htmlFor="health_check_interval"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.advanced.health_check_interval}
            </label>
            <input
              id="health_check_interval"
              type="number"
              value={settings.health_check_interval?.value || "5"}
              onChange={(e) =>
                onUpdate("health_check_interval", e.target.value)
              }
              min={1}
              disabled={settings.health_check_interval?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}
      </div>
    </div>
  );
}
