"use client";

import { useEffect, useState } from "react";
import { getExecutiveSummary } from "@/app/actions/reporting";

interface DashboardData {
  metrics: {
    totalRevenue: number;
    activeOrders: number;
    totalProductionVol: number;
    labPending: number;
  };
  trends: {
    production: { date: string; value: number }[];
    revenue: { date: string; value: number }[];
  };
  insight: string;
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Check language from cookie at render time (not in effect)
  const isArabic =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("language="))
          ?.split("=")[1] !== "en"
      : true;

  useEffect(() => {
    async function fetch() {
      const res = await getExecutiveSummary();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || "تم رفض الوصول");
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const t = {
    loading: "جاري تحميل التقارير التنفيذية...",
    accessRestricted: "الوصول مقيّد 🔒",
    enablePremium: "فعّل الخطة المميزة للوصول إلى هذه اللوحة.",
    executiveOverview: "النظرة التنفيذية",
    realtimeMetrics: "مقاييس الأداء في الوقت الفعلي لاتخاذ القرارات.",
    premium: "مميز",
    aiInsight: "التحليل الذكي",
    totalRevenue: "إجمالي الإيرادات",
    activeOrders: "الطلبات النشطة",
    productionVol: "حجم الإنتاج",
    labPending: "قيد المختبر",
    productionTrend: "اتجاه الإنتاج (7 أيام)",
    revenueTrend: "اتجاه الإيرادات (7 أيام)",
  };

  if (loading)
    return (
      <div
        className="p-8 text-center text-gray-500"
        dir={isArabic ? "rtl" : "ltr"}
      >
        {t.loading}
      </div>
    );
  if (error)
    return (
      <div
        className="flex flex-col items-center justify-center p-12"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="rounded-lg bg-red-100 p-6 text-center shadow-lg">
          <h2 className="mb-2 text-xl font-bold text-red-700">
            {t.accessRestricted}
          </h2>
          <p className="text-red-600">{error}</p>
          <p className="mt-4 text-sm text-gray-500">{t.enablePremium}</p>
        </div>
      </div>
    );

  if (!data) return null;

  return (
    <div
      className="min-h-screen bg-gray-50 p-6 space-y-6"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {t.executiveOverview}
          </h1>
          <p className="text-sm text-gray-500">{t.realtimeMetrics}</p>
        </div>
        <span className="rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-800">
          {t.premium}
        </span>
      </div>

      {/* AI Insight */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <h2 className="text-lg font-bold">{t.aiInsight}</h2>
        </div>
        <p className="text-lg opacity-90">{data.insight}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <MetricCard
          label={t.totalRevenue}
          value={`${data.metrics.totalRevenue.toLocaleString("en-US")} د.ع`}
          color="green"
        />
        <MetricCard
          label={t.activeOrders}
          value={data.metrics.activeOrders}
          color="blue"
        />
        <MetricCard
          label={t.productionVol}
          value={`${data.metrics.totalProductionVol} م³`}
          color="purple"
        />
        <MetricCard
          label={t.labPending}
          value={data.metrics.labPending}
          color="orange"
        />
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ChartCard
          title={t.productionTrend}
          data={data.trends.production}
          color="bg-purple-500"
        />
        <ChartCard
          title={t.revenueTrend}
          data={data.trends.revenue}
          color="bg-green-500"
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colors: Record<string, string> = {
    green: "text-green-600 bg-green-50",
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
    orange: "text-orange-600 bg-orange-50",
  };

  return (
    <div className={`rounded-lg bg-white p-6 shadow-sm border border-gray-100`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${colors[color].split(" ")[0]}`}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  data,
  color,
}: {
  title: string;
  data: { date: string; value: number }[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-bold text-gray-700">{title}</h3>
      <div className="flex h-40 items-end justify-between gap-2">
        {data.map((d) => (
          <div
            key={d.date}
            className="flex flex-1 flex-col items-center gap-1 group"
          >
            <div
              className={`w-full rounded-t ${color} transition-all duration-500 opacity-80 group-hover:opacity-100 flex flex-col justify-end`}
              style={
                {
                  "--bar-height": `${Math.round((d.value / max) * 100)}%`,
                } as React.CSSProperties
              }
            >
              <div className="h-[var(--bar-height)] w-full bg-current" />
            </div>
            <div className="text-sm font-bold text-gray-400 rotate-0 md:rotate-0">
              {d.date.split("-").slice(1).join("/")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
