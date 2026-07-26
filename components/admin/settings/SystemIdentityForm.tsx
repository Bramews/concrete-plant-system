"use client";

import { useState, useTransition } from "react";
import { updateSystemSettings } from "@/app/actions/settings";
import { Icons } from "@/components/ui/Icons";
import { toast } from "sonner";
import { usePreferences } from "@/context/PreferenceContext";

interface SystemIdentityFormProps {
  initialSettings: Record<string, string>;
}

export function SystemIdentityForm({
  initialSettings,
}: SystemIdentityFormProps) {
  const { t } = usePreferences();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    system_name: initialSettings.system_name || "",
    system_title: initialSettings.system_title || "",
    logo_url: initialSettings.logo_url || "",
    logo_bg: initialSettings.logo_bg || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSystemSettings(formData);
      if (result.success) {
        toast.success(t.common?.save || "Saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t.settings.system.general.system_name || "اسم النظام"}
          </label>
          <input
            type="text"
            value={formData.system_name}
            onChange={(e) =>
              setFormData({ ...formData, system_name: e.target.value })
            }
            className="w-full p-2 rounded-lg bg-background border border-border"
            placeholder="Neon Lab"
          />
          <p className="text-sm font-bold text-muted-foreground">
            الاسم الذي سيظهر في أعلى القائمة الجانبية وفي ترويسة المتصفح.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t.settings.system.general.system_tagline ||
              "الوصف المختصر (Tagline)"}
          </label>
          <input
            type="text"
            value={formData.system_title}
            onChange={(e) =>
              setFormData({ ...formData, system_title: e.target.value })
            }
            className="w-full p-2 rounded-lg bg-background border border-border"
            placeholder="Enterprise System"
          />
          <p className="text-sm font-bold text-muted-foreground">
            نص صغير يظهر تحت اسم النظام، يستخدم لوصف نوع النظام أو الإصدار
            (مثلاً: Enterprise System).
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t.settings.system.general.logo_url ||
              "خلفية الشعار (Tailwind Classes)"}
          </label>
          <div className="flex gap-2">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${formData.logo_bg || "bg-gradient-to-br from-indigo-500 to-violet-500"}`}
            >
              {formData.system_name
                ? formData.system_name.charAt(0).toUpperCase()
                : "N"}
            </div>
            <input
              type="text"
              value={formData.logo_bg}
              onChange={(e) =>
                setFormData({ ...formData, logo_bg: e.target.value })
              }
              className="flex-1 p-2 rounded-lg bg-background border border-border"
              dir="ltr"
              placeholder="Example: bg-gradient-to-br from-blue-500 to-cyan-500"
            />
          </div>
          <div className="text-sm font-bold text-muted-foreground space-y-1">
            <p>تحكم بلون خلفية الشعار باستخدام فئات Tailwind CSS.</p>
            <p className="font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded w-fit">
              أمثلة: bg-red-500, bg-gradient-to-r from-blue-600 to-indigo-600
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : t.common?.save || "Save"}
        </button>
      </div>
    </form>
  );
}
