import { getLabIntelligenceReport } from "@/app/actions/lab-intelligence";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

interface MixReportData {
  mixId: number;
  mixName: string;
  grade: string | null;
  targetMpa: number;
  analysis: {
    status: "DANGER" | "WARNING" | "OK" | "UNKNOWN";
    message: string;
    details: string;
    failCount: number;
    passCount: number;
    avgMpa: number;
  };
  adjustment: {
    shouldAdjust: boolean;
    suggestion: string;
    newCementKg: number | null;
  };
  predictions: Array<{
    orderId: number;
    sevenDay: number;
    predicted: number;
    confidence: "HIGH" | "MEDIUM" | "LOW";
  }>;
  testCount: number;
}

// مكوّن بطاقة كل خلطة
function MixCard({ data, isRtl }: { data: MixReportData; isRtl: boolean }) {
  const statusColors = {
    DANGER: "border-red-500/40 bg-red-500/5",
    WARNING: "border-amber-500/40 bg-amber-500/5",
    OK: "border-emerald-500/40 bg-emerald-500/5",
    UNKNOWN: "border-slate-700 bg-slate-800/30",
  };
  const statusBadge = {
    DANGER: "bg-red-500/20 text-red-400 border-red-500/30",
    WARNING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    OK: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    UNKNOWN: "bg-slate-700 text-slate-400 border-slate-600",
  };
  const status = data.analysis.status;

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${statusColors[status]}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-white text-base">{data.mixName}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl ? "التصنيف" : "Grade"}: {data.grade || "—"} •{" "}
            {isRtl ? "المستهدف" : "Target"}: {data.targetMpa} MPa
          </p>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-lg border ${statusBadge[status]}`}
        >
          {status === "DANGER"
            ? isRtl
              ? "خطر"
              : "DANGER"
            : status === "WARNING"
              ? isRtl
                ? "تحذير"
                : "WARNING"
              : status === "OK"
                ? isRtl
                  ? "جيد"
                  : "OK"
                : isRtl
                  ? "غير معروف"
                  : "UNKNOWN"}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-white">
            {data.analysis.avgMpa.toFixed(1)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isRtl ? "متوسط MPa" : "Avg MPa"}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-emerald-400">
            {data.analysis.passCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isRtl ? "ناجح" : "Passed"}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-red-400">
            {data.analysis.failCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isRtl ? "راسب" : "Failed"}
          </p>
        </div>
      </div>

      {/* Analysis message */}
      <p className="text-sm text-slate-300 leading-relaxed">
        {data.analysis.message}
      </p>
      <p className="text-xs text-slate-500">{data.analysis.details}</p>

      {/* Adjustment suggestion */}
      {data.adjustment.shouldAdjust && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <p className="text-xs font-bold text-amber-400 mb-1">
            {isRtl ? "💡 اقتراح تعديل الخلطة" : "💡 Mix Adjustment Suggestion"}
          </p>
          <p className="text-xs text-slate-300">{data.adjustment.suggestion}</p>
        </div>
      )}

      {/* 7-day predictions */}
      {data.predictions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {isRtl ? "توقع قوة 28 يوم" : "28-Day Strength Prediction"}
          </p>
          {data.predictions.slice(0, 3).map((p, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {isRtl ? "طلب" : "Order"} #{p.orderId}
              </span>
              <span className="text-slate-300">
                {p.sevenDay} MPa →{" "}
                <strong className="text-indigo-400">{p.predicted} MPa</strong> (
                {isRtl ? "ثقة" : "conf"}: {p.confidence})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function LabIntelligencePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const lang = "ar"; // نستخدم اللغة من preferences لاحقاً
  const isRtl = lang === "ar";

  const result = await getLabIntelligenceReport();

  if (!result.success || !result.report) {
    return (
      <div className="p-6 text-center text-slate-400">
        {isRtl
          ? "تعذّر تحميل بيانات ذكاء المختبر."
          : "Failed to load lab intelligence data."}
      </div>
    );
  }

  const report = result.report as unknown as MixReportData[];

  const dangerCount = report.filter(
    (r) => r.analysis.status === "DANGER",
  ).length;
  const warningCount = report.filter(
    (r) => r.analysis.status === "WARNING",
  ).length;
  const okCount = report.filter((r) => r.analysis.status === "OK").length;

  return (
    <div className="p-4 md:p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          {isRtl ? "🧠 ذكاء المختبر" : "🧠 Lab Intelligence"}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {isRtl
            ? "تحليل تلقائي لنتائج الخلطات الخرسانية — يتحدث كل مرة تفتح الصفحة"
            : "Automatic analysis of concrete mix results — refreshes on every page load"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-red-400">{dangerCount}</p>
          <p className="text-xs text-red-300 mt-1">
            {isRtl ? "خلطات خطرة" : "Danger"}
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-amber-400">{warningCount}</p>
          <p className="text-xs text-amber-300 mt-1">
            {isRtl ? "تحذيرات" : "Warnings"}
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-emerald-400">{okCount}</p>
          <p className="text-xs text-emerald-300 mt-1">
            {isRtl ? "خلطات جيدة" : "OK"}
          </p>
        </div>
      </div>

      {/* Mix Cards */}
      {report.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          {isRtl
            ? "لا توجد بيانات اختبارات كافية بعد."
            : "No test data available yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.map((item) => (
            <MixCard key={item.mixId} data={item} isRtl={isRtl} />
          ))}
        </div>
      )}
    </div>
  );
}
