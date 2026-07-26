"use client";

import { DictionaryType } from "@/lib/dictionary.base";

interface IntegrationsTabProps {
  dict: DictionaryType;
  settings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
  onUpdate: (key: string, value: string) => void;
}

export function IntegrationsTab({
  dict,
  settings,
  onUpdate,
}: IntegrationsTabProps) {
  return (
    <div className="space-y-8">
      {/* Payment Gateways */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.integrations.payment}
        </h2>
        <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <span className="text-sm font-semibold text-slate-300">
            {dict.settings.system.integrations.stripe_enabled}
          </span>
          <input
            type="checkbox"
            checked={settings.stripe_enabled?.value === "true"}
            onChange={(e) => {
              onUpdate("stripe_enabled", e.target.checked.toString());
            }}
            disabled={settings.stripe_enabled?.locked}
            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
        {settings.stripe_enabled?.value === "true" && (
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.integrations.stripe_public_key}
            </label>
            <input
              type="text"
              value={settings.stripe_public_key?.value || ""}
              onChange={(e) => onUpdate("stripe_public_key", e.target.value)}
              placeholder="pk_test_..."
              disabled={settings.stripe_public_key?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}
      </div>

      {/* Analytics */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.integrations.analytics}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.integrations.google_analytics_id}
            </label>
            <input
              type="text"
              value={settings.google_analytics_id?.value || ""}
              onChange={(e) => onUpdate("google_analytics_id", e.target.value)}
              placeholder="G-XXXXXXXXX"
              disabled={settings.google_analytics_id?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.integrations.enable_analytics_tracking}
            </span>
            <input
              type="checkbox"
              checked={settings.enable_analytics_tracking?.value === "true"}
              onChange={(e) => {
                onUpdate(
                  "enable_analytics_tracking",
                  e.target.checked.toString(),
                );
              }}
              disabled={settings.enable_analytics_tracking?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
        </div>
      </div>

      {/* Third-Party Services */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.integrations.services}
        </h2>
        <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <span className="text-sm font-semibold text-slate-300">
            {dict.settings.system.integrations.enable_sentry}
          </span>
          <input
            type="checkbox"
            checked={settings.enable_sentry?.value === "true"}
            onChange={(e) => {
              onUpdate("enable_sentry", e.target.checked.toString());
            }}
            disabled={settings.enable_sentry?.locked}
            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
        {settings.enable_sentry?.value === "true" && (
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.integrations.sentry_dsn}
            </label>
            <input
              type="text"
              value={settings.sentry_dsn?.value || ""}
              onChange={(e) => onUpdate("sentry_dsn", e.target.value)}
              placeholder="https://..."
              disabled={settings.sentry_dsn?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}
        <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <span className="text-sm font-semibold text-slate-300">
            {dict.settings.system.integrations.enable_slack_integration}
          </span>
          <input
            type="checkbox"
            checked={settings.enable_slack_integration?.value === "true"}
            onChange={(e) => {
              onUpdate("enable_slack_integration", e.target.checked.toString());
            }}
            disabled={settings.enable_slack_integration?.locked}
            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
        {settings.enable_slack_integration?.value === "true" && (
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.integrations.slack_webhook_url}
            </label>
            <input
              type="url"
              value={settings.slack_webhook_url?.value || ""}
              onChange={(e) => onUpdate("slack_webhook_url", e.target.value)}
              placeholder="https://hooks.slack.com/..."
              disabled={settings.slack_webhook_url?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}
      </div>

      {/* Voice Assistant Integration */}
      <div className="space-y-4 pt-6 border-t border-slate-700">
        <h2 className="text-lg font-bold text-white">
          المساعد الصوتي والذكاء الاصطناعي (Gemini)
        </h2>

        <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer">
          <span className="text-sm font-semibold text-slate-300">
            تفعيل المساعد الصوتي على مستوى النظام
          </span>
          <input
            type="checkbox"
            checked={
              settings.voice_assistant_enabled
                ? settings.voice_assistant_enabled.value === "true"
                : true
            }
            onChange={(e) => {
              onUpdate("voice_assistant_enabled", e.target.checked.toString());
            }}
            disabled={settings.voice_assistant_enabled?.locked}
            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>

        {(settings.voice_assistant_enabled
          ? settings.voice_assistant_enabled.value === "true"
          : true) && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">
              Gemini API Key (مفتاح الربط بالذكاء الاصطناعي)
            </label>
            <input
              type="password"
              value={settings.gemini_api_key?.value || ""}
              onChange={(e) => onUpdate("gemini_api_key", e.target.value)}
              placeholder="AIzaSy..."
              disabled={settings.gemini_api_key?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-slate-500">
              سيتم استخدام هذا المفتاح كافتراضي للنظام للرد على الاستعلامات
              العامة والذكية.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
