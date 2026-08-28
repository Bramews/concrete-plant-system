import { getPortalOrderDetails } from "@/app/actions/portal";
import { Package, Truck, TestTube, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { StrengthEngine } from "@/lib/ai/strength-engine";
import { getServerDictionary } from "@/lib/dictionary.server";
import { BidiText } from "@/components/ui/BidiText";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderDetails(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const dict = await getServerDictionary();
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    notFound();
  }

  const res = await getPortalOrderDetails(numericId);

  if (!res.success) {
    if (res.error === "NOT_AUTHENTICATED") {
      redirect("/api/auth/session-cleanup");
    }
    return (
      <div
        className="p-8 text-center glass-panel rounded-3xl border border-white/5 max-w-2xl mx-auto mt-10"
        dir="rtl"
      >
        <h3 className="text-xl font-bold text-white mb-2">
          عذراً، فشل في تحميل التفاصيل
        </h3>
        <p className="text-slate-400 text-sm">
          {res.error === "ACCESS_DENIED"
            ? "لا تملك صلاحية الوصول لهذا الطلب."
            : "حدث خطأ غير متوقع في النظام أو أن الجلسة انتهت."}
        </p>
        <Link
          href="/portal"
          className="mt-6 inline-block px-6 py-2.5 bg-blue-600 rounded-xl text-white text-sm font-bold hover:bg-blue-500 transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const order = res.order!;
  const progress = Math.min((order.actualQuantity / order.volume) * 100, 100);
  const statusLabel =
    (dict.orders?.status as Record<string, string>)?.[order.status] ||
    order.status;

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500 px-2">
        <Link href="/portal" className="hover:text-white">
          الرئيسية
        </Link>
        <span>/</span>
        <span className="text-white">
          تفاصيل الطلب{" "}
          <BidiText className="text-blue-400 font-mono">#{id}</BidiText>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Progress & Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-page-title text-white tracking-tighter">
                  تفاصيل الطلبية
                </h3>
                <p className="text-slate-400 text-sm mt-1 font-bold">
                  متابعة حالة التوريد والفحوصات الجارية
                </p>
              </div>
              <div className="text-right">
                <span className="text-caption text-blue-400 block mb-1">
                  الحالة
                </span>
                <span className="text-sm font-bold text-white px-3 py-1 bg-white/5 border border-white/10 rounded-xl">
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="space-y-12">
              {/* Delivery Progress */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2 text-slate-300 font-bold">
                    <Truck className="w-4 h-4 text-blue-500" />
                    <span>تقدم التوريد</span>
                  </div>
                  <BidiText className="text-xl font-black text-white">
                    {progress.toFixed(0)}%
                  </BidiText>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-caption text-slate-500 pt-1">
                  <span>البداية</span>
                  <BidiText className="text-slate-300 font-bold">
                    {order.actualQuantity} / {order.volume} م³
                  </BidiText>
                  <span>مكتمل</span>
                </div>
              </div>

              {/* Batch Timeline */}
              <div className="space-y-4">
                <h4 className="text-section-title text-white border-b border-white/5 pb-2">
                  سجل الشحنات
                </h4>
                <div className="space-y-3">
                  {order.tickets.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-white/5 rounded-2xl text-slate-500 italic text-sm">
                      لا توجد شحنات مسجلة لهذا الطلب بعد.
                    </div>
                  ) : (
                    order.tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">
                              تذكرة{" "}
                              <BidiText className="font-mono">
                                #{ticket.ticketNumber}
                              </BidiText>
                            </p>
                            <BidiText className="text-helper text-slate-500 block mt-1">
                              {new Date(ticket.createdAt).toLocaleTimeString()}
                            </BidiText>
                          </div>
                        </div>
                        <div className="text-right">
                          <BidiText className="text-lg font-black text-emerald-400">
                            {ticket.cumulativeQuantity} م³
                          </BidiText>
                          <p className="text-helper text-slate-500 mt-0.5">
                            تراكمي
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Lab Results & Predict */}
        <div className="space-y-8">
          <div className="glass-panel p-8 rounded-3xl border border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <TestTube className="w-5 h-5 text-indigo-400" />
              <h3 className="text-section-title text-white">نتائج الفحوصات</h3>
            </div>

            <div className="space-y-6">
              {order.cubeTests.length === 0 ? (
                <div className="p-10 text-center border border-dashed border-white/5 rounded-2xl text-slate-500 italic text-sm">
                  لم يتم اعتماد أي فحوصات رسمية لهذه الطلبية بعد.
                </div>
              ) : (
                order.cubeTests.map((test) => (
                  <div
                    key={test.id}
                    className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-helper rounded">
                        فحص {test.age} أيام
                      </span>
                      <BidiText className="text-caption text-slate-500">
                        {new Date(test.sampleDate).toLocaleDateString()}
                      </BidiText>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="flex items-baseline gap-1 text-white">
                          <BidiText className="text-2xl font-black">
                            {test.mpa?.toFixed(1) || "0.0"}
                          </BidiText>
                          <span className="text-caption text-slate-500">
                            ميجا باسكال
                          </span>
                        </div>
                        {test.age === 7 && test.mpa && (
                          <div className="text-helper text-emerald-400/80 mt-2 flex flex-col gap-0.5">
                            <span>المتوقع (٢٨ يوم):</span>
                            <BidiText className="font-bold">
                              {StrengthEngine.predict28Day(7, test.mpa)} ميجا
                              باسكال
                            </BidiText>
                          </div>
                        )}
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Download CTA */}
            <button className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-slate-300 hover:text-white transition-all">
              تحميل التقارير المعتمدة (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
