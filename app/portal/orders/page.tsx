import { getPortalOrders } from "@/app/actions/portal";
import { Package, ChevronRight, Inbox } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerDictionary } from "@/lib/dictionary.server";
import { BidiText } from "@/components/ui/BidiText";

export const dynamic = "force-dynamic";

export default async function PortalOrdersPage() {
  const dict = await getServerDictionary();
  const res = await getPortalOrders();

  if (!res.success) {
    if (res.error === "NOT_AUTHENTICATED") {
      redirect("/api/auth/session-cleanup");
    }
    return (
      <div
        className="p-8 text-center glass-panel rounded-3xl border border-white/5 max-w-2xl mx-auto mt-10 animate-fade-in"
        dir="rtl"
      >
        <h3 className="text-xl font-bold text-white mb-2">
          عذراً، فشل في تحميل الطلبات
        </h3>
        <p className="text-slate-400 text-sm">
          حدث خطأ غير متوقع في النظام أو أن الجلسة انتهت.
        </p>
      </div>
    );
  }

  const orders = res.orders || [];

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500 px-2">
        <Link href="/portal" className="hover:text-white">
          الرئيسية
        </Link>
        <span>/</span>
        <span className="text-white">طلباتي</span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            سجل الطلبيات
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            عرض ومتابعة كافة طلبيات الخرسانة الخاصة بك
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-[2rem]">
            <div className="w-20 h-20 bg-slate-800/60 rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-800/20">
              <Inbox className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              لا توجد طلبيات حالياً
            </h3>
            <p className="text-slate-400 max-w-sm">
              لم تقم بتسجيل أي طلبيات خرسانة في حسابك حتى الآن.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const progress = Math.min(
              (order.actualQuantity / order.volume) * 100,
              100,
            );
            const statusLabel =
              dict.orders?.status?.[order.status] || order.status;
            const dateStr = new Date(order.date).toLocaleDateString("ar-EG");

            return (
              <Link
                key={order.id}
                href={`/portal/orders/${order.id}`}
                className="block group glass-panel p-6 rounded-3xl border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/[0.02] transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                  {/* ID & Mix Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <BidiText className="text-lg font-black text-white font-mono">
                          #{order.id}
                        </BidiText>
                        <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 text-helper rounded">
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-300 mt-1">
                        الخلطة: {order.mixDesign?.name || "غير محدد"}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex-1 max-w-md space-y-2">
                    <div className="flex justify-between text-caption text-slate-400">
                      <span>تقدم التوريد</span>
                      <BidiText className="font-bold text-white">
                        {progress.toFixed(0)}%
                      </BidiText>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-helper text-slate-500">
                      <BidiText>{order.actualQuantity} م³</BidiText>
                      <BidiText>المطلوب: {order.volume} م³</BidiText>
                    </div>
                  </div>

                  {/* Meta info & Arrow */}
                  <div className="flex justify-between items-center gap-4">
                    <div className="text-right md:text-left shrink-0">
                      <span className="text-caption text-slate-500 block">
                        تاريخ الطلب
                      </span>
                      <BidiText className="text-sm font-bold text-slate-300 mt-0.5">
                        {dateStr}
                      </BidiText>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
