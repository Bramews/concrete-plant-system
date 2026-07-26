"use client";

import { useState, useTransition } from "react";
import {
  Settings,
  Shield,
  Mail,
  Lock,
  Users,
  Gauge,
  Palette,
  Wrench,
  Plug,
  Terminal,
  Save,
  Loader2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { updateSystemSettings } from "@/app/actions/system-settings";
import { GeneralTab } from "./tabs/GeneralTab";
import { SecurityTab } from "./tabs/SecurityTab";
import { EmailTab } from "./tabs/EmailTab";
import { AccessControlTab } from "./tabs/AccessControlTab";
import { TenantsTab } from "./tabs/TenantsTab";
import { PerformanceTab } from "./tabs/PerformanceTab";
import { UITab } from "./tabs/UITab";
import { MaintenanceTab } from "./tabs/MaintenanceTab";
import { IntegrationsTab } from "./tabs/IntegrationsTab";
import { AdvancedTab } from "./tabs/AdvancedTab";
import { TunnelTab } from "./tabs/TunnelTab";

import { DictionaryType } from "@/lib/dictionary.base";

interface SettingsTabsProps {
  dict: DictionaryType;
  initialSettings: Record<
    string,
    { value: string; locked: boolean; lockType: string }
  >;
}

export function SettingsTabs({ dict, initialSettings }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);

  const handleUpdate = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      // Convert complex object to simple key-value for server action
      const simpleSettings = Object.entries(settings).reduce(
        (acc, [key, data]) => ({
          ...acc,
          [key]: data.value,
        }),
        {} as Record<string, string>,
      );

      const isMemoryLimitChanged =
        settings["memory_limit"]?.value !==
        initialSettings["memory_limit"]?.value;

      const result = await updateSystemSettings(simpleSettings);

      if (result.success) {
        if (isMemoryLimitChanged) {
          toast.success(
            "تم الحفظ. جاري إعادة تشغيل النظام لتطبيق السعة الجديدة...",
            {
              duration: 5000,
            },
          );
          setHasChanges(false);
          setTimeout(() => {
            window.location.reload();
          }, 4000);
        } else {
          toast.success("تم حفظ الإعدادات بنجاح");
          setHasChanges(false);
        }
      } else {
        toast.error(result.error || "فشل حفظ الإعدادات");
      }
    });
  };

  const tabs = [
    { id: "general", label: dict.settings.system.tabs.general, icon: Settings },
    { id: "security", label: dict.settings.system.tabs.security, icon: Shield },
    { id: "email", label: dict.settings.system.tabs.email, icon: Mail },
    { id: "access", label: dict.settings.system.tabs.access, icon: Lock },
    { id: "tenants", label: dict.settings.system.tabs.tenants, icon: Users },
    {
      id: "performance",
      label: dict.settings.system.tabs.performance,
      icon: Gauge,
    },
    { id: "ui", label: dict.settings.system.tabs.ui, icon: Palette },
    {
      id: "maintenance",
      label: dict.settings.system.tabs.maintenance,
      icon: Wrench,
    },
    {
      id: "integrations",
      label: dict.settings.system.tabs.integrations,
      icon: Plug,
    },
    {
      id: "tunnel",
      label: dict.settings.system.tabs.tunnel,
      icon: Share2,
    },
    {
      id: "advanced",
      label: dict.settings.system.tabs.advanced,
      icon: Terminal,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Save Button Removed - Placed Action Button near content */}
      <div className="flex gap-6 relative">
        {/* Sidebar Tabs */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500 group-hover:text-white"}`}
                  />
                  <span className="font-semibold text-sm">{tab.label}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl opacity-10" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!hasChanges || isPending}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all duration-300 ${
                hasChanges
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 cursor-pointer"
                  : "bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-700/50"
              }`}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {dict.common.save}
            </button>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 p-8">
            {activeTab === "general" && (
              <GeneralTab
                dict={dict}
                settings={settings}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === "security" && (
              <SecurityTab
                dict={dict}
                settings={settings}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === "email" && (
              <EmailTab
                dict={dict}
                settings={settings}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === "access" && (
              <AccessControlTab
                dict={dict}
                settings={settings}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === "tenants" && (
              <TenantsTab
                dict={dict}
                settings={settings}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === "performance" && (
              <PerformanceTab
                dict={dict}
                settings={settings}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === "ui" && (
              <UITab dict={dict} settings={settings} onUpdate={handleUpdate} />
            )}
            {activeTab === "maintenance" && (
              <MaintenanceTab
                dict={dict}
                settings={settings}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === "integrations" && (
              <IntegrationsTab
                dict={dict}
                settings={settings}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === "tunnel" && (
              <TunnelTab
                dict={dict}
                settings={settings}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === "advanced" && (
              <AdvancedTab
                dict={dict}
                settings={settings}
                onUpdate={handleUpdate}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
