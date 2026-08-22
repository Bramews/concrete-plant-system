import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFinancialAuditTrailAction } from "@/app/actions/finance";
import { AuditClientView } from "./AuditClientView";

export const dynamic = "force-dynamic";

export default async function FinancialAuditPage() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    redirect("/api/auth/session-cleanup");
  }

  const { records, total } = await getFinancialAuditTrailAction(user.companyId, {
    limit: 100,
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <AuditClientView
        initialRecords={records}
        totalCount={total}
        companyId={user.companyId}
        userRole={user.role}
      />
    </div>
  );
}
