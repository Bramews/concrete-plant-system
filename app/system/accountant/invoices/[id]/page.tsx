import { requireRole, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ACCOUNTANT", "MANAGER"]);
  const session = await getSession();
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { order: { include: { customer: true, project: true } } },
  });
  if (!invoice || invoice.companyId !== session?.companyId) {
    return (
      <div className="p-8 text-red-400 font-bold text-center">
        الفاتورة غير موجودة أو غير مصرح
      </div>
    );
  }
  const fmt = (n: number) =>
    new Intl.NumberFormat("ar-IQ", {
      style: "currency",
      currency: "IQD",
      maximumFractionDigits: 0,
    }).format(n);
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Link
        href="/system/accountant/invoices"
        className="text-slate-400 hover:text-white text-sm font-bold"
      >
        ← العودة للفواتير
      </Link>
      <h1 className="text-2xl font-black text-white">تفاصيل الفاتورة</h1>
      <div className="glass-panel rounded-2xl p-6 space-y-4 divide-y divide-white/5">
        <div className="flex justify-between py-2">
          <span className="text-slate-400 font-bold">رقم الفاتورة</span>
          <span className="font-mono font-bold">#{id.substring(0, 16)}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-slate-400 font-bold">العميل</span>
          <span className="font-bold">
            {invoice.order?.customer?.name || "—"}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-slate-400 font-bold">رقم الطلبية</span>
          <span className="font-bold">{invoice.order?.orderNumber || "—"}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-slate-400 font-bold">المشروع</span>
          <span className="font-bold">
            {invoice.order?.project?.name || "—"}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-slate-400 font-bold">المبلغ</span>
          <span className="font-bold text-emerald-400 text-lg">
            {fmt(invoice.amount)}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-slate-400 font-bold">الحالة</span>
          <span className="font-bold">
            {invoice.status === "PAID"
              ? "مدفوعة ✓"
              : invoice.status === "PENDING"
                ? "معلقة"
                : invoice.status === "OVERDUE"
                  ? "متأخرة ⚠️"
                  : invoice.status}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-slate-400 font-bold">تاريخ الإصدار</span>
          <span className="font-bold">
            {new Date(invoice.createdAt).toLocaleDateString("ar-IQ")}
          </span>
        </div>
      </div>
    </div>
  );
}
