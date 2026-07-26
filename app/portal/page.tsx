import { getPortalDashboardData } from "@/app/actions/portal";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Building2, Package, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BidiText } from "@/components/ui/BidiText";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const data = await getPortalDashboardData();

  if (!data.success) {
    if (data.error === "NOT_AUTHENTICATED") {
      redirect("/api/auth/session-cleanup");
    }
    return (
      <div
        className="p-8 text-center glass-panel rounded-3xl border border-white/5 max-w-2xl mx-auto mt-10 animate-fade-in"
        dir="rtl"
      >
        <h3 className="text-xl font-bold text-white mb-2">
          عذراً، فشل في تحميل لوحة التحكم
        </h3>
        <p className="text-slate-400 text-sm">
          حدث خطأ غير متوقع في النظام أو أن الجلسة انتهت.
        </p>
      </div>
    );
  }

  if (!data.customer) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 glass-panel rounded-3xl border-dashed border-2 border-white/5 mx-auto max-w-2xl mt-10 animate-fade-in-up"
        dir="rtl"
      >
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-500">
          <Building2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tighter">
          بوابة غير مفعلة
        </h2>
        <p className="text-slate-500 mt-2 font-bold max-w-sm">
          عذراً، لم يتم ربط هذا الحساب بأي شركة عميلة حتى الآن. يرجى التواصل مع
          إدارة المحطة لتفعيل حسابك.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in p-2 md:p-0" dir="rtl">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
            أهلاً، {data.customer.name}
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mt-1 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-blue-500/30"></span>
            نظرة عامة على مشاريعك الحالية
          </p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-bold tracking-widest">
            حساب معتمد
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard
          title="إجمالي الكمية المتعاقد عليها"
          value={`${data.summary.totalVolume} م³`}
          icon="Database"
          status="success"
        />
        <KpiCard
          title="الفحوصات المختبرية المكتملة"
          value={String(data.summary.testCount)}
          icon="CheckCircle"
          status="neutral"
        />
        <KpiCard
          title="حالة توريد المشاريع"
          value="نشط"
          icon="TrendingUp"
          status="warning"
        />
      </div>

      {/* Active Orders List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-black text-white tracking-widest text-sm flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            الطلبات النشطة
          </h3>
          <Link
            href="/portal/orders"
            className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
          >
            عرض الكل
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.activeOrders.length === 0 ? (
            <div className="col-span-full p-12 glass-panel text-center text-slate-500 font-bold italic rounded-3xl border border-white/5">
              لا توجد طلبات جارية حالياً.
            </div>
          ) : (
            data.activeOrders.map((order) => (
              <Link
                key={order.id}
                href={`/portal/orders/${order.id}`}
                className="group glass-panel p-6 rounded-3xl border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/[0.03] transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-caption text-slate-500 leading-none mb-1">
                      رقم الطلب
                    </p>
                    <BidiText className="text-xl font-black text-white font-mono">
                      #{order.id}
                    </BidiText>
                  </div>
                  <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-helper">
                    {order.status}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-500">الخلطة الخرسانية</span>
                    <span className="text-white font-black">
                      {order.mixDesign?.name || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-500">الكمية المطلوبة</span>
                    <BidiText className="text-white font-black">
                      {order.volume} م³
                    </BidiText>
                  </div>
                  {/* Progress Bar */}
                  <div className="pt-2">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500"
                        style={{
                          width: `${Math.min((order.actualQuantity / order.volume) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
