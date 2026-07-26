"use client";

import { DictionaryType } from "@/lib/dictionary.base";

interface TenantsTabProps {
  dict: DictionaryType;
  settings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
  onUpdate: (key: string, value: string) => void;
}

export function TenantsTab({ dict, settings, onUpdate }: TenantsTabProps) {
  return (
    <div className="space-y-8">
      {/* Defaults */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.tenants.defaults}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.tenants.default_trial_days}
            </label>
            <input
              type="number"
              value={settings.default_trial_days?.value || "14"}
              onChange={(e) => onUpdate("default_trial_days", e.target.value)}
              min={0}
              disabled={settings.default_trial_days?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.tenants.auto_activate_tenants}
            </span>
            <input
              type="checkbox"
              checked={settings.auto_activate_tenants?.value === "true"}
              onChange={(e) => {
                onUpdate("auto_activate_tenants", e.target.checked.toString());
              }}
              disabled={settings.auto_activate_tenants?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
        </div>
      </div>

      {/* Suspension */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.tenants.suspension}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.tenants.grace_period_days}
            </label>
            <input
              type="number"
              value={settings.grace_period_days?.value || "7"}
              onChange={(e) => onUpdate("grace_period_days", e.target.value)}
              min={0}
              disabled={settings.grace_period_days?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.tenants.auto_suspend_on_payment_failure}
            </span>
            <input
              type="checkbox"
              checked={
                settings.auto_suspend_on_payment_failure?.value === "true"
              }
              onChange={(e) => {
                onUpdate(
                  "auto_suspend_on_payment_failure",
                  e.target.checked.toString(),
                );
              }}
              disabled={settings.auto_suspend_on_payment_failure?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
        </div>
      </div>

      {/* Domain Management + Cleanup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">
            {dict.settings.system.tenants.domain}
          </h2>
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.tenants.allow_custom_domains}
            </span>
            <input
              type="checkbox"
              checked={settings.allow_custom_domains?.value === "true"}
              onChange={(e) => {
                onUpdate("allow_custom_domains", e.target.checked.toString());
              }}
              disabled={settings.allow_custom_domains?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
          {settings.allow_custom_domains?.value === "true" && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {dict.settings.system.tenants.max_domains_per_tenant}
              </label>
              <input
                type="number"
                value={settings.max_domains_per_tenant?.value || "3"}
                onChange={(e) =>
                  onUpdate("max_domains_per_tenant", e.target.value)
                }
                min={1}
                disabled={settings.max_domains_per_tenant?.locked}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">
            {dict.settings.system.tenants.cleanup}
          </h2>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.tenants.auto_delete_suspended_after_days}
            </label>
            <input
              type="number"
              value={settings.auto_delete_suspended_after_days?.value || "90"}
              onChange={(e) =>
                onUpdate("auto_delete_suspended_after_days", e.target.value)
              }
              min={0}
              disabled={settings.auto_delete_suspended_after_days?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
