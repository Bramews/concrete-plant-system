import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    token: string;
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

export default async function InvitePublicPage({ params }: PageProps) {
  const { token } = await params;

  const invitation = await prisma.tunnelInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return notFound();
  }

  // Check expiry
  const now = new Date();
  if (now > invitation.expiresAt) {
    return (
      <div
        className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6"
        dir="rtl"
      >
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="text-red-500 text-5xl">⚠️</div>
          <h1 className="text-xl font-bold text-white">انتهت صلاحية الدعوة</h1>
          <p className="text-slate-400 text-sm">
            عذراً، انتهت صلاحية هذه الدعوة المؤقتة الموجهة إليك. يرجى التواصل مع
            إدارة المحطة للحصول على رابط دعوة جديد.
          </p>
        </div>
      </div>
    );
  }

  // Increment view count
  await prisma.tunnelInvitation.update({
    where: { token },
    data: { viewCount: { increment: 1 } },
  });

  // Attempt to resolve customer by name matching invitation label
  const customer = await prisma.customer.findFirst({
    where: { name: invitation.label, deletedAt: null },
    include: {
      orders: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Company Header Card */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-sm font-semibold text-emerald-400">
              نظام الدعوات المؤقتة للمقاولين
            </span>
            <h1 className="text-3xl font-bold mt-1 text-white">
              {invitation.label}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              تتبع مباشر وحالة الطلبيات الحالية
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
              رابط دعوة فعال
            </span>
            <span className="text-xs text-slate-450 mt-1">
              ينتهي في: {new Date(invitation.expiresAt).toLocaleString("ar-EG")}
            </span>
          </div>
        </div>

        {/* Customer Dashboard Content */}
        {customer ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
                <span className="text-slate-400 text-sm">
                  عدد الطلبيات الخاصة بك
                </span>
                <div className="text-3xl font-bold mt-2 text-white">
                  {customer.orders.length}
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
                <span className="text-slate-400 text-sm">الكمية الإجمالية</span>
                <div className="text-3xl font-bold mt-2 text-emerald-400">
                  {customer.orders
                    .reduce((sum, o) => sum + o.volume, 0)
                    .toFixed(1)}{" "}
                  م³
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
                <span className="text-slate-400 text-sm">
                  الطلبيات قيد التوريد حالياً
                </span>
                <div className="text-3xl font-bold mt-2 text-orange-400">
                  {
                    customer.orders.filter(
                      (o) =>
                        o.status !== "ACCOUNTING_CLOSED" &&
                        o.status !== "DISPATCHED",
                    ).length
                  }
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">
                  الطلبيات النشطة والمكتملة
                </h2>
              </div>

              {customer.orders.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  لا توجد طلبيات مسجلة حالياً.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-900/80 text-slate-400 text-sm border-b border-slate-800">
                        <th className="px-6 py-3 font-semibold">رقم الطلبية</th>
                        <th className="px-6 py-3 font-semibold">
                          الكمية المطلوبة
                        </th>
                        <th className="px-6 py-3 font-semibold">
                          الكمية المستلمة
                        </th>
                        <th className="px-6 py-3 font-semibold">
                          تاريخ الطلبية
                        </th>
                        <th className="px-6 py-3 font-semibold">الحالة</th>
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
          </>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center space-y-4">
            <div className="text-yellow-500 text-4xl font-bold">ℹ️</div>
            <h2 className="text-lg font-bold text-white">
              لا توجد طلبيات نشطة بعد
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              أهلاً بك. تم تفعيل رابط دعوتك بنجاح، ولكن لا توجد طلبيات خرسانة
              مسجلة في نظام المحطة تحت الاسم &quot;{invitation.label}&quot;
              حالياً. يرجى مراجعة إدارة المحطة لتأكيد طلبيتك.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
