"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { updateCompanySettingAction } from "@/app/actions/companies";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Setting {
  key: string;
  value: string;
  locked: boolean;
}

interface CompanySettingsClientProps {
  companySettings: any[];
  systemSettings: Setting[];
}

export function CompanySettingsClient({
  companySettings,
  systemSettings,
}: CompanySettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Helper to get effective state
  const getSettingState = (key: string, defaultValue = "") => {
    const sys = systemSettings.find((s) => s.key === key);
    const company = companySettings.find((s) => s.key === key);

    return {
      value: company?.value || defaultValue,
      locked: sys?.locked || false, // If system locked it, it's locked here
      effectiveValue: sys?.locked ? sys.value : company?.value || defaultValue,
    };
  };

  const handleUpdate = async (key: string, value: string) => {
    setLoading(key);
    try {
      await updateCompanySettingAction(key, value);
      router.refresh();
      toast.success("تم تحديث الإعداد بنجاح.");
    } catch (e) {
      toast.error("فشل تحديث الإعداد.");
    } finally {
      setLoading(null);
    }
  };

  // Define sections
  const LOCALIZATION = [
    {
      key: "CURRENCY",
      label: "Currency",
      type: "select",
      options: ["IQD", "USD", "EUR"],
    },
    {
      key: "TIMEZONE",
      label: "Timezone",
      type: "select",
      options: ["Asia/Baghdad", "UTC", "Asia/Dubai"],
    },
    {
      key: "LANGUAGE",
      label: "Default Language",
      type: "select",
      options: ["ar", "en"],
    },
  ];

  const BRANDING = [
    { key: "COMPANY_NAME_DISPLAY", label: "Display Name", type: "text" },
    { key: "THEME_COLOR", label: "Primary Color", type: "color" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* LOCALIZATION CARD */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-bold border-b border-border pb-2 flex items-center gap-2">
          <Icons.Globe className="w-4 h-4" /> Localization
        </h3>
        {LOCALIZATION.map((field) => {
          const state = getSettingState(field.key);
          return (
            <div key={field.key} className="space-y-1">
              <label className="text-sm font-semibold uppercase text-slate-300 flex items-center gap-2">
                {field.label}
                {state.locked && (
                  <Icons.Lock className="w-3 h-3 text-amber-500" />
                )}
              </label>
              {field.type === "select" ? (
                <select
                  disabled={state.locked || loading === field.key}
                  value={state.effectiveValue}
                  onChange={(e) => handleUpdate(field.key, e.target.value)}
                  aria-label={field.label}
                  className={cn(
                    "w-full bg-muted/20 border border-input rounded-lg px-3 py-2 text-sm",
                    state.locked && "opacity-50 cursor-not-allowed bg-muted",
                  )}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : null}
              {state.locked && (
                <p className="text-xs font-medium text-amber-500">
                  Managed by System Policy
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* BRANDING CARD */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-bold border-b border-border pb-2 flex items-center gap-2">
          <Icons.Palette className="w-4 h-4" /> Branding
        </h3>
        {BRANDING.map((field) => {
          const state = getSettingState(field.key);
          return (
            <div key={field.key} className="space-y-1">
              <label className="text-sm font-semibold uppercase text-slate-300 flex items-center gap-2">
                {field.label}
                {state.locked && (
                  <Icons.Lock className="w-3 h-3 text-amber-500" />
                )}
              </label>
              <input
                type={field.type}
                disabled={state.locked || loading === field.key}
                value={state.effectiveValue}
                onChange={(e) => handleUpdate(field.key, e.target.value)} // Note: Color input fires often, should debounce in real app
                onBlur={(e) =>
                  field.type === "text" &&
                  handleUpdate(field.key, e.target.value)
                }
                aria-label={field.label}
                className={cn(
                  "w-full bg-muted/20 border border-input rounded-lg px-3 py-2 text-sm h-10",
                  state.locked && "opacity-50 cursor-not-allowed bg-muted",
                )}
              />
              {state.locked && (
                <p className="text-xs font-medium text-amber-500">
                  Managed by System Policy
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
