import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function SystemRootPage() {
  const user = await getCurrentUser();

  if (!user) {
    return redirect("/");
  }

  const role = user.role as string;

  if (role === "SYSTEM_OWNER") return redirect("/admin");
  if (
    role === "MANAGER" ||
    role === "COMPANY_ADMIN" ||
    role === "DEPARTMENT_MANAGER"
  )
    return redirect("/system/manager/dashboard");

  if (role === "LAB_TECH") return redirect("/system/lab");
  if (role === "OPERATOR") return redirect("/system/operator");
  if (role === "SALES" || role === "SALES_REP" || role === "SALES_MANAGER")
    return redirect("/system/sales");
  if (role === "ACCOUNTANT") return redirect("/system/accountant");
  if (role === "SAFETY") return redirect("/system/safety");
  if (role === "GUARD") return redirect("/system/guard");

  // Default fallback
  return redirect("/system/dashboard");
}
