import { requireRole, getSession } from "@/lib/auth";
import { getCompanyFinancialSettings } from "@/app/actions/finance";
import { getCompanyStaffDepartments } from "@/app/actions/payroll-staff";
import { FinancialSettingsClient } from "./FinancialSettingsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "الإعدادات المالية والعملات | النظام المحاسبي",
  description: "تحديد العملة الأساسية وإعدادات الفوترة وأقسام الكادر للشركة",
};

export default async function FinancialSettingsPage() {
  await requireRole(["ACCOUNTANT", "MANAGER", "SYSTEM_OWNER"]);

  const session = await getSession();
  const companyId = session?.companyId;

  if (!companyId) {
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        خطأ: لم يتم العثور على جلسة عمل نشطة للشركة
      </div>
    );
  }

  const [initialSettings, initialDepartments] = await Promise.all([
    getCompanyFinancialSettings(companyId),
    getCompanyStaffDepartments(companyId),
  ]);

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-6">
      <div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          الإعدادات والضبط المحاسبي
        </h2>
        <p className="text-slate-400 font-bold text-sm mt-1">
          تخصيص العملة الرسمية وقواعد الفوترة وأقسام وتصنيفات الكادر والموظفين
        </p>
      </div>

      <FinancialSettingsClient
        companyId={companyId}
        initialSettings={initialSettings}
        initialDepartments={initialDepartments}
      />
    </div>
  );
}
