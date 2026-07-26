import { ActivityLogClient } from "@/components/system/admin/AuditLogClient";
import { requireRole } from "@/lib/auth";

export default async function AuditLogsPage() {
  await requireRole(["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <ActivityLogClient />
    </div>
  );
}
