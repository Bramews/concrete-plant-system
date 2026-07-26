import { getExecutiveSummary } from "@/app/actions/reporting";
import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";
import { ReportsView } from "@/components/reports/ReportsView";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireRole(["COMPANY_ADMIN", "SYSTEM_OWNER"]);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const dict = await getDictionary(lang);

  const result = await getExecutiveSummary();
  const reportData = result.success ? result.data : null;

  return (
    <div className="min-h-screen bg-background">
      <ReportsView data={reportData} dict={dict} />
    </div>
  );
}
