import { getPortalLabResults } from "@/app/actions/portal";
import { Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerDictionary } from "@/lib/dictionary.server";
import { BidiText } from "@/components/ui/BidiText";
import { StrengthEngine } from "@/lib/ai/strength-engine";

export const dynamic = "force-dynamic";

export default async function PortalLabPage() {
  const dict = await getServerDictionary();
  const res = await getPortalLabResults();

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
          عذراً، فشل في تحميل الفحوصات
        </h3>
        <p className="text-slate-400 text-sm">
          حدث خطأ غير متوقع في النظام أو أن الجلسة انتهت.
        </p>
      </div>
    );
  }

  const tests = res.tests || [];

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500 px-2">
        <Link href="/portal" className="hover:text-white">
          الرئيسية
        </Link>
        <span>/</span>
        <span className="text-white">نتائج الفحص</span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            نتائج الفحوصات المخبرية
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            سجل بنتائج مقاومة الانضغاط للنماذج الخرسانية المعتمدة
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.length === 0 ? (
          <div className="col-span-full p-12 glass-panel text-center text-slate-500 font-bold italic rounded-3xl border border-white/5">
            لا توجد نتائج فحوصات معتمدة مسجلة لطلبياتك حالياً.
          </div>
        ) : (
          tests.map((test) => {
            const mpa = test.mpa || 0;
            const predicted =
              test.age === 7 ? StrengthEngine.predict28Day(7, mpa) : null;
            const dateStr = new Date(test.sampleDate).toLocaleDateString(
              "ar-EG",
            );

            return (
              <div
                key={test.id}
                className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-indigo-500/20 transition-all duration-300 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-helper rounded">
                      فحص {test.age} أيام
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <BidiText className="text-caption">{dateStr}</BidiText>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">رقم الطلب</span>
                      <Link
                        href={`/portal/orders/${test.orderId}`}
                        className="text-blue-400 hover:underline"
                      >
                        <BidiText className="font-mono font-bold">
                          #{test.orderId}
                        </BidiText>
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">الخلطة الخرسانية</span>
                      <span className="text-white font-bold text-right">
                        {test.order.mixDesign?.name || "غير محدد"}
                      </span>
                    </div>
                    {test.order.mixDesign?.strengthClass && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          رتبة المقاومة المستهدفة
                        </span>
                        <BidiText className="text-white font-bold">
                          {test.order.mixDesign.strengthClass}
                        </BidiText>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/5 mt-6 pt-4 flex justify-between items-end">
                  <div>
                    <span className="text-caption text-slate-500 block mb-1">
                      مقاومة الانضغاط
                    </span>
                    <div className="flex items-baseline gap-1 text-white">
                      <BidiText className="text-3xl font-black">
                        {mpa.toFixed(1)}
                      </BidiText>
                      <span className="text-caption text-slate-500">
                        ميجا باسكال
                      </span>
                    </div>
                    {predicted && (
                      <div className="text-helper text-emerald-400/80 mt-2 flex flex-col gap-0.5">
                        <span>المتوقع (٢٨ يوم):</span>
                        <BidiText className="font-bold">
                          {predicted} ميجا باسكال
                        </BidiText>
                      </div>
                    )}
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/50 shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
