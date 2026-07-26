"use client";

import React from "react";
import { DashboardConfig } from "@/lib/dashboard-config";
import { KpiCard } from "./KpiCard";
import { UsageCard } from "./UsageCard";
import { AlertsCard } from "./AlertsCard";
import { LaboratorySection } from "./sections/LaboratorySection";
import { ManagementSection } from "./sections/ManagementSection";
import { SystemOwnerSection } from "./sections/SystemOwnerSection";

import { usePreferences } from "@/context/PreferenceContext";

interface DashboardRendererProps {
  config: DashboardConfig;
  data: any; // Using exact data shape from action
  role: string;
  lang: string;
}

export function DashboardRenderer({
  config,
  data,
  role,
  lang, // Server-side initial lang
}: DashboardRendererProps) {
  const { preferences } = usePreferences();
  // Prefer client-side state if available (for instant toggle), fallback to server prop
  const currentLang = preferences.language || lang;
  const isRtl = currentLang === "ar";

  // -- PERMISSION CEILING (Layer 2) --
  // Acts as the strict upper limit. User settings cannot override these.
  const permissions = {
    canViewLab: [
      "LAB_TECH",
      "LAB_MANAGER",
      "LAB_ENGINEER",
      "MANAGER",
      "SYSTEM_OWNER",
      "COMPANY_ADMIN",
    ].includes(role),
    canViewManagement: [
      "MANAGER",
      "COMPANY_ADMIN",
      "SYSTEM_OWNER",
      "DEPARTMENT_MANAGER",
    ].includes(role),
    canViewSystem: ["SYSTEM_OWNER", "COMPANY_ADMIN"].includes(role),
    canViewFinance: ["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"].includes(role),
    canViewProduction: [
      "OPERATOR",
      "MANAGER",
      "COMPANY_ADMIN",
      "SYSTEM_OWNER",
      "LAB_MANAGER",
    ].includes(role),
  };

  // -- Renderers --

  const renderKpis = () => {
    // Only render the wrapper if at least one KPI is enabled AND permitted?
    // Actually, KPI grid structure implies we show what's available.
    // We check config.kpis individually.

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up md:col-span-1 lg:col-span-3">
        {config.kpis.production && permissions.canViewProduction && (
          <KpiCard
            dir={isRtl ? "rtl" : "ltr"}
            title={isRtl ? "الإنتاج اليومي" : "DAILY PRODUCTION"}
            value={`${data.production?.volumeToday || 0} ${isRtl ? "م³" : "m³"}`}
            icon="Activity"
            trend={isRtl ? "+١٢٪" : "+12%"}
            status="success"
          />
        )}

        {config.kpis.orders &&
          (permissions.canViewManagement || permissions.canViewProduction) && (
            <KpiCard
              dir={isRtl ? "rtl" : "ltr"}
              title={isRtl ? "طلبات قيد الانتظار" : "PENDING ORDERS"}
              value={data.production?.ordersToday || 0}
              icon="FileText"
              status="neutral"
            />
          )}

        {config.kpis.lab && permissions.canViewLab && (
          <KpiCard
            dir={isRtl ? "rtl" : "ltr"}
            title={isRtl ? "مكعبات قيد الفحص" : "PENDING LAB CUBES"}
            value={data.lab?.pendingCubes || 0}
            icon="Beaker"
            status="warning"
          />
        )}

        {config.kpis.system && permissions.canViewSystem && (
          <KpiCard
            dir={isRtl ? "rtl" : "ltr"}
            title={isRtl ? "المستخدمين النشطين" : "ACTIVE USERS"}
            value={data.system?.activeUsers || 0}
            icon="Users"
            status="neutral"
          />
        )}

        {config.kpis.finance && permissions.canViewFinance && (
          <KpiCard
            dir={isRtl ? "rtl" : "ltr"}
            title={isRtl ? "مدفوعات اليوم" : "TODAY'S REVENUE"}
            value={data.financial.todayPayments}
            subValue={isRtl ? "د.ع" : "$"}
            status="success"
            icon="Wallet"
          />
        )}
      </div>
    );
  };

  const renderUsage = () => {
    // Check Config and Permission
    if (!config.showUsage || !permissions.canViewSystem) return null;

    // Usage is generally safe for all logic users, but maybe hide for simple operators?
    // Assuming available for all for now, or could restrict.
    return (
      <div className="relative group [animation-delay:100ms] animate-in fade-in slide-in-from-bottom-5 duration-700 fill-mode-both">
        <UsageCard
          title={isRtl ? "استهلاك التخزين" : "STORAGE USAGE"}
          used={450}
          total={1000}
          unit={isRtl ? "ميجابايت" : "MB"}
          type="STORAGE"
          usageLabel={isRtl ? "مستخدم" : "USED"}
        />
      </div>
    );
  };

  const renderAlerts = () => {
    if (!config.showAlerts) return null;
    return (
      <div className="relative group [animation-delay:150ms] animate-in fade-in slide-in-from-bottom-5 duration-700 fill-mode-both">
        <AlertsCard
          alerts={data.alerts}
          lang={currentLang}
          dir={isRtl ? "rtl" : "ltr"}
        />
      </div>
    );
  };

  const renderLabSection = () => {
    // Strict AND: Config says YES && Permission says YES
    if (!config.sections.lab || !permissions.canViewLab) return null;
    return (
      <div className="lg:col-span-3 animate-fade-in-up [animation-delay:200ms]">
        <LaboratorySection data={data} lang={lang} />
      </div>
    );
  };

  const renderManagementSection = () => {
    if (!config.sections.management || !permissions.canViewManagement)
      return null;
    return (
      <div className="lg:col-span-3 animate-fade-in-up [animation-delay:250ms]">
        <ManagementSection data={data} lang={lang} />
      </div>
    );
  };

  const renderSystemSection = () => {
    if (!config.sections.system || !permissions.canViewSystem) return null;
    return (
      <div className="lg:col-span-3 animate-fade-in-up [animation-delay:300ms]">
        <SystemOwnerSection data={data} lang={lang} />
      </div>
    );
  };

  // Main Render Loop based on Order
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
      {config.order.map((item, index) => {
        // Use index in key to allow multiple same-type blocks (rare but possible in dynamic layouts)
        const key = `${item}-${index}`;
        switch (item) {
          case "kpis":
            return <React.Fragment key={key}>{renderKpis()}</React.Fragment>;
          case "usage":
            return <React.Fragment key={key}>{renderUsage()}</React.Fragment>;
          case "alerts":
            return <React.Fragment key={key}>{renderAlerts()}</React.Fragment>;
          case "lab":
            return (
              <React.Fragment key={key}>{renderLabSection()}</React.Fragment>
            );
          case "management":
            return (
              <React.Fragment key={key}>
                {renderManagementSection()}
              </React.Fragment>
            );
          case "system":
            return (
              <React.Fragment key={key}>{renderSystemSection()}</React.Fragment>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
