import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFinancialPeriodsAction } from "@/app/actions/finance";
import { PeriodsClientView } from "./PeriodsClientView";

export const dynamic = "force-dynamic";

export default async function FinancialPeriodsPage() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    redirect("/api/auth/session-cleanup");
  }

  const periods = await getFinancialPeriodsAction(user.companyId);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PeriodsClientView
        initialPeriods={periods}
        companyId={user.companyId}
        userRole={user.role}
        userName={user.name || user.email}
      />
    </div>
  );
}
