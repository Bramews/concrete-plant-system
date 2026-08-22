import { requireRole, getSession } from "@/lib/auth";
import { getVouchers } from "@/app/actions/finance";
import { VouchersListClient } from "./VouchersListClient";
import { Metadata } from "next";
import { DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "سندات القبض والصرف | النظام المحاسبي",
  description: "سجل سندات القبض والتحصيلات المالية",
};

export default async function VouchersPage() {
  await requireRole(["ACCOUNTANT", "MANAGER"]);

  const session = await getSession();
  const companyId = session?.companyId;

  if (!companyId) {
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        خطأ: لا توجد جلسة عمل نشطة للشركة
      </div>
    );
  }

  const { vouchers, currency } = await getVouchers(companyId);

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            سندات القبض والتحصيل
          </h2>
          <p className="text-slate-400 font-bold text-sm mt-1 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-emerald-500/40"></span>
            توثيق الدفعات النقدية، الشيكات، والتحويلات المصرفية المعتمدة
          </p>
        </div>
      </div>

      <VouchersListClient vouchers={vouchers} currency={currency} />
    </div>
  );
}
