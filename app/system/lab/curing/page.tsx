import { requireRole, getCurrentUser } from "@/lib/auth";
import { getCubeTests } from "@/app/actions/lab";
import { format, addDays, differenceInDays } from "date-fns";
import { Icons } from "@/components/ui/Icons";
import { BidiText } from "@/components/ui/BidiText";
import Link from "next/link";

export default async function CuringPondPage() {
  await requireRole([
    "LAB_TECH",
    "LAB_ENGINEER",
    "LAB_MANAGER",
    "MANAGER",
    "SYSTEM_OWNER",
    "COMPANY_ADMIN",
  ]);

  const user = await getCurrentUser();
  const companyId = user?.companyId;

  if (!companyId) {
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        خطأ: لم يتم العثور على جلسة عمل نشطة للشركة.
      </div>
    );
  }

  const tests = await getCubeTests();

  // Filter pending tests (cubes in pond)
  const pendingCubes = tests
    .filter((t) => t.status === "PENDING")
    .map((t) => {
      const sDate = new Date(t.sampleDate);
      const targetDate = addDays(sDate, t.age || 7);
      const daysRemaining = differenceInDays(targetDate, new Date());
      return {
        ...t,
        targetDate,
        daysRemaining,
      };
    });

  const totalInPond = pendingCubes.length;
  const due7Day = pendingCubes.filter(
    (t) => t.age === 7 && t.daysRemaining <= 0,
  ).length;
  const due28Day = pendingCubes.filter(
    (t) => t.age === 28 && t.daysRemaining <= 0,
  ).length;

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6 text-right">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white">
            حوض معالجة المكعبات (Curing Pond)
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">
            مراقبة وتتبع غمر العينات وتوقيتات الكسر القياسية
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">
              المكعبات في حوض المعالجة حالياً
            </span>
            <h3 className="text-3xl font-black text-white">
              <BidiText>{totalInPond}</BidiText>
            </h3>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
            <Icons.Droplet className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">
              مستحق الفحص (7 أيام)
            </span>
            <h3 className="text-3xl font-black text-amber-500">
              <BidiText>{due7Day}</BidiText>
            </h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
            <Icons.Clock className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">
              مستحق الفحص (28 يوم)
            </span>
            <h3 className="text-3xl font-black text-rose-500">
              <BidiText>{due28Day}</BidiText>
            </h3>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
            <Icons.AlertTriangle className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Cubes List */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="font-black text-white text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            العينات المغمورة قيد المعالجة
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  رقم الطلبية
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  العميل
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  تاريخ أخذ العينة
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">
                  عمر العينة المستهدف
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">
                  تاريخ الكسر المتوقع
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">
                  الحالة الزمنية
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pendingCubes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500 italic"
                  >
                    لا توجد عينات في حوض المعالجة حالياً.
                  </td>
                </tr>
              ) : (
                pendingCubes.map((cube) => (
                  <tr
                    key={cube.id}
                    className="hover:bg-white/[0.02] transition-colors border-b border-white/5"
                  >
                    <td className="px-6 py-4 font-mono text-sm text-indigo-400 font-bold">
                      #{cube.order?.orderNumber}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-white">
                      {cube.order?.customer?.name || "عميل عام"}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-bold">
                      <BidiText>
                        {format(new Date(cube.sampleDate), "yyyy-MM-dd")}
                      </BidiText>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-300">
                      <BidiText>{cube.age}</BidiText> أيام
                    </td>
                    <td className="px-6 py-4 text-center text-slate-300 font-bold">
                      <BidiText>
                        {format(new Date(cube.targetDate), "yyyy-MM-dd")}
                      </BidiText>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cube.daysRemaining < 0 ? (
                        <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-black">
                          متأخر بـ{" "}
                          <BidiText>{Math.abs(cube.daysRemaining)}</BidiText>{" "}
                          يوم!
                        </span>
                      ) : cube.daysRemaining === 0 ? (
                        <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black">
                          مستحق الكسر اليوم
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-white/5 text-xs font-bold">
                          متبقي <BidiText>{cube.daysRemaining}</BidiText> يوم
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-rose-950/20 border border-rose-500/10 rounded-2xl text-xs text-rose-400 flex gap-2">
        <Icons.AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          ملاحظة نظام الحماية: تتم مزامنة أعداد وحالات المكعبات في الحوض
          تلقائياً بناءً على إدخال نتائج الكسر وسجلات تذاكر الإنتاج اليومية.
          يُمنع التعديل اليدوي العشوائي لضمان التوافق الإنشائي.
        </span>
      </div>
    </div>
  );
}
