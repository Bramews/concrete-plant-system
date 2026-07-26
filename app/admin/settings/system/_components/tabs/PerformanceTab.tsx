"use client";

import { DictionaryType } from "@/lib/dictionary.base";

interface PerformanceTabProps {
  dict: DictionaryType;
  settings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
  onUpdate: (key: string, value: string) => void;
}

export function PerformanceTab({
  dict,
  settings,
  onUpdate,
}: PerformanceTabProps) {
  return (
    <div className="space-y-8">
      {/* Cache */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.performance.cache}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.performance.enable_cache}
            </span>
            <input
              type="checkbox"
              checked={settings.enable_cache?.value === "true"}
              onChange={(e) => {
                onUpdate("enable_cache", e.target.checked.toString());
              }}
              disabled={settings.enable_cache?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.performance.cache_ttl}
            </label>
            <input
              type="number"
              value={settings.cache_ttl?.value || "3600"}
              onChange={(e) => onUpdate("cache_ttl", e.target.value)}
              min={1}
              disabled={settings.cache_ttl?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Database */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.performance.database}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.performance.query_timeout}
            </label>
            <input
              type="number"
              value={settings.query_timeout?.value || "30"}
              onChange={(e) => onUpdate("query_timeout", e.target.value)}
              min={1}
              disabled={settings.query_timeout?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.performance.max_query_results}
            </label>
            <input
              type="number"
              value={settings.max_query_results?.value || "1000"}
              onChange={(e) => onUpdate("max_query_results", e.target.value)}
              min={1}
              disabled={settings.max_query_results?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Uploads + Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">
            {dict.settings.system.performance.uploads}
          </h2>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.performance.max_upload_size}
            </label>
            <input
              type="number"
              value={settings.max_upload_size?.value || "10"}
              onChange={(e) => onUpdate("max_upload_size", e.target.value)}
              min={1}
              disabled={settings.max_upload_size?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">
            {dict.settings.system.performance.limits}
          </h2>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.performance.request_timeout}
            </label>
            <input
              type="number"
              value={settings.request_timeout?.value || "30"}
              onChange={(e) => onUpdate("request_timeout", e.target.value)}
              min={1}
              disabled={settings.request_timeout?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.performance.memory_limit}
            </label>
            <input
              type="number"
              value={settings.memory_limit?.value || "512"}
              onChange={(e) => onUpdate("memory_limit", e.target.value)}
              min={128}
              disabled={settings.memory_limit?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
