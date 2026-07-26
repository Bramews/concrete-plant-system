"use client";

import { Icons } from "@/components/ui/Icons";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { PremiumBadge } from "@/components/ui/premium/PremiumBadge";
import { usePreferences } from "@/context/PreferenceContext";
import { DictionaryType } from "@/lib/dictionary";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  icon: keyof typeof Icons;
  color: "cyan" | "emerald" | "amber" | "rose";
}

function MetricCard({ title, value, trend, icon, color }: MetricCardProps) {
  const Icon = Icons[icon];
  const colorClasses = {
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <PremiumCard className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Icon className="w-24 h-24" />
      </div>

      <div className="flex gap-4 items-start relative z-10">
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {value}
          </h3>
          {trend && (
            <div className="mt-2 text-sm font-bold flex items-center gap-1">
              <span className="text-emerald-400 font-bold">{trend}</span>
              <span className="text-slate-500">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </PremiumCard>
  );
}

interface ReportsViewProps {
  data: any;
  dict: DictionaryType;
}

export function ReportsView({ data, dict }: ReportsViewProps) {
  const { preferences } = usePreferences();
  const lang = preferences.language;

  const m = data?.metrics;

  const metrics = [
    {
      title: "إجمالي الإيرادات",
      value: `$${m?.totalRevenue?.toLocaleString() || "0"}`,
      icon: "Wallet" as const,
      color: "emerald" as const,
      trend:
        data?.trends?.growth?.revenue > 0
          ? `+${data.trends.growth.revenue}%`
          : `${data?.trends?.growth?.revenue || 0}%`,
    },
    {
      title: "حجم الإنتاج",
      value: `${m?.totalProductionVol?.toLocaleString() || "0"} m³`,
      icon: "Factory" as const,
      color: "cyan" as const,
      trend:
        data?.trends?.growth?.production > 0
          ? `+${data.trends.growth.production}%`
          : `${data?.trends?.growth?.production || 0}%`,
    },
    {
      title: "الطلبيات النشطة",
      value: m?.activeOrders || "0",
      icon: "Orders" as const,
      color: "amber" as const,
    },
    {
      title: "بانتظار المختبر",
      value: m?.labPending || "0",
      icon: "Lab" as const,
      color: "rose" as const,
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            تقارير الأداء التنفيذي
          </h1>
          <p className="text-muted-foreground">
            نظرة شاملة على مؤشرات الأداء الحيوية للمصنع
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="premium-btn py-2 px-4 text-sm font-bold flex items-center gap-2"
            title="تصدير"
          >
            <Icons.FileText className="w-4 h-4" />
            تصدير PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((item, i) => (
          <MetricCard key={i} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <PremiumCard className="lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-white">
              اتجاهات الإنتاج (آخر 7 أيام)
            </h3>
            <PremiumBadge variant="secondary" size="sm">
              m³
            </PremiumBadge>
          </div>

          <div className="h-[250px] flex items-end gap-4 px-2">
            {data?.trends?.production?.map((d: any, i: number) => {
              const max = Math.max(
                ...data.trends.production.map((p: any) => p.value || 0),
                1,
              );
              const height = ((d.value || 0) / max) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-3 group"
                >
                  <div className="w-full relative">
                    <div
                      className="w-full bg-cyan-500/20 border-t-2 border-cyan-400 group-hover:bg-cyan-500/40 transition-all rounded-t-sm"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold text-cyan-400 font-mono">
                        {d.value}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-500 uppercase font-mono">
                    {new Date(d.date).toLocaleDateString("ar-EG", {
                      weekday: "short",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </PremiumCard>

        <PremiumCard className="relative overflow-hidden">
          <div className="absolute -top-10 -right-10 p-10 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2 text-purple-400">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Icons.Globe className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest">
                رؤية الذكاء الاصطناعي
              </span>
            </div>
            <p className="text-lg font-medium text-slate-200 leading-relaxed italic">
              &quot;
              {data?.insight || "لا توجد رؤى حالياً"}
              &quot;
            </p>
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}
