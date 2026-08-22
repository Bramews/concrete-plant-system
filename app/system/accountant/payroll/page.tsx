import { Metadata } from "next";
import { requireRole, getSession } from "@/lib/auth";
import { getPayroll, getPayrollKpis } from "@/app/actions/finance";
import {
  getCompanyStaffDirectory,
  getCompanyStaffDepartments,
} from "@/app/actions/payroll-staff";
import { StaffAndPayrollClient } from "./StaffAndPayrollClient";

export const metadata: Metadata = {
  title: "رواتب الموظفين ودليل الكادر | النظام المحاسبي",
  description: "إدارة الرواتب وسجل الكادر ورفع المستمسكات الثبوتية",
};

export const dynamic = "force-dynamic";

export default async function AccountingPayrollPage() {
  await requireRole(["ACCOUNTANT", "SYSTEM_OWNER", "COMPANY_ADMIN", "MANAGER"]);

  const session = await getSession();
  const companyId = session?.companyId;

  if (!companyId) {
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        خطأ: لا توجد جلسة عمل نشطة للشركة
      </div>
    );
  }

  const [kpis, payrolls, staffData, departments] = await Promise.all([
    getPayrollKpis(companyId),
    getPayroll(companyId),
    getCompanyStaffDirectory(companyId),
    getCompanyStaffDepartments(companyId),
  ]);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <StaffAndPayrollClient
        initialStaff={staffData.staff}
        payrolls={payrolls}
        initialDepartments={departments}
        kpis={{
          ...kpis,
          staffCount: staffData.staff.length,
        }}
        companyId={companyId}
      />
    </div>
  );
}
