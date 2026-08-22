import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserPreferences } from "@/app/actions/preferences";
import {
  getCommandCenterData,
  getAllTenants,
  getSystemLogs,
  getSystemDomains,
  getRecentAlerts,
  getTopUsage,
  getOutstandingPayments,
  getCompaniesInGrace,
  getPlanSuggestions,
} from "@/app/actions/admin-sovereignty";
import { getDictionary, Locale } from "@/lib/dictionary";
import { SystemOwnerDashboard } from "./_components/SystemOwnerDashboard";
import { Role } from "@prisma/client";

// 1. Force dynamic rendering so "cookies()" works
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  // Role check handled by layout, but keeping strictly doesn't hurt.
  if (!user || user.role !== "SYSTEM_OWNER") {
    redirect("/login");
  }

  const prefs = await getUserPreferences();
  const lang = (prefs.language as Locale) || "ar";
  const dict = getDictionary(lang);

  // Fetch REAL data
  const { kpis, mode } = await getCommandCenterData();
  const activeTenants = await getAllTenants();
  const systemLogs = await getSystemLogs();
  const domains = await getSystemDomains();
  const recentAlerts = await getRecentAlerts();
  const topUsage = await getTopUsage();
  const payments = await getOutstandingPayments();
  const graceCompanies = await getCompaniesInGrace();
  const suggestions = await getPlanSuggestions();

  const dashboardData = {
    kpis: {
      ...kpis,
      storage: String(kpis.storage),
    },
    mode,
    timestamp: new Date(),
    companies: activeTenants,
    activeTenants,
    systemLogs,
    domains,
    recentAlerts,
    topUsage,
    payments,
    graceCompanies,
    suggestions,
  };

  return (
    <main>
      <SystemOwnerDashboard data={dashboardData as any} dict={dict} />
    </main>
  );
}
