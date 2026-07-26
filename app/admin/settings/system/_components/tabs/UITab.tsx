"use client";

import { DictionaryType } from "@/lib/dictionary.base";

interface UITabProps {
  dict: DictionaryType;
  settings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
  onUpdate: (key: string, value: string) => void;
}

export function UITab({ dict, settings, onUpdate }: UITabProps) {
  return (
    <div className="space-y-8">
      {/* Theme */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.ui.theme}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.ui.force_dark_mode}
            </span>
            <input
              type="checkbox"
              checked={settings.force_dark_mode?.value === "true"}
              onChange={(e) => {
                onUpdate("force_dark_mode", e.target.checked.toString());
              }}
              disabled={settings.force_dark_mode?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.ui.allow_theme_switching}
            </span>
            <input
              type="checkbox"
              checked={settings.allow_theme_switching?.value === "true"}
              onChange={(e) => {
                onUpdate("allow_theme_switching", e.target.checked.toString());
              }}
              disabled={settings.allow_theme_switching?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
        </div>
      </div>

      {/* Branding */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.ui.branding}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.ui.footer_text}
            </label>
            <input
              type="text"
              value={settings.footer_text?.value || ""}
              onChange={(e) => onUpdate("footer_text", e.target.value)}
              placeholder="Powered by..."
              disabled={settings.footer_text?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.ui.copyright_text}
            </label>
            <input
              type="text"
              value={settings.copyright_text?.value || ""}
              onChange={(e) => onUpdate("copyright_text", e.target.value)}
              placeholder="© 2026 Company Name"
              disabled={settings.copyright_text?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Help & Support */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.ui.help}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.ui.help_link_url}
            </label>
            <input
              type="url"
              value={settings.help_link_url?.value || ""}
              onChange={(e) => onUpdate("help_link_url", e.target.value)}
              placeholder="https://help.example.com"
              disabled={settings.help_link_url?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.ui.documentation_url}
            </label>
            <input
              type="url"
              value={settings.documentation_url?.value || ""}
              onChange={(e) => onUpdate("documentation_url", e.target.value)}
              placeholder="https://docs.example.com"
              disabled={settings.documentation_url?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
