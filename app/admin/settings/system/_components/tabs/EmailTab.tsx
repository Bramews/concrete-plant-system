"use client";

import { useState, useTransition } from "react";
import {
  updateSystemSetting,
  sendTestEmail,
} from "@/app/actions/system-settings";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { DictionaryType } from "@/lib/dictionary.base";

interface EmailTabProps {
  dict: DictionaryType;
  settings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
  onUpdate: (key: string, value: string) => void;
}

export function EmailTab({ dict, settings, onUpdate }: EmailTabProps) {
  const [isPending, startTransition] = useTransition();
  const [isTestEmailPending, setIsTestEmailPending] = useState(false);

  const [smtpHost, setSmtpHost] = useState(settings.smtp_host?.value || "");
  const [smtpPort, setSmtpPort] = useState(settings.smtp_port?.value || "587");
  const [smtpUsername, setSmtpUsername] = useState(
    settings.smtp_username?.value || "",
  );
  const [smtpFromEmail, setSmtpFromEmail] = useState(
    settings.smtp_from_email?.value || "",
  );
  const [smtpFromName, setSmtpFromName] = useState(
    settings.smtp_from_name?.value || "",
  );

  const [notifyOnNewTenant, setNotifyOnNewTenant] = useState(
    settings.notify_on_new_tenant?.value === "true",
  );
  const [notifyOnPayment, setNotifyOnPayment] = useState(
    settings.notify_on_payment?.value === "true",
  );
  const [notifyOnError, setNotifyOnError] = useState(
    settings.notify_on_critical_error?.value === "true",
  );

  const [enableEmail, setEnableEmail] = useState(
    settings.enable_email_notifications?.value === "true",
  );
  const [enableSMS, setEnableSMS] = useState(
    settings.enable_sms_notifications?.value === "true",
  );
  const [webhookUrl, setWebhookUrl] = useState(
    settings.webhook_url?.value || "",
  );

  const handleSave = (key: string, value: string) => {
    startTransition(async () => {
      const result = await updateSystemSetting(key, value);
      if (result.success) {
        toast.success("تم حفظ الإعداد");
      } else {
        toast.error(result.error || "فشل حفظ الإعداد");
      }
    });
  };

  const handleTestEmail = async () => {
    if (!smtpFromEmail) {
      toast.error("الرجاء إدخال بريد الإرسال أولاً");
      return;
    }

    setIsTestEmailPending(true);
    const result = await sendTestEmail(smtpFromEmail);
    setIsTestEmailPending(false);

    if (result.success) {
      toast.success("تم إرسال البريد التجريبي بنجاح");
    } else {
      toast.error(result.error || "فشل إرسال البريد");
    }
  };

  return (
    <div className="space-y-8">
      {/* SMTP Configuration */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.email.smtp}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SMTP Host */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.email.smtp_host}
            </label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              onBlur={() => handleSave("smtp_host", smtpHost)}
              placeholder="smtp.gmail.com"
              disabled={settings.smtp_host?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* SMTP Port */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.email.smtp_port}
            </label>
            <input
              type="number"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              onBlur={() => handleSave("smtp_port", smtpPort)}
              disabled={settings.smtp_port?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* SMTP Username */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.email.smtp_username}
            </label>
            <input
              type="text"
              value={smtpUsername}
              onChange={(e) => setSmtpUsername(e.target.value)}
              onBlur={() => handleSave("smtp_username", smtpUsername)}
              disabled={settings.smtp_username?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* From Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.email.smtp_from_email}
            </label>
            <input
              type="email"
              value={smtpFromEmail}
              onChange={(e) => setSmtpFromEmail(e.target.value)}
              onBlur={() => handleSave("smtp_from_email", smtpFromEmail)}
              placeholder="noreply@example.com"
              disabled={settings.smtp_from_email?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* From Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.email.smtp_from_name}
            </label>
            <input
              type="text"
              value={smtpFromName}
              onChange={(e) => setSmtpFromName(e.target.value)}
              onBlur={() => handleSave("smtp_from_name", smtpFromName)}
              placeholder="System Admin"
              disabled={settings.smtp_from_name?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Test Email Button */}
          <div className="flex items-end">
            <button
              onClick={handleTestEmail}
              disabled={isTestEmailPending || !smtpFromEmail}
              className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestEmailPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {dict.settings.system.email.test_email}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* System Notifications */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.email.notifications}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* New Tenant */}
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.email.notify_on_new_tenant}
            </span>
            <input
              type="checkbox"
              checked={notifyOnNewTenant}
              onChange={(e) => {
                setNotifyOnNewTenant(e.target.checked);
                handleSave("notify_on_new_tenant", e.target.checked.toString());
              }}
              disabled={settings.notify_on_new_tenant?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>

          {/* Payment */}
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.email.notify_on_payment}
            </span>
            <input
              type="checkbox"
              checked={notifyOnPayment}
              onChange={(e) => {
                setNotifyOnPayment(e.target.checked);
                handleSave("notify_on_payment", e.target.checked.toString());
              }}
              disabled={settings.notify_on_payment?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>

          {/* Critical Error */}
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.email.notify_on_critical_error}
            </span>
            <input
              type="checkbox"
              checked={notifyOnError}
              onChange={(e) => {
                setNotifyOnError(e.target.checked);
                handleSave(
                  "notify_on_critical_error",
                  e.target.checked.toString(),
                );
              }}
              disabled={settings.notify_on_critical_error?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {dict.settings.system.email.channels}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Notifications */}
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.email.enable_email_notifications}
            </span>
            <input
              type="checkbox"
              checked={enableEmail}
              onChange={(e) => {
                setEnableEmail(e.target.checked);
                handleSave(
                  "enable_email_notifications",
                  e.target.checked.toString(),
                );
              }}
              disabled={settings.enable_email_notifications?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>

          {/* SMS Notifications */}
          <label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <span className="text-sm font-semibold text-slate-300">
              {dict.settings.system.email.enable_sms_notifications}
            </span>
            <input
              type="checkbox"
              checked={enableSMS}
              onChange={(e) => {
                setEnableSMS(e.target.checked);
                handleSave(
                  "enable_sms_notifications",
                  e.target.checked.toString(),
                );
              }}
              disabled={settings.enable_sms_notifications?.locked}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>

          {/* Webhook URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {dict.settings.system.email.webhook_url}
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              onBlur={() => handleSave("webhook_url", webhookUrl)}
              placeholder="https://your-webhook.com/endpoint"
              disabled={settings.webhook_url?.locked}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
