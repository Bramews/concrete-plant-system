import { Metadata } from "next";
import { requireRole, getSession } from "@/lib/auth";
import { getDriverTripsFinancials } from "@/app/actions/driver-finance";
import { DriverFinanceClient } from "./DriverFinanceClient";

export const metadata: Metadata = {
  title: "أجور ونشاط السائقين | النظام المحاسبي",
  description: "متابعة وصولات ونقلات السائقين واحتساب المستحقات المالية والصرف",
};

export const dynamic = "force-dynamic";

export default async function AccountantDriversPage() {
  await requireRole(["ACCOUNTANT", "SYSTEM_OWNER", "COMPANY_ADMIN", "MANAGER"]);

  const session = await getSession();
  const companyId = session?.companyId;

  if (!companyId) {
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        خطأ: لم يتم العثور على جلسة عمل نشطة للشركة.
      </div>
    );
  }

  const data = await getDriverTripsFinancials(companyId);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <DriverFinanceClient initialData={data} companyId={companyId} />
    </div>
  );
}
