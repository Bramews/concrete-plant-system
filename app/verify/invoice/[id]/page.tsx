import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}

export default async function InvoiceVerifyPage({
  params,
}: {
  params: { id: string };
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      order: {
        include: {
          customer: true,
          mixDesign: true,
          cubeTests: { where: { status: "APPROVED" }, orderBy: { age: "asc" } },
          tickets: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
      company: {
        include: { branding: true },
      },
    },
  });

  if (!invoice) notFound();

  const order = invoice.order;
  const company = invoice.company;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#030712] text-white p-6 flex flex-col items-center"
    >
      {/* Company Header */}
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2 py-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-2xl mx-auto">
            {company.branding?.logoText || company.name.charAt(0)}
          </div>
          <h1 className="text-xl font-black text-white">{company.name}</h1>
          <p className="text-sm text-slate-400">شهادة تحقق رقمية</p>
        </div>

        {/* Status Badge */}
        <div
          className={`rounded-2xl border p-4 text-center ${
            invoice.status === "PAID"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-amber-500/10 border-amber-500/30"
          }`}
        >
          <p
            className={`text-2xl font-black ${
              invoice.status === "PAID" ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {invoice.status === "PAID" ? "✅ مدفوع" : "⏳ قيد الانتظار"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            رقم الفاتورة: {invoice.id.slice(0, 12)}...
          </p>
        </div>

        {/* Invoice Details */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-slate-300 text-sm uppercase tracking-wider">
            تفاصيل الفاتورة
          </h2>
          <div className="space-y-3">
            <Row label="العميل" value={order?.customer?.name || "—"} />
            <Row
              label="المبلغ"
              value={`${invoice.amount.toLocaleString()} ${invoice.currency}`}
            />
            <Row
              label="تاريخ الإصدار"
              value={new Date(invoice.createdAt).toLocaleDateString("ar-IQ")}
            />
            {invoice.paidAt && (
              <Row
                label="تاريخ السداد"
                value={new Date(invoice.paidAt).toLocaleDateString("ar-IQ")}
              />
            )}
          </div>
        </div>

        {/* Order Details */}
        {order && (
          <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-slate-300 text-sm uppercase tracking-wider">
              تفاصيل الطلب
            </h2>
            <div className="space-y-3">
              <Row label="رقم الطلب" value={order.orderNumber} />
              <Row label="الخلطة" value={order.mixDesign?.name || "—"} />
              <Row label="الكمية المطلوبة" value={`${order.volume} م³`} />
              <Row label="المنفذ فعلياً" value={`${order.actualQuantity} م³`} />
            </div>
          </div>
        )}

        {/* Lab Results */}
        {order?.cubeTests && order.cubeTests.length > 0 && (
          <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-slate-300 text-sm uppercase tracking-wider">
              نتائج المختبر المعتمدة
            </h2>
            <div className="space-y-2">
              {order.cubeTests.map((test) => (
                <div
                  key={test.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    test.result === "PASS"
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                  }`}
                >
                  <span className="text-sm text-slate-300">{test.age} يوم</span>
                  <span className="font-bold text-white">
                    {test.mpa ?? "—"} MPa
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      test.result === "PASS"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {test.result === "PASS" ? "✅ ناجح" : "❌ راسب"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-slate-600">
            هذه الوثيقة صادرة رقمياً من نظام إدارة المحطة الخرسانية. التحقق من
            صحتها عبر مسح QR Code الموجود على الفاتورة الأصلية.
          </p>
        </div>
      </div>
    </div>
  );
}
