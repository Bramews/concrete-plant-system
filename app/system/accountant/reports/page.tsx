import { requireRole, getSession } from "@/lib/auth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import { Metadata } from "next";
import {
  getFinancialReportData,
  getProductionCostAnalysis,
  getActualBatchVarianceCostAnalysis,
} from "@/app/actions/finance";
import { PrintReportButton } from "./PrintReportButton";
import {
  TrendingUp,
  BarChart2,
  Target,
  DollarSign,
  PieChart,
  Sparkles,
  Layers,
  Cpu,
  Scale,
  AlertOctagon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "التقارير المالية والأرباح | النظام المحاسبي",
  description: "تحليل الأداء الربحي والتكاليف التشغيلية للمحطة وتكلفة المتر المكعب",
};

export default async function AccountingReportsPage() {
  await requireRole(["ACCOUNTANT", "MANAGER"]);

  const session = await getSession();
  const companyId = session?.companyId;

  if (!companyId) {
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        خطأ: لم يتم العثور على جلسة عمل نشطة للشركة
      </div>
    );
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);
  const isRtl = lang === "ar";

  const [data, costAnalysis, plcVarianceData] = await Promise.all([
    getFinancialReportData(companyId),
    getProductionCostAnalysis(companyId),
    getActualBatchVarianceCostAnalysis(companyId),
  ]);

  const formatCurrency = (amount: number) => {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} ${data.currency}`;
  };

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {dict.accounting.reports}
          </h2>
          <p className="text-slate-400 font-bold text-sm mt-1 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-emerald-500/40"></span>
            {dict.accounting.profit_cost_analysis} — {data.monthLabel}
          </p>
        </div>
        <PrintReportButton />
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title={dict.accounting.revenue || "الإيرادات المحصلة"}
          value={formatCurrency(data.totalRevenue)}
          subValue={data.monthLabel}
          icon="TrendingUp"
          status="success"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={dict.accounting.operating_cost}
          value={formatCurrency(data.totalOperatingCosts)}
          subValue="مصروفات تشغيلية"
          icon="BarChart2"
          status="warning"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={dict.accounting.payroll || "كتلة الرواتب"}
          value={formatCurrency(data.totalPayrollCosts)}
          subValue="مستحقات الموظفين"
          icon="Users"
          status="neutral"
          dir={isRtl ? "rtl" : "ltr"}
        />
        <KpiCard
          title={dict.accounting.net_profit}
          value={formatCurrency(data.netProfit)}
          subValue={`هامش الربح: ${data.profitMargin}%`}
          icon="Target"
          status={data.netProfit >= 0 ? "success" : "danger"}
          trend={data.profitMargin > 0 ? `+${data.profitMargin}%` : `${data.profitMargin}%`}
          dir={isRtl ? "rtl" : "ltr"}
        />
      </div>

      {/* Dynamic Visual Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                {dict.accounting.cost_linkage || "تحليل توزيع الإيرادات والتكاليف"}
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                مقارنة نسبية بين الإيرادات والمصروفات والرواتب للشهر الحالي
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-xl">
              العملة: {data.currency}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 h-[240px] items-end pt-8">
            <div className="flex flex-col items-center gap-3 h-full justify-end group">
              <span className="text-xs font-mono font-bold text-blue-400">
                {data.breakdown.revenuePct}%
              </span>
              <div
                className="w-full bg-blue-500/20 border border-blue-500/40 rounded-t-2xl transition-all duration-700 group-hover:bg-blue-500/30"
                style={{ height: `${Math.max(12, data.breakdown.revenuePct)}%` }}
              ></div>
              <span className="text-[10px] font-black text-slate-400 text-center">
                {dict.accounting.revenue || "الإيرادات"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 h-full justify-end group">
              <span className="text-xs font-mono font-bold text-rose-400">
                {data.breakdown.expensesPct}%
              </span>
              <div
                className="w-full bg-rose-500/20 border border-rose-500/40 rounded-t-2xl transition-all duration-700 group-hover:bg-rose-500/30"
                style={{ height: `${Math.max(12, data.breakdown.expensesPct)}%` }}
              ></div>
              <span className="text-[10px] font-black text-slate-400 text-center">
                {dict.accounting.expenses || "المصروفات"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 h-full justify-end group">
              <span className="text-xs font-mono font-bold text-amber-400">
                {data.breakdown.payrollPct}%
              </span>
              <div
                className="w-full bg-amber-500/20 border border-amber-500/40 rounded-t-2xl transition-all duration-700 group-hover:bg-amber-500/30"
                style={{ height: `${Math.max(12, data.breakdown.payrollPct)}%` }}
              ></div>
              <span className="text-[10px] font-black text-slate-400 text-center">
                {dict.accounting.payroll || "الرواتب"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 h-full justify-end group">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {data.breakdown.profitPct}%
              </span>
              <div
                className="w-full bg-emerald-500/20 border border-emerald-500/40 rounded-t-2xl transition-all duration-700 group-hover:bg-emerald-500/30"
                style={{ height: `${Math.max(12, data.breakdown.profitPct)}%` }}
              ></div>
              <span className="text-[10px] font-black text-slate-400 text-center">
                {dict.accounting.net_profit || "صافي الربح"}
              </span>
            </div>
          </div>
        </div>

        {/* Expense Category Breakdown Card */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-indigo-400" />
              <h4 className="text-base font-black text-white">
                توزيع بنود المصروفات
              </h4>
            </div>

            {data.expenseCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-500 italic text-xs">
                لا توجد مصروفات مسجلة لهذا الشهر
              </div>
            ) : (
              <div className="space-y-3.5">
                {data.expenseCategories.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">
                        {cat.category === "FUEL"
                          ? "وقود ومحروقات"
                          : cat.category === "MAINTENANCE"
                            ? "صيانة وإصلاحات"
                            : cat.category === "RAW_MATERIALS"
                              ? "مواد خام"
                              : "نثريات ومصروفات عامة"}
                      </span>
                      <span className="font-mono text-slate-400">
                        {formatCurrency(cat.amount)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-300">
              <span className="font-bold text-white block mb-0.5">مؤشر الربحية:</span>
              نسبة هامش الربح الحالي هي {data.profitMargin}%. يتم تحديث هذه النسبة تلقائياً مع كل فاتورة ومصروف جديد.
            </div>
          </div>
        </div>
      </div>

      {/* Production Batch Costing Breakdown Section */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              تحليل تكلفة وهوامش الربح للمتر المكعب (م³ للخلطات الخرسانية)
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-1">
              مقارنة تكلفة المواد الخام التقديرية لكل متر مكعب مع سعر البيع المعتمد ونسبة الهامش
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  رمز الخلطة
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  اسم الخلطة / الرتبة
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  سعر البيع المعتمد (م³)
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  تكلفة المواد الخام (م³)
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  هامش الربح لكل م³
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                  نسبة الهامش (%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {costAnalysis.mixes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic text-xs">
                    لا توجد خلطات خرسانية مسجلة حالياً
                  </td>
                </tr>
              ) : (
                costAnalysis.mixes.map((mix) => (
                  <tr key={mix.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-5 font-mono font-bold text-blue-400">
                      {mix.code}
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-white block">{mix.name}</span>
                      {mix.grade && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          رتبة: {mix.grade}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 font-mono font-bold text-slate-200">
                      {formatCurrency(mix.sellingPrice)}
                    </td>
                    <td className="px-6 py-5 font-mono text-rose-400">
                      {formatCurrency(mix.estimatedCost)}
                    </td>
                    <td className="px-6 py-5 font-mono font-black text-emerald-400">
                      {formatCurrency(mix.grossMargin)}
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-black font-mono">
                        %{mix.marginPercentage}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PLC Sensors Actual vs Target Variance Cost Section */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              ربط الحسابات بوزنات حساسات الـ PLC الفعلية (Actual vs Target Batch Costing)
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-1">
              مقارنة الاستهلاك الفعلي للمواد الخام لكل دفعة (Batch) مع التكلفة التصميمية وحساب فروقات الهدر المالي
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 text-right">
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي فرق التكلفة (الهدر)</span>
              <span
                className={`text-sm font-mono font-black ${
                  plcVarianceData.totalVarianceCost > 0
                    ? "text-rose-400"
                    : plcVarianceData.totalVarianceCost < 0
                      ? "text-emerald-400"
                      : "text-slate-300"
                }`}
              >
                {plcVarianceData.totalVarianceCost > 0 ? "+" : ""}
                {formatCurrency(plcVarianceData.totalVarianceCost)}
              </span>
            </div>
          </div>
        </div>

        {!plcVarianceData.isEnabled ? (
          <div className="py-10 px-6 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <Scale className="w-8 h-8 text-slate-500 mx-auto" />
            <span className="text-sm font-bold text-slate-300 block">
              ميزة ربط وزنات الـ PLC مع الحسابات معطلة حالياً لهذه الشركة
            </span>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              يمكن تفعيل أو تعطيل هذه الميزة بمرونة تامة من إعدادات الشركة المالية عند الرغبة في احتساب فروقات الحساسات الحقيقية.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/[0.01]">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    رقم الدفعة / الطلب
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    الخلطة والكمية
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    التكلفة التصميمية
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    التكلفة الفعلية (PLC)
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    فرق الإسمنت (كغم)
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase border-b border-white/5">
                    فرق التكلفة والنسبة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {plcVarianceData.batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic text-xs">
                      لا توجد دفعات إنتاج مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  plcVarianceData.batches.map((item) => (
                    <tr key={item.batchId} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-5">
                        <span className="font-mono font-bold text-blue-400 block">
                          Batch #{item.batchId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-white block">{item.mixCode}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.quantity} م³
                        </span>
                      </td>
                      <td className="px-6 py-5 font-mono text-slate-300">
                        {formatCurrency(item.targetCost)}
                      </td>
                      <td className="px-6 py-5 font-mono text-indigo-300 font-bold">
                        {formatCurrency(item.actualCost)}
                      </td>
                      <td className="px-6 py-5 font-mono">
                        <span
                          className={`${
                            item.cementDiffKg > 0
                              ? "text-rose-400 font-bold"
                              : item.cementDiffKg < 0
                                ? "text-emerald-400 font-bold"
                                : "text-slate-400"
                          }`}
                        >
                          {item.cementDiffKg > 0 ? `+${item.cementDiffKg}` : item.cementDiffKg} كغم
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              item.varianceCost > 0
                                ? "text-rose-400"
                                : item.varianceCost < 0
                                  ? "text-emerald-400"
                                  : "text-slate-300"
                            }`}
                          >
                            {item.varianceCost > 0 ? `+${item.varianceCost}` : item.varianceCost} {plcVarianceData.currency}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ${
                              item.variancePercentage > 0
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : item.variancePercentage < 0
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                            }`}
                          >
                            {item.variancePercentage > 0 ? `+${item.variancePercentage}%` : `${item.variancePercentage}%`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


