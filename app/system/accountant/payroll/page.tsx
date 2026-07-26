import { requireRole, getSession } from "@/lib/auth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";
import { Metadata } from "next";
import { getPayroll, getPayrollKpis } from "@/app/actions/finance";
import { PayrollStatusBadge } from "./PayrollStatusBadge";

export const metadata: Metadata = {
  title: "رواتب الموظفين | النظام المحاسبي",
};

export default async function AccountingPayrollPage() {
  await requireRole(["ACCOUNTANT", "MANAGER"]);

  const session = await getSession();
  const companyId = session?.companyId;

  if (!companyId) {
    return <div>خطأ: لا توجد جلسة عمل نشطة للشركة</div>;
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const isRtl = lang === "ar";

  const kpis = await getPayrollKpis(companyId);
  const payrolls = await getPayroll(companyId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-IQ", {
      style: "currency",
      currency: isRtl ? "IQD" : "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white">
            {isRtl ? "رواتب الموظفين" : "Employee Payroll"}
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm font-bold mt-1">
            {isRtl
              ? "إدارة المستحقات والرواتب الشهرية"
              : "Management of Monthly Salaries & Dues"}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary">
            {isRtl ? "طباعة كشف الرواتب" : "Print Salary Sheet"}
          </button>
          <button className="btn btn-primary">
            {isRtl ? "صرف الرواتب" : "Process Salaries"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title={isRtl ? "إجمالي الرواتب" : "Total Payroll"}
          value={formatCurrency(kpis.totalPayroll)}
          icon="Users"
          status="neutral"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={isRtl ? "تم صرفها" : "Paid"}
          value={formatCurrency(kpis.paidAmount)}
          icon="CheckCircle"
          status="success"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={isRtl ? "بانتظار الصرف" : "Pending"}
          value={formatCurrency(kpis.pendingAmount)}
          icon="Clock"
          status="warning"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={isRtl ? "عدد الموظفين" : "Staff Count"}
          value={kpis.staffCount}
          icon="Briefcase"
          status="neutral"
          dir={isRtl ? "rtl" : "ltr"}
        />
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/5">
          <h3 className="font-bold text-white tracking-tight uppercase text-sm">
            {isRtl ? "كشف رواتب الشهر الحالي" : "Current Month Salary Sheet"}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left bg-transparent">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-sm font-bold font-black text-slate-500 uppercase tracking-widest">
                  {isRtl ? "اسم الموظف" : "Employee Name"}
                </th>
                <th className="px-6 py-4 text-sm font-bold font-black text-slate-500 uppercase tracking-widest">
                  {isRtl ? "الدور" : "Role"}
                </th>
                <th className="px-6 py-4 text-sm font-bold font-black text-slate-500 uppercase tracking-widest">
                  {isRtl ? "الراتب الأساسي" : "Base Salary"}
                </th>
                <th className="px-6 py-4 text-sm font-bold font-black text-slate-500 uppercase tracking-widest">
                  {isRtl ? "الشهر" : "Month"}
                </th>
                <th className="px-6 py-4 text-sm font-bold font-black text-slate-500 uppercase tracking-widest">
                  {isRtl ? "الحالة" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payrolls.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    {isRtl
                      ? "لا توجد سجلات رواتب لهذا الشهر"
                      : "No payroll records for this month"}
                  </td>
                </tr>
              ) : (
                payrolls.map((payroll) => (
                  <tr
                    key={payroll.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-white">
                      {payroll.user?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-400">
                      {payroll.user?.userRoles?.[0]?.role?.displayName || "-"}
                    </td>
                    <td className="px-6 py-4 font-black tracking-tighter text-white">
                      {formatCurrency(payroll.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-500">
                      {payroll.month}
                    </td>
                    <td className="px-6 py-4">
                      <PayrollStatusBadge
                        payrollId={payroll.id}
                        initialStatus={payroll.status}
                        companyId={companyId}
                        lang={lang}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
