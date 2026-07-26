"use client";

import { DictionaryType } from "@/lib/dictionary.base";

interface SecurityTabProps {
  dict: DictionaryType;
  settings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
  onUpdate: (key: string, value: string) => void;
}

export function SecurityTab({ dict, settings, onUpdate }: SecurityTabProps) {
  return (
    <div className="space-y-8">
      {/* Session Management */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.security.session}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Session Duration */}
          <div>
            <label
              htmlFor="session-duration"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.security.session_duration}
            </label>
            <input
              id="session-duration"
              type="number"
              value={settings.session_duration?.value || "120"}
              onChange={(e) => onUpdate("session_duration", e.target.value)}
              min={1}
              disabled={settings.session_duration?.locked}
              dir="ltr"
              lang="en"
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-left"
            />
          </div>

          {/* Max Sessions */}
          <div>
            <label
              htmlFor="max-sessions"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.security.max_sessions_per_user}
            </label>
            <input
              id="max-sessions"
              type="number"
              value={settings.max_sessions_per_user?.value || "3"}
              onChange={(e) =>
                onUpdate("max_sessions_per_user", e.target.value)
              }
              min={1}
              max={10}
              disabled={settings.max_sessions_per_user?.locked}
              dir="ltr"
              lang="en"
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-left"
            />
          </div>

          {/* Remember Me Duration */}
          <div>
            <label
              htmlFor="remember-me-duration"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.security.remember_me_duration ||
                "Remember Me Duration"}
            </label>
            <div className="flex gap-2">
              <input
                id="remember-me-duration"
                type="number"
                value={settings.remember_me_duration?.value || "30"}
                onChange={(e) =>
                  onUpdate("remember_me_duration", e.target.value)
                }
                min={1}
                max={36500} // Increased max for minutes
                disabled={settings.remember_me_duration?.locked}
                dir="ltr"
                lang="en"
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-left"
              />
              <select
                value={settings.remember_me_duration_unit?.value || "days"}
                onChange={(e) =>
                  onUpdate("remember_me_duration_unit", e.target.value)
                }
                disabled={settings.remember_me_duration_unit?.locked}
                aria-label={
                  dict.settings?.system?.security?.remember_me_duration_unit ||
                  "Duration Unit"
                }
                className="w-32 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="days">{dict.common?.days || "Days"}</option>
                <option value="minutes">
                  {dict.common?.minutes || "Minutes"}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Password Policy */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.security.password}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Min Password Length */}
          <div>
            <label
              htmlFor="min-password-length"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.security.min_password_length}
            </label>
            <input
              id="min-password-length"
              type="number"
              value={settings.min_password_length?.value || "8"}
              onChange={(e) => onUpdate("min_password_length", e.target.value)}
              min={6}
              max={32}
              disabled={settings.min_password_length?.locked}
              dir="ltr"
              lang="en"
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-left"
            />
          </div>

          {/* Switches */}
          <div className="space-y-3">
            {/* Require Uppercase */}
            <label
              htmlFor="require-uppercase"
              className="flex items-center justify-between"
            >
              <span className="text-sm font-semibold text-slate-300">
                {dict.settings.system.security.require_uppercase}
              </span>
              <input
                id="require-uppercase"
                type="checkbox"
                checked={settings.require_uppercase?.value === "true"}
                onChange={(e) => {
                  onUpdate("require_uppercase", e.target.checked.toString());
                }}
                disabled={settings.require_uppercase?.locked}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>

            {/* Require Numbers */}
            <label
              htmlFor="require-numbers"
              className="flex items-center justify-between"
            >
              <span className="text-sm font-semibold text-slate-300">
                {dict.settings.system.security.require_numbers}
              </span>
              <input
                id="require-numbers"
                type="checkbox"
                checked={settings.require_numbers?.value === "true"}
                onChange={(e) => {
                  onUpdate("require_numbers", e.target.checked.toString());
                }}
                disabled={settings.require_numbers?.locked}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Authentication */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.security.auth}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Require 2FA */}
          <label
            htmlFor="require-2fa"
            className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
          >
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.security.require_2fa}
            </span>
            <input
              id="require-2fa"
              type="checkbox"
              checked={settings.require_2fa?.value === "true"}
              onChange={(e) => {
                onUpdate("require_2fa", e.target.checked.toString());
              }}
              disabled={settings.require_2fa?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>

          {/* Login Attempts Limit */}
          <div>
            <label
              htmlFor="login-attempts"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              {dict.settings.system.security.login_attempts_limit}
            </label>
            <input
              id="login-attempts"
              type="number"
              value={settings.login_attempts_limit?.value || "5"}
              onChange={(e) => onUpdate("login_attempts_limit", e.target.value)}
              min={3}
              max={10}
              disabled={settings.login_attempts_limit?.locked}
              dir="ltr"
              lang="en"
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-left"
            />
          </div>
        </div>
      </div>

      {/* Encryption */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.security.encryption}
        </h2>
        <div>
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.security.force_https}
            </span>
            <input
              type="checkbox"
              checked={settings.force_https?.value === "true"}
              onChange={(e) => {
                onUpdate("force_https", e.target.checked.toString());
              }}
              disabled={settings.force_https?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
