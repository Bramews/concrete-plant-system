import { requireRole, getSession } from "@/lib/auth";
import { getCustomerStatement } from "@/app/actions/finance";
import { CustomerStatementView } from "./CustomerStatementView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "كشف حساب عميل | النظام المحاسبي",
  description: "كشف حساب تفصيلي وحركات الذمم والمدفوعات",
};

export default async function CustomerStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id } = await params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) {
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        معرف العميل غير صالح
      </div>
    );
  }

  const data = await getCustomerStatement(companyId, customerId);

  return (
    <CustomerStatementView
      companyId={companyId}
      customer={data.customer}
      projects={data.projects}
      items={data.items}
      summary={data.summary}
    />
  );
}
