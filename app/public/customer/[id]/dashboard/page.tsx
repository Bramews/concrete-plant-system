import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function translateStatus(status: string) {
  const mapping: Record<string, string> = {
    DRAFT: "مسودة",
    APPROVED: "معتمد",
    LAB_APPROVED: "معتمد مخبرياً",
    PRODUCTION_STARTED: "قيد الإنتاج",
    DISPATCHED: "تم التوصيل",
    ACCOUNTING_CLOSED: "مكتمل ومغلق",
  };
  return mapping[status.toUpperCase()] || status;
}

export default async function CustomerPublicDashboard({ params }: PageProps) {
  const { id } = await params;
  const customerId = parseInt(id, 10);
  if (isNaN(customerId)) {
    return notFound();
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    return notFound();
  }

  // Calculate quick stats
  const totalOrders = customer.orders.length;
  const totalVolume = customer.orders.reduce(
    (sum, order) => sum + order.volume,
    0,
  );
  const activeOrdersCount = customer.orders.filter(
    (o) => o.status !== "ACCOUNTING_CLOSED" && o.status !== "DISPATCHED",
  ).length;

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Card */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-sm font-semibold text-emerald-400">
              بوابة العميل الآمنة
            </span>
            <h1 className="text-3xl font-bold mt-1 text-white">
              {customer.name}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              تتبع مباشر لطلبيات الخرسانة وحالة الإنتاج
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
              اتصال مستقر ونشط
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
            <span className="text-slate-400 text-sm">إجمالي الطلبيات</span>
            <div className="text-3xl font-bold mt-2 text-white">
              {totalOrders}
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
            <span className="text-slate-400 text-sm">
              إجمالي الكمية (متر مكعب)
            </span>
            <div className="text-3xl font-bold mt-2 text-emerald-400">
              {totalVolume.toFixed(1)} م³
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
            <span className="text-slate-400 text-sm">
              الطلبيات النشطة حالياً
            </span>
            <div className="text-3xl font-bold mt-2 text-orange-400">
              {activeOrdersCount}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">
              قائمة الطلبيات النشطة والمكتملة
            </h2>
          </div>

          {customer.orders.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              لا توجد طلبيات مسجلة لهذا العميل حالياً.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 text-sm border-b border-slate-800">
                    <th className="px-6 py-3 font-semibold">رقم الطلبية</th>
                    <th className="px-6 py-3 font-semibold">الكمية المطلوبة</th>
                    <th className="px-6 py-3 font-semibold">الكمية الموردة</th>
                    <th className="px-6 py-3 font-semibold">تاريخ الطلب</th>
                    <th className="px-6 py-3 font-semibold">حالة الطلبية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {customer.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-900/20 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-white">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">{order.volume} م³</td>
                      <td className="px-6 py-4 text-slate-300">
                        {order.actualQuantity || 0} م³
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(order.date).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            order.status === "ACCOUNTING_CLOSED" ||
                            order.status === "DISPATCHED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          }`}
                        >
                          {translateStatus(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
