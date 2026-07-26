import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LabDashboard from "@/components/lab/LabDashboard";
import { getLabDashboardStats } from "@/app/actions/lab";

export const dynamic = "force-dynamic";

import { getDictionary } from "@/lib/dictionary";
import { getCurrentLanguage } from "@/lib/locale";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const role = user.role as string;

  // 1. Double-guard: Redirect users with specific dashboards to their correct paths
  if (role === "SYSTEM_OWNER") redirect("/admin");
  if (
    role === "MANAGER" ||
    role === "COMPANY_ADMIN" ||
    role === "DEPARTMENT_MANAGER"
  ) {
    redirect("/system/manager/dashboard");
  }
  if (role === "OPERATOR") redirect("/system/operator");
  if (role === "SALES" || role === "SALES_REP" || role === "SALES_MANAGER") {
    redirect("/system/sales");
  }
  if (role === "ACCOUNTANT") redirect("/system/accountant");
  if (role === "SAFETY") redirect("/system/safety");
  if (role === "GUARD") redirect("/system/guard");

  // 2. Render Lab Dashboard only for Lab staff
  if (["LAB_TECH", "LAB_ENGINEER", "LAB_MANAGER"].includes(role)) {
    const lang = await getCurrentLanguage();
    const dict = getDictionary(lang);
    const stats = await getLabDashboardStats();
    return <LabDashboard dict={dict.lab} stats={stats} />;
  }

  // 3. Otherwise, block access with a clear explanation code
  redirect("/access-denied?reason=NO_DASHBOARD");
}
