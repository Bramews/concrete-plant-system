"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import {
  updateSystemSetting,
  toggleSystemSettingLock,
} from "@/app/actions/system-settings";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Setting {
  key: string;
  value: string;
  locked: boolean;
}

export function SystemSettingsClient({
  initialSettings,
}: {
  initialSettings: Setting[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Default keys to ensure specific ones exist in UI even if DB is empty
  const DEFAULT_KEYS = [
    "GLOBAL_LOCK_DOWN",
    "ALLOW_NEW_REGISTRATIONS",
    "DEFAULT_TIMEZONE",
    "MAX_LOGIN_ATTEMPTS",
    "MAINTENANCE_MODE",
  ];

  // Merge DB settings with defaults
  const combinedSettings = DEFAULT_KEYS.map((key) => {
    const found = initialSettings.find((s) => s.key === key);
    return found || { key, value: "false", locked: false };
  });

  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    setLoading(key);
    try {
      // Find current lock state to preserve it
      const currentLock =
        initialSettings.find((s) => s.key === key)?.locked || false;
      await updateSystemSetting(key, newValue);
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleLock = async (key: string, currentLock: boolean) => {
    setLoading(key);
    try {
      await toggleSystemSettingLock(key, !currentLock);
      router.refresh();
    } catch (error) {
      console.error("Lock error:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {combinedSettings.map((setting) => (
        <div
          key={setting.key}
          className="bg-card border border-border p-4 rounded-xl flex items-center justify-between"
        >
          <div>
            <div className="font-mono font-bold text-sm">{setting.key}</div>
            <div className="text-sm font-bold text-muted-foreground mt-1">
              Current Value:{" "}
              <span className="font-bold text-primary">{setting.value}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* VALUE TOGGLE (Simplified to boolean toggle for demo keys) */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase text-muted-foreground">
                Value
              </span>
              <button
                onClick={() => handleToggle(setting.key, setting.value)}
                aria-label={`Toggle ${setting.key}`}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-colors",
                  setting.value === "true" ? "bg-green-500" : "bg-gray-300",
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    setting.value === "true" ? "left-7" : "left-1",
                  )}
                />
              </button>
            </div>

            <div className="h-8 w-px bg-border"></div>

            {/* LOCK TOGGLE */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase text-muted-foreground">
                Lock
              </span>
              <button
                onClick={() => handleLock(setting.key, setting.locked)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  setting.locked
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
                aria-label={`Edit ${setting.key}`}
              >
                {setting.locked ? (
                  <Icons.Lock className="w-4 h-4" />
                ) : (
                  <Icons.Unlock className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
